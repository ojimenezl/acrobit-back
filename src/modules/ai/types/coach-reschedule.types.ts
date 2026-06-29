import { CoachPhase } from '../../../common/enums/task-engagement.enum';
import { DayOfWeek } from '../../../common/enums/day-of-week.enum';
import { CoachBlockContext } from './coach-prompt.types';

export interface CoachRescheduleInput {
  day: DayOfWeek;
  phase: CoachPhase;
  block: CoachBlockContext;
  dayBlocks: CoachBlockContext[];
  currentTimeIso: string;
  weekPlanSummary: CoachWeekPlanSummary;
}

export interface CoachWeekPlanSummary {
  days: Array<{
    day: DayOfWeek;
    activeBlockCount: number;
  }>;
}

export interface CoachRescheduleResult {
  proposedStartTime: string;
  proposedEndTime: string;
  reason: string;
  source: 'ai' | 'fallback';
  adjusted: boolean;
}

export interface CoachRescheduleAiPayload {
  proposedStartTime: string;
  proposedEndTime?: string;
  reason: string;
}
