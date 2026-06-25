import { Injectable, Logger } from '@nestjs/common';

import {
  DAYS_OF_WEEK,
  getTodayDayOfWeek,
} from '../../common/constants/days-of-week';
import { parseTasksFromInput } from '../../common/constants/week-plan';
import { DayOfWeek } from '../../common/enums/day-of-week.enum';
import { OpenAiService } from '../ai/openai.service';
import {
  ActivityPoolItem,
  CategoryMetaForPlanner,
  WeekPlannerInput,
  WeekPlannerPlacement,
  WeekPlannerSkipped,
} from '../ai/types/week-planner.types';
import { WeekPlannerService } from '../ai/week-planner.service';
import { CategoriesAppService } from '../categories-app/categories-app.service';
import {
  DayPlan,
  TimelineBlock,
  WeekPlan,
} from '../users/schemas/user.schema';
import { TimelineScheduleService } from './timeline-schedule.service';

export interface OrganizeWeekResult {
  weekPlan: WeekPlan;
  aiSummary?: string;
  usedAi: boolean;
  skipped: WeekPlannerSkipped[];
}

@Injectable()
export class WeekOrganizerService {
  private readonly logger = new Logger(WeekOrganizerService.name);

  constructor(
    private readonly timelineSchedule: TimelineScheduleService,
    private readonly weekPlanner: WeekPlannerService,
    private readonly openAi: OpenAiService,
    private readonly categoriesAppService: CategoriesAppService,
  ) {}

  async generate(
    weekInputs: Record<string, string>,
    selectedActivities: Record<string, string[]>,
    categoriesSkipped: boolean,
  ): Promise<OrganizeWeekResult> {
    const resolvedInputs = this.resolveWeekInputsByDay(weekInputs);
    const stamp = Date.now();
    const pool = categoriesSkipped ? [] : this.buildActivityPool(selectedActivities);

    const draftDays = this.buildFixedBlockDays(resolvedInputs, stamp);

    for (const dayPlan of draftDays) {
      dayPlan.blocks = this.timelineSchedule.recalculateTimes(dayPlan.blocks, {
        dayStart: this.getDayStart(dayPlan.day),
      });
    }

    const fixedByDay = this.buildFixedSummaries(draftDays);

    let aiSummary: string | undefined;
    let usedAi = false;
    let skipped: WeekPlannerSkipped[] = [];

    if (pool.length > 0 && this.openAi.isConfigured) {
      const categories = await this.loadCategoryMeta();
      const plannerInput: WeekPlannerInput = {
        today: getTodayDayOfWeek(),
        fixedByDay,
        activityPool: pool,
        categories,
      };

      const aiResult = await this.weekPlanner.plan(plannerInput);

      if (aiResult) {
        usedAi = true;
        aiSummary = aiResult.summary;
        skipped = aiResult.skipped;
        this.applyAiPlacements(draftDays, aiResult.placements, stamp);
        this.logger.log(
          `IA: ${aiResult.placements.length} colocadas, ${aiResult.skipped.length} omitidas.`,
        );
      } else {
        this.logger.warn('Fallback al organizador local (IA no disponible).');
        this.applyLegacyCategoryBlocks(draftDays, selectedActivities, stamp);
      }
    } else if (pool.length > 0) {
      this.applyLegacyCategoryBlocks(draftDays, selectedActivities, stamp);
    }

    const days: DayPlan[] = draftDays.map(({ day, userInput, blocks }) => ({
      day,
      userInput,
      blocks: usedAi
        ? this.timelineSchedule.sortByStartTime(blocks)
        : this.timelineSchedule.recalculateTimes(blocks, {
            dayStart: this.getDayStart(day),
          }),
    }));

    return {
      weekPlan: { days, updatedAt: new Date() },
      aiSummary,
      usedAi,
      skipped,
    };
  }

  private buildFixedBlockDays(
    resolvedInputs: Partial<Record<DayOfWeek, string>>,
    stamp: number,
  ): Array<{ day: DayOfWeek; userInput: string; blocks: TimelineBlock[] }> {
    return DAYS_OF_WEEK.map((day) => {
      const userInput = resolvedInputs[day] ?? '';
      const blocks: TimelineBlock[] = [];

      parseTasksFromInput(userInput).forEach((task, index) => {
        blocks.push({
          id: `${day}-user-${index}-${stamp}`,
          label: task,
          categoryId: 'usuario',
          startTime: '08:00',
          endTime: '09:00',
          isUserDefined: true,
          cancelled: false,
          completed: false,
        });
      });

      return { day, userInput, blocks };
    });
  }

  private buildFixedSummaries(
    draftDays: Array<{ day: DayOfWeek; blocks: TimelineBlock[] }>,
  ): WeekPlannerInput['fixedByDay'] {
    return DAYS_OF_WEEK.reduce(
      (acc, day) => {
        const dayPlan = draftDays.find((item) => item.day === day);
        acc[day] = (dayPlan?.blocks ?? []).map((block) => ({
          label: block.label,
          startTime: block.startTime,
          endTime: block.endTime,
        }));
        return acc;
      },
      {} as WeekPlannerInput['fixedByDay'],
    );
  }

  private buildActivityPool(
    selected: Record<string, string[]>,
  ): ActivityPoolItem[] {
    const pool: ActivityPoolItem[] = [];
    const seen = new Set<string>();

    for (const [categoryId, labels] of Object.entries(selected)) {
      for (const label of labels ?? []) {
        const trimmed = label.trim();
        if (!trimmed) {
          continue;
        }

        const key = `${categoryId}::${trimmed.toLowerCase()}`;
        if (seen.has(key)) {
          continue;
        }

        seen.add(key);
        pool.push({ label: trimmed, categoryId });
      }
    }

    return pool;
  }

  private async loadCategoryMeta(): Promise<CategoryMetaForPlanner[]> {
    const categories = await this.categoriesAppService.findAllActive();
    return categories.map((category) => ({
      categoryId: category.categoryId,
      label: category.label,
      description: category.description,
      manageWeight: category.manageWeight,
      manageMax: category.manageMax,
    }));
  }

  private applyAiPlacements(
    draftDays: Array<{ day: DayOfWeek; blocks: TimelineBlock[] }>,
    placements: WeekPlannerPlacement[],
    stamp: number,
  ): void {
    for (const placement of placements) {
      const dayPlan = draftDays.find((item) => item.day === placement.day);
      if (!dayPlan) {
        continue;
      }

      dayPlan.blocks.push({
        id: `${placement.day}-${placement.categoryId}-ai-${stamp}-${dayPlan.blocks.length}`,
        label: placement.label,
        categoryId: placement.categoryId,
        startTime: placement.startTime,
        endTime: placement.endTime,
        isUserDefined: false,
        cancelled: false,
        completed: false,
      });
    }
  }

  /** Fallback: algoritmo local anterior (reparto mecánico). */
  private applyLegacyCategoryBlocks(
    draftDays: Array<{ day: DayOfWeek; blocks: TimelineBlock[] }>,
    selected: Record<string, string[]>,
    stamp: number,
  ): void {
    draftDays.forEach((dayPlan, dayIndex) => {
      Object.keys(selected).forEach((categoryId, categoryIndex) => {
        const labels = selected[categoryId] ?? [];
        if (!labels.length) {
          return;
        }

        const label = labels[(dayIndex + categoryIndex) % labels.length];
        dayPlan.blocks.push({
          id: `${dayPlan.day}-${categoryId}-${dayIndex}-${categoryIndex}-${stamp}`,
          label,
          categoryId,
          startTime: '08:00',
          endTime: '09:00',
          isUserDefined: false,
          cancelled: false,
          completed: false,
        });
      });
    });
  }

  private resolveWeekInputsByDay(
    weekInputs: Record<string, string>,
  ): Partial<Record<DayOfWeek, string>> {
    const resolved: Partial<Record<DayOfWeek, string>> = {};

    for (const day of DAYS_OF_WEEK) {
      const legacyValue = weekInputs[day]?.trim();
      if (legacyValue) {
        resolved[day] = legacyValue;
      }
    }

    const semanticOffsets: Array<[string, number]> = [
      ['today', 0],
      ['tomorrow', 1],
      ['dayAfterTomorrow', 2],
    ];

    for (const [key, offset] of semanticOffsets) {
      const value = weekInputs[key]?.trim();
      if (!value) {
        continue;
      }

      const date = new Date();
      date.setDate(date.getDate() + offset);
      resolved[DAYS_OF_WEEK[date.getDay()]] = value;
    }

    return resolved;
  }

  private getDayStart(day: DayOfWeek): string {
    const isWeekend = day === DayOfWeek.DOMINGO || day === DayOfWeek.SABADO;
    return this.timelineSchedule.suggestDayStart(isWeekend);
  }
}
