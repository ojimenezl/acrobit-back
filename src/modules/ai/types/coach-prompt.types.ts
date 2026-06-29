import { CoachPhase } from '../../../common/enums/task-engagement.enum';
import { DayOfWeek } from '../../../common/enums/day-of-week.enum';

export interface CoachBlockContext {
  id: string;
  label: string;
  categoryId: string;
  startTime: string;
  endTime: string;
}

export interface CoachDayContext {
  day: DayOfWeek;
  blocks: CoachBlockContext[];
}

export interface CoachPromptInput {
  day: DayOfWeek;
  phase: CoachPhase;
  block: CoachBlockContext;
  dayContext: CoachDayContext;
  prepMinutesBefore: number;
}

export interface CoachAiPromptPayload {
  title: string;
  body: string;
  recommendation?: string;
}

export interface CoachPromptResult {
  id: string;
  blockId: string;
  day: DayOfWeek;
  phase: CoachPhase;
  title: string;
  body: string;
  quickReplies: ['yes', 'no', 'reorganize'];
  categoryId: string;
  blockLabel: string;
  startTime: string;
  recommendation?: string;
  generatedAt: string;
  source: 'ai' | 'fallback';
}
