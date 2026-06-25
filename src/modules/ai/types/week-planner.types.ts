import { DayOfWeek } from '../../../common/enums/day-of-week.enum';

export interface ActivityPoolItem {
  label: string;
  categoryId: string;
}

export interface CategoryMetaForPlanner {
  categoryId: string;
  label: string;
  description: string;
  manageWeight: number;
  manageMax: number;
}

export interface FixedBlockSummary {
  label: string;
  startTime?: string;
  endTime?: string;
}

export interface WeekPlannerInput {
  today: DayOfWeek;
  fixedByDay: Record<DayOfWeek, FixedBlockSummary[]>;
  activityPool: ActivityPoolItem[];
  categories: CategoryMetaForPlanner[];
}

export interface WeekPlannerPlacement {
  day: DayOfWeek;
  label: string;
  categoryId: string;
  startTime: string;
  endTime: string;
}

export interface WeekPlannerSkipped {
  label: string;
  reason: string;
}

export interface WeekPlannerResult {
  placements: WeekPlannerPlacement[];
  skipped: WeekPlannerSkipped[];
  summary: string;
}
