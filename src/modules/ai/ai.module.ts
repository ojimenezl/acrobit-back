import { Global, Module } from '@nestjs/common';

import { OpenAiService } from './openai.service';
import { WeekPlannerService } from './week-planner.service';
import { CoachPromptService } from './coach-prompt.service';

@Global()
@Module({
  providers: [OpenAiService, WeekPlannerService, CoachPromptService],
  exports: [OpenAiService, WeekPlannerService, CoachPromptService],
})
export class AiModule {}
