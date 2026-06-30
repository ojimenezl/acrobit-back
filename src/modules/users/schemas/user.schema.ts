import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { DayOfWeek } from '../../../common/enums/day-of-week.enum';
import {
  CoachPhase,
  CoachUserResponse,
  TaskEngagementState,
} from '../../../common/enums/task-engagement.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ _id: false })
export class UserFlowState {
  @Prop({ default: false })
  permissionsGranted!: boolean;

  @Prop({ default: false })
  notificationsEnabled!: boolean;

  @Prop({ default: false })
  onboardingDone!: boolean;

  @Prop({ default: false })
  privacyAccepted!: boolean;

  @Prop({ type: Date })
  privacyAcceptedAt?: Date;

  @Prop({ default: false })
  categoriesSelected!: boolean;

  @Prop({ default: false })
  categoriesSkipped!: boolean;

  @Prop({ default: false })
  weekConfigured!: boolean;

  @Prop({ default: false })
  coachScheduleReviewDone!: boolean;
}

@Schema({ _id: false })
export class TimelineBlock {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  label!: string;

  @Prop({ required: true })
  categoryId!: string;

  @Prop({ required: true })
  startTime!: string;

  @Prop({ required: true })
  endTime!: string;

  @Prop({ default: false })
  isUserDefined!: boolean;

  @Prop({ default: false })
  cancelled!: boolean;

  @Prop({ default: false })
  completed!: boolean;

  @Prop({ enum: ['achieved', 'missed', 'later'], required: false })
  outcome?: 'achieved' | 'missed' | 'later';
}

@Schema({ _id: false })
export class DayPlan {
  @Prop({ required: true, enum: DayOfWeek })
  day!: DayOfWeek;

  @Prop({ default: '' })
  userInput!: string;

  @Prop({ type: [TimelineBlock], default: [] })
  blocks!: TimelineBlock[];
}

@Schema({ _id: false })
export class WeekPlan {
  @Prop({ type: [DayPlan], default: [] })
  days!: DayPlan[];

  @Prop({ type: Date, default: () => new Date() })
  updatedAt!: Date;
}

@Schema({ _id: false })
export class ChatMessage {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true, enum: ['coach', 'user'] })
  sender!: 'coach' | 'user';

  @Prop({ required: true })
  text!: string;

  @Prop({ required: true, type: Date })
  timestamp!: Date;

  @Prop()
  relatedCategory?: string;

  @Prop({ type: [String], default: [] })
  quickReplies!: string[];
}

@Schema({ _id: false })
export class UserNotification {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  body!: string;

  @Prop()
  categoryId?: string;

  @Prop({ required: true, type: Date })
  sentAt!: Date;

  @Prop({ default: false })
  read!: boolean;

  @Prop({ default: false })
  responded!: boolean;

  @Prop({ enum: ['si', 'no', 'reorganizar'] })
  response?: 'si' | 'no' | 'reorganizar';

  @Prop({ enum: ['task-reminder', 'general'], default: 'general' })
  type!: 'task-reminder' | 'general';

  @Prop()
  blockId?: string;

  @Prop({ enum: DayOfWeek })
  day?: DayOfWeek;

  @Prop()
  taskTime?: string;
}

@Schema({ _id: false })
export class UserAchievement {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  code!: string;

  @Prop({ required: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop({ type: Date })
  unlockedAt?: Date;
}

@Schema({ _id: false })
export class UserStats {
  @Prop({ default: 0 })
  completedTasks!: number;

  @Prop({ default: 0 })
  totalWeekTasks!: number;

  @Prop({ default: 0 })
  reorganizedCount!: number;

  @Prop({ default: 0 })
  cancelledCount!: number;
}

@Schema({ _id: false })
export class TaskEngagement {
  @Prop({ required: true })
  blockId!: string;

  @Prop({ required: true, enum: DayOfWeek })
  day!: DayOfWeek;

  @Prop({ required: true, enum: TaskEngagementState })
  state!: TaskEngagementState;

  @Prop({ enum: CoachPhase })
  lastPhase?: CoachPhase;

  @Prop({ enum: CoachUserResponse })
  lastResponse?: CoachUserResponse;

  @Prop({ type: Date, default: () => new Date() })
  updatedAt!: Date;
}

@Schema({ _id: false })
export class CoachPromptRecord {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  blockId!: string;

  @Prop({ required: true, enum: DayOfWeek })
  day!: DayOfWeek;

  @Prop({ required: true, enum: CoachPhase })
  phase!: CoachPhase;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  body!: string;

  @Prop({ type: [String], default: ['yes', 'no', 'reorganize'] })
  quickReplies!: string[];

  @Prop({ required: true })
  categoryId!: string;

  @Prop({ required: true })
  blockLabel!: string;

  @Prop({ required: true })
  startTime!: string;

  @Prop()
  recommendation?: string;

  @Prop({ required: true, type: Date })
  generatedAt!: Date;

  @Prop({ required: true, enum: ['ai', 'fallback'] })
  source!: 'ai' | 'fallback';
}

@Schema({ _id: false })
export class CoachReminderDelivery {
  @Prop({ required: true, enum: DayOfWeek })
  day!: DayOfWeek;

  @Prop({ required: true })
  blockId!: string;

  @Prop({ required: true, enum: CoachPhase })
  phase!: CoachPhase;

  @Prop({ type: Date, required: true })
  sentAt!: Date;

  @Prop({ enum: ['local', 'fcm'], default: 'fcm' })
  source?: 'local' | 'fcm';
}

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, unique: true, index: true })
  firebaseUid!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, trim: true })
  displayName!: string;

  @Prop()
  photoUrl?: string;

  @Prop({ required: true, enum: ['google', 'email', 'mock'], default: 'email' })
  provider!: 'google' | 'email' | 'mock';

  /** Suscripción de pago: de momento siempre «no». */
  @Prop({ required: true, enum: ['si', 'no'], default: 'no' })
  suscrito!: 'si' | 'no';

  @Prop({ type: UserFlowState, default: () => ({}) })
  flow!: UserFlowState;

  /** Actividades elegidas por categoría (labels). */
  @Prop({ type: Object, default: {} })
  selectedActivities!: Record<string, string[]>;

  /** Inputs semánticos: today, tomorrow, dayAfterTomorrow. */
  @Prop({ type: Object, default: {} })
  weekInputs!: Record<string, string>;

  @Prop({ type: WeekPlan, default: () => ({ days: [] }) })
  weekPlan!: WeekPlan;

  @Prop({ type: [ChatMessage], default: [] })
  chatHistory!: ChatMessage[];

  @Prop({ type: [UserNotification], default: [] })
  notifications!: UserNotification[];

  @Prop({ type: [UserAchievement], default: [] })
  achievements!: UserAchievement[];

  @Prop({ type: UserStats, default: () => ({}) })
  stats!: UserStats;

  @Prop({ type: [TaskEngagement], default: [] })
  coachEngagements!: TaskEngagement[];

  @Prop({ type: [CoachPromptRecord], default: [] })
  coachPrompts!: CoachPromptRecord[];

  @Prop({ type: [CoachReminderDelivery], default: [] })
  coachReminderDeliveries!: CoachReminderDelivery[];

  @Prop({ default: false })
  coachChatLocked!: boolean;

  @Prop({ type: Date })
  coachChatLockedAt?: Date;

  @Prop()
  fcmToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
