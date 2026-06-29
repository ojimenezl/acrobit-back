import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

import { DayOfWeek } from '../../../common/enums/day-of-week.enum';
import {
  CoachPhase,
  CoachUserResponse,
  TaskEngagementState,
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

export class PatchCoachEngagementDto {
  @IsEnum(DayOfWeek)
  day!: DayOfWeek;

  @IsString()
  blockId!: string;

  @IsEnum(TaskEngagementState)
  state!: TaskEngagementState;

  @IsOptional()
  @IsEnum(CoachPhase)
  lastPhase?: CoachPhase;

  @IsOptional()
  @IsEnum(CoachUserResponse)
  lastResponse?: CoachUserResponse;

  @IsOptional()
  @IsString()
  updatedAt?: string;
}

export class CoachRespondDto {
  @IsEnum(DayOfWeek)
  day!: DayOfWeek;

  @IsString()
  blockId!: string;

  @IsEnum(CoachPhase)
  phase!: CoachPhase;

  @IsEnum(CoachUserResponse)
  response!: CoachUserResponse;
}

export class GetCoachPromptsQueryDto {
  @IsOptional()
  @IsEnum(DayOfWeek)
  day?: DayOfWeek;
}

export class PatchCoachChatLockDto {
  @IsBoolean()
  locked!: boolean;

  @IsOptional()
  @IsString()
  updatedAt?: string;
}
