import { Injectable, Logger } from '@nestjs/common';

import {
  addMinutes,
  isValidTime,
  timesOverlap as slotsOverlap,
  toMinutes,
} from '../../common/utils/time.util';
import { DayOfWeek } from '../../common/enums/day-of-week.enum';
import {
  CATEGORY_PLACEMENT_RULES,
  WEEKEND_DAYS,
  WORK_DAYS,
} from './category-planner.rules';
import { OpenAiService } from './openai.service';
import {
  buildWeekPlannerSystemPrompt,
  buildWeekPlannerUserMessage,
} from './prompts/week-planner.prompt';
import {
  ActivityPoolItem,
  WeekPlannerInput,
  WeekPlannerPlacement,
  WeekPlannerResult,
  WeekPlannerSkipped,
} from './types/week-planner.types';

const VALID_DAYS = new Set<string>(Object.values(DayOfWeek));
const ALL_DAYS = Object.values(DayOfWeek);

@Injectable()
export class WeekPlannerService {
  private readonly logger = new Logger(WeekPlannerService.name);

  constructor(private readonly openAi: OpenAiService) {}

  async plan(input: WeekPlannerInput): Promise<WeekPlannerResult | null> {
    if (!this.openAi.isConfigured) {
      return null;
    }

    if (input.activityPool.length === 0) {
      return {
        placements: [],
        skipped: [],
        summary: 'Semana basada solo en tus tareas fijas.',
      };
    }

    try {
      const client = this.openAi.getClient();
      const response = await client.chat.completions.create({
        model: this.openAi.model,
        max_tokens: this.openAi.maxOutputTokens,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildWeekPlannerSystemPrompt() },
          { role: 'user', content: buildWeekPlannerUserMessage(input) },
        ],
      });

      const usage = response.usage;
      if (usage) {
        this.logger.log(
          `OpenAI tokens — prompt: ${usage.prompt_tokens}, completion: ${usage.completion_tokens}`,
        );
      }

      const raw = response.choices[0]?.message?.content?.trim();
      if (!raw) {
        this.logger.warn('OpenAI devolvió respuesta vacía.');
        return null;
      }

      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const validated = this.validateAndSanitize(parsed, input);
      if (!validated) {
        return null;
      }

      const filled = this.fillMissingPlacements(validated.placements, input);
      const skipped = validated.skipped.filter(
        (item) =>
          !filled.some(
            (p) =>
              this.normalizeLabel(p.label) === this.normalizeLabel(item.label),
          ),
      );

      return {
        placements: filled,
        skipped,
        summary: validated.summary,
      };
    } catch (error) {
      this.logger.error(
        'Error al planificar con OpenAI.',
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    }
  }

  private validateAndSanitize(
    parsed: Record<string, unknown>,
    input: WeekPlannerInput,
  ): WeekPlannerResult | null {
    const pool = this.buildPoolIndex(input.activityPool);
    const placements: WeekPlannerPlacement[] = [];
    const slotKeys = new Set<string>();
    const countByActivity = new Map<string, number>();

    const rawPlacements = Array.isArray(parsed['placements'])
      ? parsed['placements']
      : [];

    for (const item of rawPlacements) {
      if (!item || typeof item !== 'object') {
        continue;
      }

      const record = item as Record<string, unknown>;
      const day = String(record['day'] ?? '');
      const label = String(record['label'] ?? '').trim();
      const categoryId = String(record['categoryId'] ?? '').trim();
      const startTime = String(record['startTime'] ?? '').trim();
      const endTime = String(record['endTime'] ?? '').trim();

      if (
        !VALID_DAYS.has(day) ||
        !label ||
        !categoryId ||
        !isValidTime(startTime) ||
        !isValidTime(endTime)
      ) {
        continue;
      }

      const poolKey = this.normalizeKey(label, categoryId);
      if (!pool.has(poolKey)) {
        continue;
      }

      const normalizedLabel = pool.get(poolKey)!.label;
      const activityKey = this.normalizeKey(normalizedLabel, categoryId);

      if (
        this.isDuplicateOfFixed(
          normalizedLabel,
          input.fixedByDay[day as DayOfWeek],
        )
      ) {
        continue;
      }

      const weeklyCount = countByActivity.get(activityKey) ?? 0;
      const maxWeekly = CATEGORY_PLACEMENT_RULES[categoryId]?.perWeek ?? 7;
      if (weeklyCount >= maxWeekly) {
        continue;
      }

      const slotKey = `${day}::${startTime}::${normalizedLabel}`;
      if (slotKeys.has(slotKey)) {
        continue;
      }

      if (this.timesOverlap(day as DayOfWeek, startTime, endTime, placements)) {
        continue;
      }

      placements.push({
        day: day as DayOfWeek,
        label: normalizedLabel,
        categoryId,
        startTime,
        endTime,
      });
      slotKeys.add(slotKey);
      countByActivity.set(activityKey, weeklyCount + 1);
    }

    const skipped: WeekPlannerSkipped[] = Array.isArray(parsed['skipped'])
      ? (parsed['skipped'] as Array<Record<string, unknown>>)
          .map((item) => ({
            label: String(item['label'] ?? '').trim(),
            reason: String(item['reason'] ?? '').trim() || 'Duplicado con bloque fijo.',
          }))
          .filter((item) => item.label.length > 0)
      : [];

    const summary =
      typeof parsed['summary'] === 'string' && parsed['summary'].trim()
        ? parsed['summary'].trim()
        : 'Semana organizada con armonía entre tus actividades.';

    return { placements, skipped, summary };
  }

  private fillMissingPlacements(
    placements: WeekPlannerPlacement[],
    input: WeekPlannerInput,
  ): WeekPlannerPlacement[] {
    const result = [...placements];

    for (const activity of input.activityPool) {
      const rule = CATEGORY_PLACEMENT_RULES[activity.categoryId];
      const expected = rule?.perWeek ?? 1;
      const activityKey = this.normalizeKey(activity.label, activity.categoryId);
      const existing = result.filter(
        (p) =>
          this.normalizeKey(p.label, p.categoryId) === activityKey,
      );

      if (existing.length >= expected) {
        continue;
      }

      const need = expected - existing.length;
      const added = this.addFallbackPlacements(
        activity,
        need,
        existing,
        result,
        input,
      );
      result.push(...added);

      if (added.length < need) {
        this.logger.warn(
          `Fallback parcial para "${activity.label}" (${added.length}/${need}).`,
        );
      }
    }

    return result;
  }

  private addFallbackPlacements(
    activity: ActivityPoolItem,
    count: number,
    existing: WeekPlannerPlacement[],
    allPlacements: WeekPlannerPlacement[],
    input: WeekPlannerInput,
  ): WeekPlannerPlacement[] {
    const rule = CATEGORY_PLACEMENT_RULES[activity.categoryId];
    const durationMin = rule?.defaultDurationMin ?? 30;
    const added: WeekPlannerPlacement[] = [];
    const usedDays = new Set(existing.map((p) => p.day));

    let startTime =
      existing[0]?.startTime ?? rule?.defaultStartTime ?? '10:00';
    let endTime =
      existing[0]?.endTime ??
      addMinutes(startTime, durationMin);

    const candidateDays = this.pickCandidateDays(
      activity.categoryId,
      count,
      usedDays,
    );

    for (const day of candidateDays) {
      if (added.length >= count) {
        break;
      }

      if (usedDays.has(day) && activity.categoryId === 'pendientes') {
        continue;
      }

      const slot = this.findFreeSlot(
        day,
        startTime,
        durationMin,
        allPlacements,
        input,
        activity.categoryId,
      );

      if (!slot) {
        continue;
      }

      added.push({
        day,
        label: activity.label,
        categoryId: activity.categoryId,
        startTime: slot.start,
        endTime: slot.end,
      });
      usedDays.add(day);
    }

    return added;
  }

  private pickCandidateDays(
    categoryId: string,
    count: number,
    usedDays: Set<DayOfWeek>,
  ): DayOfWeek[] {
    const rule = CATEGORY_PLACEMENT_RULES[categoryId];
    let days = [...ALL_DAYS];

    if (rule?.preferWeekend) {
      days = [
        ...days.filter((d) => WEEKEND_DAYS.has(d)),
        ...days.filter((d) => !WEEKEND_DAYS.has(d)),
      ];
    }

    if (categoryId === 'rutinas' || categoryId === 'bienestar') {
      return ALL_DAYS.filter((d) => !usedDays.has(d)).slice(0, count);
    }

    return days.filter((d) => !usedDays.has(d)).slice(0, count);
  }

  private findFreeSlot(
    day: DayOfWeek,
    preferredStart: string,
    durationMin: number,
    placements: WeekPlannerPlacement[],
    input: WeekPlannerInput,
    categoryId: string,
  ): { start: string; end: string } | null {
    const rule = CATEGORY_PLACEMENT_RULES[categoryId];
    const candidates: string[] = [preferredStart];

    if (rule?.preferWeekend && WEEKEND_DAYS.has(day)) {
      candidates.unshift('18:00', '19:30', '21:00');
    }
    if (categoryId === 'pendientes') {
      candidates.unshift('11:00', '17:30', '10:30');
    }
    if (categoryId === 'bienestar') {
      candidates.unshift('12:45', '18:15', '15:30', '20:30');
    }
    if (categoryId === 'practica') {
      candidates.unshift('17:00', '18:30', '07:30');
    }

    const uniqueCandidates = [...new Set(candidates)];

    for (const start of uniqueCandidates) {
      const end = addMinutes(start, durationMin);

      if (rule?.avoidWorkHours && WORK_DAYS.has(day)) {
        if (this.overlapsWorkHours(start, end)) {
          continue;
        }
      }

      if (this.overlapsFixedBlocks(day, start, end, input)) {
        continue;
      }

      if (!this.timesOverlap(day, start, end, placements)) {
        return { start, end };
      }
    }

    for (let hour = 7; hour <= 22; hour++) {
      for (const minute of [0, 30]) {
        const start = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        const end = addMinutes(start, durationMin);

        if (rule?.avoidWorkHours && WORK_DAYS.has(day) && this.overlapsWorkHours(start, end)) {
          continue;
        }

        if (!this.timesOverlap(day, start, end, placements)) {
          return { start, end };
        }
      }
    }

    return null;
  }

  private overlapsWorkHours(start: string, end: string): boolean {
    return start < '18:00' && end > '09:00';
  }

  private timesOverlap(
    day: DayOfWeek,
    start: string,
    end: string,
    placements: WeekPlannerPlacement[],
  ): boolean {
    const startMin = toMinutes(start);
    const endMin = toMinutes(end);
    if (endMin <= startMin) {
      return true;
    }

    return placements.some((p) => {
      if (p.day !== day) {
        return false;
      }
      const pStart = toMinutes(p.startTime);
      const pEnd = toMinutes(p.endTime);
      return startMin < pEnd + 15 && endMin > pStart - 15;
    });
  }

  private overlapsFixedBlocks(
    day: DayOfWeek,
    start: string,
    end: string,
    input: WeekPlannerInput,
  ): boolean {
    const fixed = input.fixedByDay[day] ?? [];
    return fixed.some(
      (block) =>
        !!block.startTime &&
        !!block.endTime &&
        slotsOverlap(start, end, block.startTime, block.endTime, 0),
    );
  }

  private isDuplicateOfFixed(
    label: string,
    fixed: { label: string; startTime?: string; endTime?: string }[] | undefined,
    start?: string,
    end?: string,
  ): boolean {
    if (!fixed?.length) {
      return false;
    }

    const normalized = label ? this.normalizeLabel(label) : '';

    return fixed.some((block) => {
      if (normalized && this.normalizeLabel(block.label) === normalized) {
        return true;
      }
      if (start && end && block.startTime && block.endTime) {
        return (
          start < block.endTime &&
          end > block.startTime &&
          normalized !== '' &&
          this.normalizeLabel(block.label) === normalized
        );
      }
      return false;
    });
  }

  private buildPoolIndex(
    pool: ActivityPoolItem[],
  ): Map<string, ActivityPoolItem> {
    const index = new Map<string, ActivityPoolItem>();

    for (const item of pool) {
      index.set(this.normalizeKey(item.label, item.categoryId), item);
    }

    return index;
  }

  private normalizeKey(label: string, categoryId: string): string {
    return `${categoryId}::${this.normalizeLabel(label)}`;
  }

  private normalizeLabel(label: string): string {
    return label.trim().toLowerCase();
  }
}
