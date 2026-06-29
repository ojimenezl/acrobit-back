import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { OrganizerModule } from '../organizer/organizer.module';
import { CoachChatLockService } from './coach-chat-lock.service';
import { CoachEngagementService } from './coach-engagement.service';
import { CoachPromptStoreService } from './coach-prompt-store.service';
import { User, UserSchema } from './schemas/user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    OrganizerModule,
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    CoachEngagementService,
    CoachPromptStoreService,
    CoachChatLockService,
  ],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
