import { Injectable, NotFoundException } from '@nestjs/common';

import { DayOfWeek } from '../../common/enums/day-of-week.enum';
import {
  CoachPhase,
  CoachUserResponse,
  TaskEngagementState,
} from '../../common/enums/task-engagement.enum';
import { nextEngagementState } from '../../common/utils/coach-engagement.util';
import {
  CoachRespondDto,
  PatchCoachEngagementDto,
} from './dto/coach.dto';
import { TaskEngagement, UserDocument } from './schemas/user.schema';

export type CoachRespondFollowUp =
  | 'none'
  | 'prep_recommendation'
  | 'closing'
  | 'reorganize'
  | 'mute_ack';

export interface CoachEngagementResponse {
  blockId: string;
  day: DayOfWeek;
  state: TaskEngagementState;
  lastPhase?: CoachPhase;
  lastResponse?: CoachUserResponse;
  updatedAt: string;
}

@Injectable()
export class CoachEngagementService {
  listEngagements(user: UserDocument): CoachEngagementResponse[] {
    return (user.coachEngagements ?? []).map((item) =>
      this.toResponse(item),
    );
  }

  patchEngagement(
    user: UserDocument,
    dto: PatchCoachEngagementDto,
  ): CoachEngagementResponse {
    const engagements = [...(user.coachEngagements ?? [])];
    const index = engagements.findIndex(
      (item) => item.day === dto.day && item.blockId === dto.blockId,
    );

    const updatedAt = dto.updatedAt ? new Date(dto.updatedAt) : new Date();
    const next: TaskEngagement = {
      blockId: dto.blockId,
      day: dto.day,
      state: dto.state,
      lastPhase: dto.lastPhase,
      lastResponse: dto.lastResponse,
      updatedAt,
    };

    if (index >= 0) {
      engagements[index] = { ...engagements[index], ...next };
    } else {
      engagements.push(next);
    }

    user.coachEngagements = engagements;
    user.markModified('coachEngagements');
    return this.toResponse(
      index >= 0 ? engagements[index] : engagements[engagements.length - 1],
    );
  }

  respondToCoach(
    user: UserDocument,
    dto: CoachRespondDto,
  ): {
    engagement: CoachEngagementResponse;
    followUp: CoachRespondFollowUp;
  } {
    const existing = (user.coachEngagements ?? []).find(
      (item) => item.day === dto.day && item.blockId === dto.blockId,
    );
    const current = existing?.state ?? TaskEngagementState.Scheduled;
    const nextState = nextEngagementState(current, {
      type: 'user_response',
      phase: dto.phase,
      response: dto.response,
    });

    const engagement = this.patchEngagement(user, {
      day: dto.day,
      blockId: dto.blockId,
      state: nextState,
      lastPhase: dto.phase,
      lastResponse: dto.response,
      updatedAt: new Date().toISOString(),
    });

    return {
      engagement,
      followUp: this.resolveFollowUp(dto.phase, dto.response),
    };
  }

  requireBlock(user: UserDocument, day: DayOfWeek, blockId: string): void {
    const block = user.weekPlan?.days
      .find((item) => item.day === day)
      ?.blocks.find((item) => item.id === blockId);

    if (!block || block.cancelled) {
      throw new NotFoundException('Bloque no encontrado para el coach.');
    }
  }

  private resolveFollowUp(
    phase: CoachPhase,
    response: CoachUserResponse,
  ): CoachRespondFollowUp {
    if (response === CoachUserResponse.No) {
      return 'mute_ack';
    }
    if (response === CoachUserResponse.Reorganize) {
      return 'reorganize';
    }
    if (response === CoachUserResponse.Yes) {
      return phase === CoachPhase.Prep ? 'prep_recommendation' : 'closing';
    }
    return 'none';
  }

  private toResponse(item: TaskEngagement): CoachEngagementResponse {
    return {
      blockId: item.blockId,
      day: item.day,
      state: item.state,
      lastPhase: item.lastPhase,
      lastResponse: item.lastResponse,
      updatedAt: new Date(item.updatedAt).toISOString(),
    };
  }
}
