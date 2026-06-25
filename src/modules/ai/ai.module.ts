import { Global, Module } from '@nestjs/common';

import { OpenAiService } from './openai.service';
import { WeekPlannerService } from './week-planner.service';

@Global()
@Module({
  providers: [OpenAiService, WeekPlannerService],
  exports: [OpenAiService, WeekPlannerService],
})
export class AiModule {}
