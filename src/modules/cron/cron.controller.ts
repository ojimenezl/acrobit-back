import {
  Controller,
  Get,
  Headers,
  HttpCode,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CoachReminderDispatchService } from '../users/coach-reminder-dispatch.service';

@Controller('cron')
export class CronController {
  constructor(
    private readonly reminders: CoachReminderDispatchService,
    private readonly config: ConfigService,
  ) {}

  @Get('coach-reminders')
  @HttpCode(200)
  async dispatchCoachReminders(
    @Headers('authorization') authorization?: string,
  ) {
    this.assertCronAuth(authorization);

    const result = await this.reminders.dispatchDueReminders();
    return { ok: true, ...result };
  }

  private assertCronAuth(authorization?: string): void {
    const secret = this.config.get<string>('cronSecret');
    if (!secret?.trim()) {
      throw new UnauthorizedException('CRON_SECRET no configurado.');
    }

    const expected = `Bearer ${secret}`;
    if (authorization !== expected) {
      throw new UnauthorizedException('Cron no autorizado.');
    }
  }
}
