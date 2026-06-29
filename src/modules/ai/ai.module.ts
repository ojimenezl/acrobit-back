import { Global, Module } from '@nestjs/common';

import { OpenAiService } from './openai.service';
import { WeekPlannerService } from './week-planner.service';
import { CoachPromptService } from './coach-prompt.service';
import { CoachRescheduleService } from './coach-reschedule.service';

@Global()
@Module({
  providers: [OpenAiService, WeekPlannerService, CoachPromptService, CoachRescheduleService],
  exports: [OpenAiService, WeekPlannerService, CoachPromptService, CoachRescheduleService],
})
export class AiModule {}
