import { Module } from '@nestjs/common';

import { AiModule } from '../ai/ai.module';
import { CategoriesAppModule } from '../categories-app/categories-app.module';
import { TimelineScheduleService } from './timeline-schedule.service';
import { WeekOrganizerService } from './week-organizer.service';

@Module({
  imports: [AiModule, CategoriesAppModule],
  providers: [TimelineScheduleService, WeekOrganizerService],
  exports: [TimelineScheduleService, WeekOrganizerService],
})
export class OrganizerModule {}
