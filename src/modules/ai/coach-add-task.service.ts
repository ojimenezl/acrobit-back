import { Injectable, Logger } from '@nestjs/common';

import { parseAddTaskFallback } from '../../common/utils/coach-add-task-fallback.util';
import { DayOfWeek } from '../../common/enums/day-of-week.enum';
import { TimelineScheduleService } from '../organizer/timeline-schedule.service';
import { TimelineBlock } from '../users/schemas/user.schema';
import { OpenAiService } from './openai.service';
import {
  buildCoachAddTaskSystemPrompt,
  buildCoachAddTaskUserMessage,
} from './prompts/coach-add-task.prompt';
import {
  CoachAddTaskAiPayload,
  CoachAddTaskInput,
  CoachAddTaskParseResult,
} from './types/coach-add-task.types';

export interface CoachAddTaskPlacement {
  block: Omit<TimelineBlock, 'completed' | 'cancelled' | 'outcome'>;
  day: DayOfWeek;
  adjusted: boolean;
  requestedStartTime: string | null;
  reason: string;
  source: 'ai' | 'fallback';
}

@Injectable()
export class CoachAddTaskService {
  private readonly logger = new Logger(CoachAddTaskService.name);

  constructor(
    private readonly openAi: OpenAiService,
    private readonly timelineSchedule: TimelineScheduleService,
  ) {}

  async parseTaskRequest(
    input: CoachAddTaskInput,
  ): Promise<CoachAddTaskParseResult & { source: 'ai' | 'fallback' }> {
    const aiPayload = await this.requestAiPayload(input);
    if (aiPayload) {
      return { ...aiPayload, source: 'ai' };
    }

    const fallback = parseAddTaskFallback({
      text: input.text,
      today: input.today,
      currentTimeIso: input.currentTimeIso,
    });

    return { ...fallback, source: 'fallback' };
  }

  placeTask(
    parsed: CoachAddTaskParseResult,
    dayBlocks: TimelineBlock[],
    day: DayOfWeek,
    currentTimeIso: string,
    source: 'ai' | 'fallback',
  ): CoachAddTaskPlacement {
    const activeBlocks = dayBlocks.filter(
      (block) => !block.cancelled && !block.completed,
    );
    const duration = Math.max(parsed.durationMinutes, 30);
    const preferredStart =
      parsed.startTime ??
      this.suggestPreferredStart(activeBlocks, currentTimeIso);

    const resolved = this.timelineSchedule.resolveTimeSlot(
      preferredStart,
      duration,
      activeBlocks,
    );

    const block: Omit<TimelineBlock, 'completed' | 'cancelled' | 'outcome'> = {
      id: `${day}-chat-${Date.now()}`,
      label: parsed.label.trim(),
      categoryId: parsed.categoryId,
      startTime: resolved.startTime,
      endTime: resolved.endTime,
      isUserDefined: parsed.categoryId === 'usuario',
    };

    const reason = this.buildReason(
      parsed.label,
      day,
      parsed.startTime,
      resolved.startTime,
      resolved.adjusted,
    );

    return {
      block,
      day,
      adjusted: resolved.adjusted,
      requestedStartTime: parsed.startTime,
      reason,
      source,
    };
  }

  private async requestAiPayload(
    input: CoachAddTaskInput,
  ): Promise<CoachAddTaskParseResult | null> {
    if (!this.openAi.isConfigured) {
      return null;
    }

    try {
      const client = this.openAi.getClient();
      const response = await client.chat.completions.create({
        model: this.openAi.model,
        max_tokens: 280,
        temperature: 0.35,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildCoachAddTaskSystemPrompt() },
          { role: 'user', content: buildCoachAddTaskUserMessage(input) },
        ],
      });

      const raw = response.choices[0]?.message?.content?.trim();
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return this.validateAiPayload(parsed, input.today);
    } catch (error) {
      this.logger.warn(`Coach add-task AI falló: ${String(error)}`);
      return null;
    }
  }

  private validateAiPayload(
    parsed: Record<string, unknown>,
    today: DayOfWeek,
  ): CoachAddTaskParseResult | null {
    const label =
      typeof parsed['label'] === 'string' ? parsed['label'].trim() : '';
    const day =
      typeof parsed['day'] === 'string'
        ? (parsed['day'].trim() as DayOfWeek)
        : today;
    const categoryId =
      typeof parsed['categoryId'] === 'string'
        ? parsed['categoryId'].trim()
        : 'usuario';

    if (!label) {
      return null;
    }

    if (!Object.values(DayOfWeek).includes(day)) {
      return null;
    }

    const validCategories = ['practica', 'bienestar', 'rutinas', 'usuario'];
    if (!validCategories.includes(categoryId)) {
      return null;
    }

    let startTime: string | null = null;
    const rawStart = parsed['startTime'];
    if (typeof rawStart === 'string' && rawStart.trim()) {
      const candidate = rawStart.trim();
      if (this.timelineSchedule.isValidTime(candidate)) {
        startTime = candidate;
      }
    }

    let durationMinutes = 30;
    if (typeof parsed['durationMinutes'] === 'number') {
      durationMinutes = Math.min(120, Math.max(15, parsed['durationMinutes']));
    }

    return {
      label: label.slice(0, 120),
      day,
      startTime,
      durationMinutes,
      categoryId,
    };
  }

  private suggestPreferredStart(
    blocks: TimelineBlock[],
    currentTimeIso?: string,
  ): string {
    if (blocks.length) {
      const sorted = [...blocks].sort((a, b) =>
        a.startTime.localeCompare(b.startTime),
      );
      const last = sorted[sorted.length - 1];
      return this.timelineSchedule.addMinutes(last.endTime, 15);
    }

    const now = currentTimeIso ? new Date(currentTimeIso) : new Date();
    if (!Number.isNaN(now.getTime())) {
      const minutes = now.getHours() * 60 + now.getMinutes() + 30;
      const rounded = Math.ceil(minutes / 15) * 15;
      const hours = Math.floor(rounded / 60) % 24;
      const mins = rounded % 60;
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }

    return '09:00';
  }

  buildReason(
    label: string,
    day: DayOfWeek,
    requestedStart: string | null,
    finalStart: string,
    adjusted: boolean,
  ): string {
    const dayLabel = this.formatDay(day);

    if (requestedStart && adjusted) {
      return `Querías «${label}» a las ${requestedStart}, pero chocaba con otra tarea. La dejé el ${dayLabel} a las ${finalStart}.`;
    }

    if (!requestedStart) {
      return `Listo: «${label}» el ${dayLabel} a las ${finalStart} (busqué el mejor hueco).`;
    }

    return `Perfecto: «${label}» el ${dayLabel} a las ${finalStart}.`;
  }

  private formatDay(day: DayOfWeek): string {
    const labels: Record<DayOfWeek, string> = {
      [DayOfWeek.DOMINGO]: 'domingo',
      [DayOfWeek.LUNES]: 'lunes',
      [DayOfWeek.MARTES]: 'martes',
      [DayOfWeek.MIERCOLES]: 'miércoles',
      [DayOfWeek.JUEVES]: 'jueves',
      [DayOfWeek.VIERNES]: 'viernes',
      [DayOfWeek.SABADO]: 'sábado',
    };
    return labels[day];
  }
}
