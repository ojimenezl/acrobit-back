import { Module } from '@nestjs/common';

import { UsersModule } from '../users/users.module';
import { CronController } from './cron.controller';

@Module({
  imports: [UsersModule],
  controllers: [CronController],
})
export class CronModule {}
