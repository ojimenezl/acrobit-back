import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  COACH_AT_TIME_RESPONSE_WINDOW_MIN,
  COACH_PREP_RESPONSE_WINDOW_MIN,
  FCM_DATA_TYPES,
  MAX_COACH_NOTIFICATIONS_PER_DAY,
} from '../../common/constants/coach.constants';
import { getTodayDayOfWeek } from '../../common/constants/days-of-week';
import { CoachPhase, TaskEngagementState } from '../../common/enums/task-engagement.enum';
import { DayOfWeek } from '../../common/enums/day-of-week.enum';
import {
  coachEngagementKey,
  nextEngagementState,
  shouldMuteCoachNotifications,
  shouldSendAtTimeAfterPrep,
} from '../../common/utils/coach-engagement.util';
import {
  combineDayAndTime,
  isDueForFcmFallback,
  resolvePrepAt,
  resolveTaskAt,
} from '../../common/utils/coach-schedule.util';
import { CoachPromptService } from '../ai/coach-prompt.service';
import { FirebaseMessagingService } from '../firebase/firebase-messaging.service';
import { CoachEngagementService } from './coach-engagement.service';
import { CoachPromptStoreService } from './coach-prompt-store.service';
import {
  TimelineBlock,
  User,
  UserDocument,
} from './schemas/user.schema';

interface DueReminder {
  day: DayOfWeek;
  block: TimelineBlock;
  phase: CoachPhase;
  fireAt: Date;
}

@Injectable()
export class CoachReminderDispatchService {
  private readonly logger = new Logger(CoachReminderDispatchService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly coachPrompts: CoachPromptService,
    private readonly coachPromptStore: CoachPromptStoreService,
    private readonly coachEngagement: CoachEngagementService,
    private readonly fcm: FirebaseMessagingService,
  ) {}

  async dispatchDueReminders(now = new Date()): Promise<{
    usersScanned: number;
    sent: number;
    skipped: number;
  }> {
    const users = await this.userModel
      .find({
        fcmToken: { $exists: true, $nin: [null, ''] },
        'flow.notificationsEnabled': true,
        'flow.weekConfigured': true,
      })
      .exec();

    let sent = 0;
    let skipped = 0;

    for (const user of users) {
      const result = await this.dispatchForUser(user, now);
      sent += result.sent;
      skipped += result.skipped;
    }

    return { usersScanned: users.length, sent, skipped };
  }

  async dispatchForUser(
    user: UserDocument,
    now = new Date(),
  ): Promise<{ sent: number; skipped: number }> {
    if (!user.fcmToken?.trim()) {
      return { sent: 0, skipped: 0 };
    }

    const due = this.findDueReminders(user, now).slice(
      0,
      MAX_COACH_NOTIFICATIONS_PER_DAY,
    );

    let sent = 0;
    let skipped = 0;

    for (const item of due) {
      if (this.wasAlreadyDelivered(user, item.day, item.block.id, item.phase)) {
        skipped += 1;
        continue;
      }

      const ok = await this.sendReminder(user, item, now);
      if (ok) {
        sent += 1;
      } else {
        skipped += 1;
      }
    }

    if (sent > 0) {
      await user.save();
    }

    return { sent, skipped };
  }

  clearDeliveriesForBlock(
    user: UserDocument,
    day: DayOfWeek,
    blockId: string,
  ): void {
    user.coachReminderDeliveries = (user.coachReminderDeliveries ?? []).filter(
      (item) => !(item.day === day && item.blockId === blockId),
    );
    user.markModified('coachReminderDeliveries');
  }

  pruneOldDeliveries(user: UserDocument, now = new Date()): void {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 8);
    user.coachReminderDeliveries = (user.coachReminderDeliveries ?? []).filter(
      (item) => new Date(item.sentAt).getTime() >= cutoff.getTime(),
    );
    user.markModified('coachReminderDeliveries');
  }

  async ackLocalDelivery(
    user: UserDocument,
    day: DayOfWeek,
    blockId: string,
    phase: CoachPhase,
    now = new Date(),
  ): Promise<void> {
    if (this.wasAlreadyDelivered(user, day, blockId, phase)) {
      return;
    }

    user.coachReminderDeliveries = [
      ...(user.coachReminderDeliveries ?? []),
      {
        day,
        blockId,
        phase,
        sentAt: now,
        source: 'local',
      },
    ];
    user.markModified('coachReminderDeliveries');

    const current = this.getEngagementState(user, day, blockId);
    const next = nextEngagementState(current, {
      type: 'phase_sent',
      phase,
    });
    if (next !== current) {
      this.coachEngagement.patchEngagement(user, {
        day,
        blockId,
        state: next,
        lastPhase: phase,
        updatedAt: now.toISOString(),
      });
    }

    await user.save();
  }

  private findDueReminders(user: UserDocument, now: Date): DueReminder[] {
    const plan = user.weekPlan;
    if (!plan?.days?.length) {
      return [];
    }

    const today = getTodayDayOfWeek();
    const todayIndex = plan.days.findIndex((dayPlan) => dayPlan.day === today);
    const relevantDays =
      todayIndex >= 0 ? plan.days.slice(todayIndex) : plan.days;

    const due: DueReminder[] = [];

    for (const dayPlan of relevantDays) {
      for (const block of dayPlan.blocks) {
        if (block.cancelled || block.completed) {
          continue;
        }

        const state = this.getEngagementState(
          user,
          dayPlan.day,
          block.id,
        );

        if (shouldMuteCoachNotifications(state)) {
          continue;
        }

        const prepAt = resolvePrepAt(dayPlan.day, block.startTime, now);
        if (
          isDueForFcmFallback(
            prepAt,
            now,
            COACH_PREP_RESPONSE_WINDOW_MIN,
          )
        ) {
          due.push({
            day: dayPlan.day,
            block,
            phase: CoachPhase.Prep,
            fireAt: prepAt,
          });
        }

        if (shouldSendAtTimeAfterPrep(state)) {
          const atTime = resolveTaskAt(dayPlan.day, block.startTime, now);
          if (
            isDueForFcmFallback(
              atTime,
              now,
              COACH_AT_TIME_RESPONSE_WINDOW_MIN,
            )
          ) {
            due.push({
              day: dayPlan.day,
              block,
              phase: CoachPhase.AtTime,
              fireAt: atTime,
            });
          }
        }
      }
    }

    return due.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
  }

  private async sendReminder(
    user: UserDocument,
    item: DueReminder,
    now: Date,
  ): Promise<boolean> {
    const dayBlocks = this.mapCoachDayBlocks(user, item.day);
    const blockCtx = this.mapCoachBlock(item.block);

    const prompt = await this.coachPrompts.generatePrompt({
      day: item.day,
      phase: item.phase,
      block: blockCtx,
      dayContext: { day: item.day, blocks: dayBlocks },
      prepMinutesBefore: 10,
    });

    this.coachPromptStore.upsertPrompt(user, prompt);

    const current = this.getEngagementState(user, item.day, item.block.id);
    const next = nextEngagementState(current, {
      type: 'phase_sent',
      phase: item.phase,
    });
    this.coachEngagement.patchEngagement(user, {
      day: item.day,
      blockId: item.block.id,
      state: next,
      lastPhase: item.phase,
      updatedAt: now.toISOString(),
    });

    const sent = await this.fcm.sendTaskReminder(user.fcmToken!, {
      day: item.day,
      blockId: item.block.id,
      phase: item.phase,
      promptId: prompt.id,
      title: prompt.title,
      body: prompt.body,
      label: item.block.label,
      startTime: item.block.startTime,
      categoryId: item.block.categoryId,
    });

    if (!sent) {
      return false;
    }

    user.coachReminderDeliveries = [
      ...(user.coachReminderDeliveries ?? []),
      {
        day: item.day,
        blockId: item.block.id,
        phase: item.phase,
        sentAt: now,
        source: 'fcm',
      },
    ];
    user.markModified('coachReminderDeliveries');

    this.logger.log(
      `Push ${item.phase} → ${user.email} block ${item.block.label} (${item.block.startTime})`,
    );

    return true;
  }

  private wasAlreadyDelivered(
    user: UserDocument,
    day: DayOfWeek,
    blockId: string,
    phase: CoachPhase,
  ): boolean {
    return (user.coachReminderDeliveries ?? []).some(
      (item) =>
        item.day === day && item.blockId === blockId && item.phase === phase,
    );
  }

  private getEngagementState(
    user: UserDocument,
    day: DayOfWeek,
    blockId: string,
  ): TaskEngagementState {
    const item = (user.coachEngagements ?? []).find(
      (entry) => entry.day === day && entry.blockId === blockId,
    );
    return item?.state ?? TaskEngagementState.Scheduled;
  }

  private mapCoachDayBlocks(user: UserDocument, day: DayOfWeek) {
    const dayPlan = user.weekPlan?.days.find((item) => item.day === day);
    return (dayPlan?.blocks ?? [])
      .filter((block) => !block.cancelled && !block.completed)
      .map((block) => this.mapCoachBlock(block));
  }

  private mapCoachBlock(block: TimelineBlock) {
    return {
      id: block.id,
      label: block.label,
      categoryId: block.categoryId,
      startTime: block.startTime,
      endTime: block.endTime,
    };
  }
}

export { FCM_DATA_TYPES };
