import { Injectable } from '@nestjs/common';

import { PatchCoachChatLockDto } from './dto/coach.dto';
import { UserDocument } from './schemas/user.schema';

export interface CoachChatLockResponse {
  locked: boolean;
  updatedAt: string;
}

@Injectable()
export class CoachChatLockService {
  getChatLock(user: UserDocument): CoachChatLockResponse {
    return {
      locked: user.coachChatLocked ?? false,
      updatedAt: user.coachChatLockedAt
        ? new Date(user.coachChatLockedAt).toISOString()
        : new Date(0).toISOString(),
    };
  }

  patchChatLock(
    user: UserDocument,
    dto: PatchCoachChatLockDto,
  ): CoachChatLockResponse {
    const incomingAt = dto.updatedAt ? new Date(dto.updatedAt) : new Date();
    const currentAt = user.coachChatLockedAt
      ? new Date(user.coachChatLockedAt).getTime()
      : 0;

    if (dto.updatedAt && incomingAt.getTime() < currentAt) {
      return this.getChatLock(user);
    }

    user.coachChatLocked = dto.locked;
    user.coachChatLockedAt = incomingAt;
    user.markModified('coachChatLocked');
    user.markModified('coachChatLockedAt');

    return {
      locked: user.coachChatLocked,
      updatedAt: incomingAt.toISOString(),
    };
  }
}
