import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DecodedIdToken } from 'firebase-admin/auth';
import { Model } from 'mongoose';

import { MAX_DAILY_BLOCKS } from '../../common/constants/days-of-week';
import { hasRequiredWeekInputs } from '../../common/constants/week-plan';
import { DayOfWeek } from '../../common/enums/day-of-week.enum';
import { TASK_OUTCOME_VALUES } from '../../common/enums/task-outcome.enum';
import { SyncUserDto } from '../auth/dto/sync-user.dto';
import { WeekOrganizerService } from '../organizer/week-organizer.service';
import { TimelineScheduleService } from '../organizer/timeline-schedule.service';
import {
  AppendChatMessageDto,
  PatchDayBlockDto,
  ReorderDayBlocksDto,
  ReplaceDayBlocksDto,
  SetBlockOutcomeDto,
  UpdateFlowStateDto,
  UpdateSelectedActivitiesDto,
  UpdateWeekInputsDto,
} from './dto/user-flow.dto';
import {
  ChatMessage,
  TimelineBlock,
  User,
  UserDocument,
  WeekPlan,
} from './schemas/user.schema';

export interface SyncedUser extends UserDocument {
  isNew: boolean;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly weekOrganizer: WeekOrganizerService,
    private readonly timelineSchedule: TimelineScheduleService,
  ) {}

  count(): Promise<number> {
    return this.userModel.countDocuments().exec();
  }

  findByFirebaseUid(firebaseUid: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ firebaseUid }).exec();
  }

  async requireUser(firebaseUid: string): Promise<UserDocument> {
    const user = await this.findByFirebaseUid(firebaseUid);

    if (!user) {
      throw new NotFoundException(
        'Usuario no encontrado. Llama primero a POST /api/auth/sync-user.',
      );
    }

    return user;
  }

  async syncFromFirebase(
    claims: DecodedIdToken,
    patch: SyncUserDto = {},
  ): Promise<SyncedUser> {
    const firebaseUid = claims.uid;
    const email = (claims.email ?? `${firebaseUid}@users.acrobit.app`).toLowerCase();
    const displayName =
      patch.displayName?.trim() ||
      claims.name?.trim() ||
      email.split('@')[0] ||
      'Usuario';
    const photoUrl = patch.photoUrl ?? claims.picture ?? undefined;
    const provider =
      patch.provider ?? this.mapSignInProvider(claims.firebase.sign_in_provider);

    const existing = await this.userModel.findOne({ firebaseUid }).exec();

    if (existing) {
      existing.email = email;
      existing.displayName = displayName;
      if (photoUrl) {
        existing.photoUrl = photoUrl;
      }
      existing.provider = provider;

      const saved = await existing.save();
      return Object.assign(saved, { isNew: false });
    }

    const created = await this.userModel.create({
      firebaseUid,
      email,
      displayName,
      photoUrl,
      provider,
      suscrito: 'no',
    });

    return Object.assign(created, { isNew: true });
  }

  async updateFlowState(
    firebaseUid: string,
    dto: UpdateFlowStateDto,
  ): Promise<UserDocument> {
    const user = await this.requireUser(firebaseUid);

    if (dto.permissionsGranted !== undefined) {
      user.flow.permissionsGranted = dto.permissionsGranted;
    }
    if (dto.notificationsEnabled !== undefined) {
      user.flow.notificationsEnabled = dto.notificationsEnabled;
    }
    if (dto.onboardingDone !== undefined) {
      user.flow.onboardingDone = dto.onboardingDone;
    }
    if (dto.privacyAccepted !== undefined) {
      user.flow.privacyAccepted = dto.privacyAccepted;
      if (dto.privacyAccepted && !user.flow.privacyAcceptedAt) {
        user.flow.privacyAcceptedAt = new Date();
      }
    }
    if (dto.categoriesSelected !== undefined) {
      user.flow.categoriesSelected = dto.categoriesSelected;
    }
    if (dto.categoriesSkipped !== undefined) {
      user.flow.categoriesSkipped = dto.categoriesSkipped;
    }
    if (dto.weekConfigured !== undefined) {
      user.flow.weekConfigured = dto.weekConfigured;
    }
    if (dto.coachScheduleReviewDone !== undefined) {
      user.flow.coachScheduleReviewDone = dto.coachScheduleReviewDone;
    }

    user.markModified('flow');
    return user.save();
  }

  async updateWeekInputs(
    firebaseUid: string,
    dto: UpdateWeekInputsDto,
  ): Promise<UserDocument> {
    const user = await this.requireUser(firebaseUid);
    user.weekInputs = { ...user.weekInputs, ...dto.weekInputs };
    user.markModified('weekInputs');
    return user.save();
  }

  async updateSelectedActivities(
    firebaseUid: string,
    dto: UpdateSelectedActivitiesDto,
  ): Promise<UserDocument> {
    const user = await this.requireUser(firebaseUid);
    user.selectedActivities = { ...dto.selectedActivities };
    user.markModified('selectedActivities');
    return user.save();
  }

  async organizeWeek(firebaseUid: string): Promise<{
    user: UserDocument;
    aiSummary?: string;
    usedAi: boolean;
    skipped: Array<{ label: string; reason: string }>;
  }> {
    const user = await this.requireUser(firebaseUid);

    if (!hasRequiredWeekInputs(user.weekInputs)) {
      throw new BadRequestException(
        'Faltan inputs obligatorios: today y tomorrow con al menos una tarea.',
      );
    }

    const organized = await this.weekOrganizer.generate(
      user.weekInputs,
      user.selectedActivities,
      user.flow.categoriesSkipped,
    );

    user.weekPlan = organized.weekPlan;
    user.flow.weekConfigured = true;
    user.stats.totalWeekTasks = this.countActiveBlocks(organized.weekPlan);

    user.markModified('weekPlan');
    user.markModified('flow');
    user.markModified('stats');

    const saved = await user.save();
    return {
      user: saved,
      aiSummary: organized.aiSummary,
      usedAi: organized.usedAi,
      skipped: organized.skipped,
    };
  }

  async getWeekPlan(firebaseUid: string): Promise<WeekPlan> {
    const user = await this.requireUser(firebaseUid);
    return user.weekPlan;
  }

  async reorderDayBlocks(
    firebaseUid: string,
    day: DayOfWeek,
    dto: ReorderDayBlocksDto,
  ): Promise<WeekPlan> {
    const user = await this.requireUser(firebaseUid);
    const dayPlan = user.weekPlan.days.find((item) => item.day === day);

    if (!dayPlan) {
      throw new NotFoundException(`No hay plan para el día ${day}.`);
    }

    dayPlan.blocks = this.timelineSchedule.reorderBlocks(
      dayPlan.blocks,
      dto.previousIndex,
      dto.currentIndex,
      { dayStart: this.getDayStart(day) },
    );

    user.weekPlan.updatedAt = new Date();
    user.stats.reorganizedCount += 1;
    user.markModified('weekPlan');
    user.markModified('stats');

    await user.save();
    return user.weekPlan;
  }

  async replaceDayBlocks(
    firebaseUid: string,
    day: DayOfWeek,
    dto: ReplaceDayBlocksDto,
  ): Promise<WeekPlan> {
    const user = await this.requireUser(firebaseUid);
    const dayPlan = user.weekPlan.days.find((item) => item.day === day);

    if (!dayPlan) {
      throw new NotFoundException(`No hay plan para el día ${day}.`);
    }

    const activeCount = dto.blocks.filter((block) => !block.cancelled).length;
    if (activeCount > MAX_DAILY_BLOCKS) {
      throw new BadRequestException(
        `Máximo ${MAX_DAILY_BLOCKS} actividades activas por día.`,
      );
    }

    for (const block of dto.blocks) {
      if (!this.timelineSchedule.isValidTime(block.startTime)) {
        throw new BadRequestException(
          `startTime inválido en bloque ${block.id}.`,
        );
      }
      if (!this.timelineSchedule.isValidTime(block.endTime)) {
        throw new BadRequestException(
          `endTime inválido en bloque ${block.id}.`,
        );
      }
      if (block.startTime >= block.endTime) {
        throw new BadRequestException(
          `Horario inválido en bloque ${block.label}.`,
        );
      }
    }

    dayPlan.blocks = dto.blocks.map((block) => {
      const mapped: TimelineBlock = {
        id: block.id,
        label: block.label.trim(),
        categoryId: block.categoryId,
        startTime: block.startTime,
        endTime: block.endTime,
        isUserDefined: block.isUserDefined ?? block.categoryId === 'usuario',
        cancelled: block.cancelled ?? false,
        completed: block.completed ?? false,
      };

      if (block.outcome) {
        this.applyBlockOutcome(mapped, block.outcome);
      } else if (block.completed) {
        mapped.completed = true;
      }

      return mapped;
    });

    user.weekPlan.updatedAt = new Date();
    user.stats.totalWeekTasks = this.countActiveBlocks(user.weekPlan);
    user.markModified('weekPlan');
    user.markModified('stats');
    await user.save();

    return user.weekPlan;
  }

  async patchDayBlock(
    firebaseUid: string,
    day: DayOfWeek,
    dto: PatchDayBlockDto,
  ): Promise<WeekPlan> {
    const user = await this.requireUser(firebaseUid);
    const dayPlan = user.weekPlan.days.find((item) => item.day === day);

    if (!dayPlan) {
      throw new NotFoundException(`No hay plan para el día ${day}.`);
    }

    const block = dayPlan.blocks.find((item) => item.id === dto.blockId);

    if (!block) {
      throw new NotFoundException(`Bloque ${dto.blockId} no encontrado.`);
    }

    const { patch } = dto;

    if (patch.label !== undefined) {
      if (block.categoryId !== 'usuario' && !block.isUserDefined) {
        throw new BadRequestException(
          'Solo se puede editar el texto de bloques definidos por el usuario.',
        );
      }

      const label = patch.label.trim();
      if (!label) {
        throw new BadRequestException('El texto del bloque no puede estar vacío.');
      }

      block.label = label;
    }

    if (patch.startTime !== undefined) {
      if (!this.timelineSchedule.isValidTime(patch.startTime)) {
        throw new BadRequestException('startTime inválido (formato HH:mm).');
      }

      block.startTime = patch.startTime;
    }

    if (patch.endTime !== undefined) {
      if (!this.timelineSchedule.isValidTime(patch.endTime)) {
        throw new BadRequestException('endTime inválido (formato HH:mm).');
      }

      block.endTime = patch.endTime;
    }

    if (patch.outcome !== undefined) {
      this.applyBlockOutcome(block, patch.outcome);
    }

    if (block.startTime >= block.endTime) {
      throw new BadRequestException('startTime debe ser anterior a endTime.');
    }

    dayPlan.blocks = [...dayPlan.blocks].sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    );

    user.weekPlan.updatedAt = new Date();
    user.markModified('weekPlan');
    await user.save();

    return user.weekPlan;
  }

  async setBlockOutcome(
    firebaseUid: string,
    day: DayOfWeek,
    dto: SetBlockOutcomeDto,
  ): Promise<WeekPlan> {
    const user = await this.requireUser(firebaseUid);
    const dayPlan = user.weekPlan.days.find((item) => item.day === day);

    if (!dayPlan) {
      throw new NotFoundException(`No hay plan para el día ${day}.`);
    }

    const block = dayPlan.blocks.find((item) => item.id === dto.blockId);

    if (!block) {
      throw new NotFoundException(`Bloque ${dto.blockId} no encontrado.`);
    }

    if (block.cancelled) {
      throw new BadRequestException('No se puede marcar una tarea cancelada.');
    }

    this.applyBlockOutcome(block, dto.outcome ?? null);

    user.weekPlan.updatedAt = new Date();
    user.markModified('weekPlan');
    await user.save();

    return user.weekPlan;
  }

  async getChatHistory(firebaseUid: string): Promise<ChatMessage[]> {
    const user = await this.requireUser(firebaseUid);
    return user.chatHistory;
  }

  async appendChatMessage(
    firebaseUid: string,
    dto: AppendChatMessageDto,
  ): Promise<UserDocument> {
    const user = await this.requireUser(firebaseUid);

    user.chatHistory.push({
      id: `chat-${Date.now()}`,
      sender: dto.sender,
      text: dto.text.trim(),
      timestamp: new Date(),
      relatedCategory: dto.relatedCategory,
      quickReplies: dto.quickReplies ?? [],
    });

    user.markModified('chatHistory');
    return user.save();
  }

  private countActiveBlocks(weekPlan: WeekPlan): number {
    return weekPlan.days.reduce(
      (sum, day) =>
        sum + day.blocks.filter((block) => !block.cancelled).length,
      0,
    );
  }

  private applyBlockOutcome(
    block: TimelineBlock,
    outcome: 'achieved' | 'missed' | 'later' | null | undefined,
  ): void {
    if (!outcome) {
      block.outcome = undefined;
      block.completed = false;
      return;
    }

    if (!(TASK_OUTCOME_VALUES as string[]).includes(outcome)) {
      throw new BadRequestException('Estado de tarea inválido.');
    }

    block.outcome = outcome;
    block.completed = outcome === 'achieved';
  }

  private getDayStart(day: DayOfWeek): string {
    const isWeekend = day === DayOfWeek.DOMINGO || day === DayOfWeek.SABADO;
    return this.timelineSchedule.suggestDayStart(isWeekend);
  }

  private mapSignInProvider(
    signInProvider: string | undefined,
  ): 'google' | 'email' | 'mock' {
    switch (signInProvider) {
      case 'google.com':
        return 'google';
      case 'password':
        return 'email';
      default:
        return 'email';
    }
  }
}
