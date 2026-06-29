import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesAppModule } from './modules/categories-app/categories-app.module';
import { CronModule } from './modules/cron/cron.module';
import { FirebaseModule } from './modules/firebase/firebase.module';
import { HealthModule } from './modules/health/health.module';
import { MessagesAppModule } from './modules/messages-app/messages-app.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    FirebaseModule,
    AiModule,
    UsersModule,
    AuthModule,
    CategoriesAppModule,
    MessagesAppModule,
    HealthModule,
    CronModule,
  ],
})
export class AppModule {}
