import { DayOfWeek } from '../../../common/enums/day-of-week.enum';

export interface CoachAddTaskInput {
  text: string;
  currentTimeIso: string;
  today: DayOfWeek;
  dayBlocks: Array<{
    id: string;
    label: string;
    startTime: string;
    endTime: string;
  }>;
  weekPlanSummary: {
    days: Array<{ day: DayOfWeek; activeBlockCount: number }>;
  };
}

export interface CoachAddTaskParseResult {
  label: string;
  day: DayOfWeek;
  startTime: string | null;
  durationMinutes: number;
  categoryId: string;
}

export interface CoachAddTaskAiPayload {
  label: string;
  day: DayOfWeek;
  startTime: string | null;
  durationMinutes: number;
  categoryId: string;
}
