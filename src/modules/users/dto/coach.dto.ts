import { IsEnum, IsString } from 'class-validator';

import { DayOfWeek } from '../../../common/enums/day-of-week.enum';
import {
  COACH_PHASE_VALUES,
  CoachPhase,
} from '../../../common/enums/task-engagement.enum';

export class GenerateCoachPromptDto {
  @IsEnum(DayOfWeek)
  day!: DayOfWeek;

  @IsString()
  blockId!: string;

  @IsEnum(CoachPhase)
  phase!: CoachPhase;
}

export class GenerateCoachRecommendationDto {
  @IsEnum(DayOfWeek)
  day!: DayOfWeek;

  @IsString()
  blockId!: string;
}

export class GenerateCoachDayDto {
  @IsEnum(DayOfWeek)
  day!: DayOfWeek;
}

export class RescheduleCoachBlockDto {
  @IsEnum(DayOfWeek)
  day!: DayOfWeek;

  @IsString()
  blockId!: string;

  @IsEnum(CoachPhase)
  phase!: CoachPhase;

  @IsString()
  currentTimeIso!: string;
}
