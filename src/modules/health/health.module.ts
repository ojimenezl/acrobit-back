import { Module } from '@nestjs/common';

import { CategoriesAppModule } from '../categories-app/categories-app.module';
import { MessagesAppModule } from '../messages-app/messages-app.module';
import { UsersModule } from '../users/users.module';
import { HealthController } from './health.controller';

@Module({
  imports: [UsersModule, CategoriesAppModule, MessagesAppModule],
  controllers: [HealthController],
})
export class HealthModule {}
