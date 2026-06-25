import { Injectable } from '@nestjs/common';

import { TimelineBlock } from '../users/schemas/user.schema';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DEFAULT_DAY_START = '08:00';
const DEFAULT_WEEKEND_START = '10:00';
const DEFAULT_DURATION_MINUTES = 60;
const MIN_DURATION_MINUTES = 30;
const SLOT_GAP_MINUTES = 15;

@Injectable()
export class TimelineScheduleService {
  recalculateTimes(
    blocks: TimelineBlock[],
    options?: { dayStart?: string; gapMinutes?: number },
  ): TimelineBlock[] {
    if (!blocks.length) {
      return [];
    }

    const gapMinutes = options?.gapMinutes ?? SLOT_GAP_MINUTES;
    let cursor = this.toMinutes(options?.dayStart ?? DEFAULT_DAY_START);

    return blocks.map((block) => {
      const duration = this.getBlockDurationMinutes(block);
      const startTime = this.fromMinutes(cursor);
      const endTime = this.fromMinutes(cursor + duration);
      cursor += duration + gapMinutes;

      return { ...block, startTime, endTime };
    });
  }

  reorderBlocks(
    blocks: TimelineBlock[],
    previousIndex: number,
    currentIndex: number,
    options?: { dayStart?: string },
  ): TimelineBlock[] {
    if (
      previousIndex === currentIndex ||
      previousIndex < 0 ||
      currentIndex < 0 ||
      previousIndex >= blocks.length ||
      currentIndex >= blocks.length
    ) {
      return blocks.map((block) => ({ ...block }));
    }

    const copy = blocks.map((block) => ({ ...block }));
    const [moved] = copy.splice(previousIndex, 1);
    copy.splice(currentIndex, 0, moved);
    return this.recalculateTimes(copy, options);
  }

  suggestDayStart(isWeekend: boolean): string {
    return isWeekend ? DEFAULT_WEEKEND_START : DEFAULT_DAY_START;
  }

  getBlockDurationMinutes(block: TimelineBlock): number {
    const start = this.toMinutes(block.startTime);
    const end = this.toMinutes(block.endTime);
    const duration = end - start;
    return duration >= MIN_DURATION_MINUTES ? duration : DEFAULT_DURATION_MINUTES;
  }

  sortByStartTime(blocks: TimelineBlock[]): TimelineBlock[] {
    return [...blocks].sort((a, b) => {
      const aStart = this.toMinutes(a.startTime);
      const bStart = this.toMinutes(b.startTime);
      return aStart - bStart;
    });
  }

  isValidTime(value: string): boolean {
    return TIME_PATTERN.test(value);
  }

  addMinutes(time: string, minutes: number): string {
    return this.fromMinutes(this.toMinutes(time) + minutes);
  }

  private toMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private fromMinutes(totalMinutes: number): string {
    const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
    const hours = Math.floor(normalized / 60);
    const minutes = normalized % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
}
