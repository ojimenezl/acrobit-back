import { Module } from '@nestjs/common';

import { AiModule } from '../ai/ai.module';
import { CoachAddTaskService } from '../ai/coach-add-task.service';
import { CoachRescheduleService } from '../ai/coach-reschedule.service';
import { CategoriesAppModule } from '../categories-app/categories-app.module';
import { TimelineScheduleService } from './timeline-schedule.service';
import { WeekOrganizerService } from './week-organizer.service';

@Module({
  imports: [AiModule, CategoriesAppModule],
  providers: [
    TimelineScheduleService,
    WeekOrganizerService,
    CoachRescheduleService,
    CoachAddTaskService,
  ],
  exports: [
    TimelineScheduleService,
    WeekOrganizerService,
    CoachRescheduleService,
    CoachAddTaskService,
  ],
})
export class OrganizerModule {}
