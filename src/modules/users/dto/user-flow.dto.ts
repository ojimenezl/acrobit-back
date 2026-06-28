import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { TASK_OUTCOME_VALUES } from '../../../common/enums/task-outcome.enum';

export class UpdateFlowStateDto {
  @IsOptional()
  @IsBoolean()
  permissionsGranted?: boolean;

  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  onboardingDone?: boolean;

  @IsOptional()
  @IsBoolean()
  privacyAccepted?: boolean;

  @IsOptional()
  @IsBoolean()
  categoriesSelected?: boolean;

  @IsOptional()
  @IsBoolean()
  categoriesSkipped?: boolean;

  @IsOptional()
  @IsBoolean()
  weekConfigured?: boolean;

  @IsOptional()
  @IsBoolean()
  coachScheduleReviewDone?: boolean;
}

export class UpdateWeekInputsDto {
  @IsObject()
  weekInputs!: Record<string, string>;
}

export class UpdateSelectedActivitiesDto {
  @IsObject()
  selectedActivities!: Record<string, string[]>;
}

export class ReorderDayBlocksDto {
  @IsInt()
  @Min(0)
  previousIndex!: number;

  @IsInt()
  @Min(0)
  currentIndex!: number;
}

export class UpdateBlockDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  label?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsIn(TASK_OUTCOME_VALUES)
  outcome?: 'achieved' | 'missed' | 'later';
}

export class SetBlockOutcomeDto {
  @IsString()
  blockId!: string;

  /** null o ausente = quitar estado */
  @IsOptional()
  outcome?: 'achieved' | 'missed' | 'later' | null;
}

export class PatchDayBlockDto {
  @IsString()
  blockId!: string;

  @ValidateNested()
  @Type(() => UpdateBlockDto)
  patch!: UpdateBlockDto;
}

export class TimelineBlockDto {
  @IsString()
  id!: string;

  @IsString()
  @MinLength(1)
  label!: string;

  @IsString()
  categoryId!: string;

  @IsString()
  startTime!: string;

  @IsString()
  endTime!: string;

  @IsOptional()
  @IsBoolean()
  isUserDefined?: boolean;

  @IsOptional()
  @IsBoolean()
  cancelled?: boolean;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsIn(TASK_OUTCOME_VALUES)
  outcome?: 'achieved' | 'missed' | 'later';
}

export class ReplaceDayBlocksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimelineBlockDto)
  blocks!: TimelineBlockDto[];
}

export class AppendChatMessageDto {
  @IsIn(['coach', 'user'])
  sender!: 'coach' | 'user';

  @IsString()
  @MinLength(1)
  text!: string;

  @IsOptional()
  @IsString()
  relatedCategory?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  quickReplies?: string[];
}
