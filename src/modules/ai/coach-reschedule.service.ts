import { Injectable, Logger } from '@nestjs/common';

import {
  COACH_RESCHEDULE_DEFAULT_SHIFT,
  COACH_RESCHEDULE_MAX_HOURS_AHEAD,
  COACH_RESCHEDULE_MIN_SHIFT,
} from '../../common/constants/coach-reschedule.constants';
import { CoachPhase } from '../../common/enums/task-engagement.enum';
import { TimelineScheduleService } from '../organizer/timeline-schedule.service';
import { TimelineBlock } from '../users/schemas/user.schema';
import { OpenAiService } from './openai.service';
import {
  buildCoachRescheduleSystemPrompt,
  buildCoachRescheduleUserMessage,
} from './prompts/coach-reschedule.prompt';
import {
  CoachRescheduleAiPayload,
  CoachRescheduleInput,
  CoachRescheduleResult,
} from './types/coach-reschedule.types';

@Injectable()
export class CoachRescheduleService {
  private readonly logger = new Logger(CoachRescheduleService.name);

  constructor(
    private readonly openAi: OpenAiService,
    private readonly timelineSchedule: TimelineScheduleService,
  ) {}

  async proposeReschedule(
    input: CoachRescheduleInput,
    dayBlocks: TimelineBlock[],
  ): Promise<CoachRescheduleResult> {
    const duration = this.timelineSchedule.getBlockDurationMinutes(
      this.toTimelineBlock(input.block),
    );
    const minShift = this.getMinShiftMinutes(input.block.categoryId);
    const currentMinutes = this.isoToMinutes(input.currentTimeIso);
    const earliest = this.computeEarliestStart(
      input,
      currentMinutes,
      minShift,
    );
    const latest = earliest + COACH_RESCHEDULE_MAX_HOURS_AHEAD * 60;

    const aiPayload = await this.requestAiPayload(input, minShift, duration);
    if (aiPayload) {
      const validated = this.validateAiProposal(
        aiPayload,
        duration,
        earliest,
        latest,
        dayBlocks,
        input.block.id,
      );
      if (validated) {
        return { ...validated, source: 'ai' };
      }
    }

    return this.buildFallback(input, dayBlocks, duration, earliest, latest);
  }

  private async requestAiPayload(
    input: CoachRescheduleInput,
    minShift: number,
    duration: number,
  ): Promise<CoachRescheduleAiPayload | null> {
    if (!this.openAi.isConfigured) {
      return null;
    }

    try {
      const client = this.openAi.getClient();
      const response = await client.chat.completions.create({
        model: this.openAi.model,
        max_tokens: 300,
        temperature: 0.5,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildCoachRescheduleSystemPrompt() },
          {
            role: 'user',
            content: buildCoachRescheduleUserMessage(input, minShift, duration),
          },
        ],
      });

      const raw = response.choices[0]?.message?.content?.trim();
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const proposedStartTime =
        typeof parsed['proposedStartTime'] === 'string'
          ? parsed['proposedStartTime'].trim()
          : null;
      const reason =
        typeof parsed['reason'] === 'string' && parsed['reason'].trim()
          ? parsed['reason'].trim().slice(0, 160)
          : null;

      if (!proposedStartTime || !reason) {
        return null;
      }

      const proposedEndTime =
        typeof parsed['proposedEndTime'] === 'string'
          ? parsed['proposedEndTime'].trim()
          : undefined;

      return {
        proposedStartTime,
        proposedEndTime,
        reason,
      };
    } catch (error) {
      this.logger.warn(
        `Coach reschedule AI falló (${input.block.label}): ${String(error)}`,
      );
      return null;
    }
  }

  private validateAiProposal(
    payload: CoachRescheduleAiPayload,
    duration: number,
    earliest: number,
    latest: number,
    dayBlocks: TimelineBlock[],
    blockId: string,
  ): Omit<CoachRescheduleResult, 'source'> | null {
    if (!this.timelineSchedule.isValidTime(payload.proposedStartTime)) {
      return null;
    }

    const parsedStart = this.parseTimeMinutes(payload.proposedStartTime);
    if (parsedStart < earliest || parsedStart > latest) {
      return null;
    }

    let endTime = payload.proposedEndTime;
    if (endTime && !this.timelineSchedule.isValidTime(endTime)) {
      endTime = undefined;
    }

    if (endTime) {
      const endMinutes = this.parseTimeMinutes(endTime);
      if (endMinutes <= parsedStart) {
        endTime = undefined;
      }
    }

    const preferredStart = payload.proposedStartTime;
    const resolved = this.timelineSchedule.resolveTimeSlot(
      preferredStart,
      duration,
      dayBlocks,
      blockId,
    );

    if (this.parseTimeMinutes(resolved.startTime) > latest) {
      return null;
    }

    return {
      proposedStartTime: resolved.startTime,
      proposedEndTime: endTime ?? resolved.endTime,
      reason: payload.reason,
      adjusted: resolved.adjusted,
    };
  }

  private buildFallback(
    input: CoachRescheduleInput,
    dayBlocks: TimelineBlock[],
    duration: number,
    earliest: number,
    latest: number,
  ): CoachRescheduleResult {
    const preferredStart = this.fromMinutes(earliest);
    const resolved = this.timelineSchedule.resolveTimeSlot(
      preferredStart,
      duration,
      dayBlocks,
      input.block.id,
    );

    let startMinutes = this.parseTimeMinutes(resolved.startTime);
    if (startMinutes > latest) {
      startMinutes = Math.min(earliest, latest);
      const clamped = this.timelineSchedule.resolveTimeSlot(
        this.fromMinutes(startMinutes),
        duration,
        dayBlocks,
        input.block.id,
      );
      return {
        proposedStartTime: clamped.startTime,
        proposedEndTime: clamped.endTime,
        reason: this.buildFallbackReason(input, clamped.startTime),
        source: 'fallback',
        adjusted: true,
      };
    }

    return {
      proposedStartTime: resolved.startTime,
      proposedEndTime: resolved.endTime,
      reason: this.buildFallbackReason(input, resolved.startTime),
      source: 'fallback',
      adjusted: resolved.adjusted,
    };
  }

  private buildFallbackReason(
    input: CoachRescheduleInput,
    startTime: string,
  ): string {
    const phaseHint =
      input.phase === CoachPhase.AtTime
        ? 'Ya era la hora, pero'
        : 'Para darte un poco más de margen,';

    return `${phaseHint} ${input.block.label} encaja mejor a las ${startTime} sin chocar con otras tareas.`;
  }

  private computeEarliestStart(
    input: CoachRescheduleInput,
    currentMinutes: number,
    minShift: number,
  ): number {
    const blockStart = this.parseTimeMinutes(input.block.startTime);
    const fromNow = currentMinutes + minShift;
    const fromBlock = blockStart + minShift;

    return Math.max(fromNow, fromBlock);
  }

  private getMinShiftMinutes(categoryId: string): number {
    return (
      COACH_RESCHEDULE_MIN_SHIFT[categoryId] ?? COACH_RESCHEDULE_DEFAULT_SHIFT
    );
  }

  private isoToMinutes(iso: string): number {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      const now = new Date();
      return now.getHours() * 60 + now.getMinutes();
    }

    return date.getHours() * 60 + date.getMinutes();
  }

  private parseTimeMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private fromMinutes(totalMinutes: number): string {
    const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
    const hours = Math.floor(normalized / 60);
    const minutes = normalized % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  private toTimelineBlock(block: CoachRescheduleInput['block']): TimelineBlock {
    return {
      id: block.id,
      label: block.label,
      categoryId: block.categoryId,
      startTime: block.startTime,
      endTime: block.endTime,
      completed: false,
      cancelled: false,
    } as TimelineBlock;
  }
}
