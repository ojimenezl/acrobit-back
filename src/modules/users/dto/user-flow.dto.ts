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
