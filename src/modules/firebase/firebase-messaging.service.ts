import { Injectable, Logger } from '@nestjs/common';
import { getMessaging } from 'firebase-admin/messaging';

import { FCM_DATA_TYPES } from '../../common/constants/coach.constants';
import { CoachPhase } from '../../common/enums/task-engagement.enum';
import { DayOfWeek } from '../../common/enums/day-of-week.enum';
import { FirebaseAuthService } from './firebase-auth.service';

export interface TaskReminderPushPayload {
  day: DayOfWeek;
  blockId: string;
  phase: CoachPhase;
  promptId: string;
  title: string;
  body: string;
  label: string;
  startTime: string;
  categoryId: string;
}

@Injectable()
export class FirebaseMessagingService {
  private readonly logger = new Logger(FirebaseMessagingService.name);

  constructor(private readonly firebaseAuth: FirebaseAuthService) {}

  async sendTaskReminder(
    token: string,
    payload: TaskReminderPushPayload,
  ): Promise<boolean> {
    if (!this.firebaseAuth.isReady()) {
      this.logger.warn('Firebase Admin no listo; push omitido.');
      return false;
    }

    try {
      const messaging = getMessaging();
      await messaging.send({
        token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: {
          type: FCM_DATA_TYPES.taskReminder,
          day: payload.day,
          blockId: payload.blockId,
          coachPhase: payload.phase,
          promptId: payload.promptId,
          title: payload.title,
          body: payload.body,
          label: payload.label,
          taskTime: payload.startTime,
          categoryId: payload.categoryId,
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'acrobit-task-reminders',
            sound: 'default',
          },
        },
      });
      return true;
    } catch (error) {
      this.logger.warn(
        `FCM send failed for block ${payload.blockId}:`,
        error instanceof Error ? error.message : error,
      );
      return false;
    }
  }
}
