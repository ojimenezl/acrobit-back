import { Injectable } from '@nestjs/common';

import { DayOfWeek } from '../../common/enums/day-of-week.enum';
import { CoachPhase } from '../../common/enums/task-engagement.enum';
import { CoachPromptResult } from '../ai/types/coach-prompt.types';
import { CoachPromptRecord, UserDocument } from './schemas/user.schema';

export interface CoachPromptResponse {
  id: string;
  blockId: string;
  day: DayOfWeek;
  phase: CoachPromptResult['phase'];
  title: string;
  body: string;
  quickReplies: CoachPromptResult['quickReplies'];
  categoryId: string;
  blockLabel: string;
  startTime: string;
  recommendation?: string;
  generatedAt: string;
  source: 'ai' | 'fallback';
}

@Injectable()
export class CoachPromptStoreService {
  listPrompts(user: UserDocument, day?: DayOfWeek): CoachPromptResponse[] {
    const items = user.coachPrompts ?? [];
    const filtered = day ? items.filter((item) => item.day === day) : items;
    return filtered.map((item) => this.toResponse(item));
  }

  upsertPrompt(user: UserDocument, prompt: CoachPromptResult): CoachPromptResponse {
    const prompts = [...(user.coachPrompts ?? [])];
    const generatedAt = new Date(prompt.generatedAt);
    const next: CoachPromptRecord = {
      id: prompt.id,
      blockId: prompt.blockId,
      day: prompt.day,
      phase: prompt.phase,
      title: prompt.title,
      body: prompt.body,
      quickReplies: [...prompt.quickReplies],
      categoryId: prompt.categoryId,
      blockLabel: prompt.blockLabel,
      startTime: prompt.startTime,
      recommendation: prompt.recommendation,
      generatedAt,
      source: prompt.source,
    };

    const index = prompts.findIndex((item) => item.id === prompt.id);
    if (index >= 0) {
      const existing = prompts[index];
      const existingTime = new Date(existing.generatedAt).getTime();
      if (generatedAt.getTime() < existingTime) {
        return this.toResponse(existing);
      }
      prompts[index] = { ...existing, ...next };
    } else {
      prompts.push(next);
    }

    user.coachPrompts = prompts;
    user.markModified('coachPrompts');
    return this.toResponse(index >= 0 ? prompts[index] : prompts[prompts.length - 1]);
  }

  upsertPrompts(
    user: UserDocument,
    items: CoachPromptResult[],
  ): CoachPromptResponse[] {
    return items.map((prompt) => this.upsertPrompt(user, prompt));
  }

  setRecommendation(
    user: UserDocument,
    day: DayOfWeek,
    blockId: string,
    recommendation: string | null,
  ): CoachPromptResponse | null {
    const prompts = [...(user.coachPrompts ?? [])];
    const index = prompts.findIndex(
      (item) =>
        item.day === day &&
        item.blockId === blockId &&
        item.phase === CoachPhase.Prep,
    );

    if (index < 0) {
      return null;
    }

    prompts[index] = {
      ...prompts[index],
      recommendation: recommendation ?? undefined,
    };
    user.coachPrompts = prompts;
    user.markModified('coachPrompts');
    return this.toResponse(prompts[index]);
  }

  invalidateBlock(user: UserDocument, day: DayOfWeek, blockId: string): void {
    user.coachPrompts = (user.coachPrompts ?? []).filter(
      (item) => !(item.day === day && item.blockId === blockId),
    );
    user.markModified('coachPrompts');
  }

  private toResponse(item: CoachPromptRecord): CoachPromptResponse {
    return {
      id: item.id,
      blockId: item.blockId,
      day: item.day,
      phase: item.phase as CoachPromptResult['phase'],
      title: item.title,
      body: item.body,
      quickReplies: item.quickReplies as CoachPromptResult['quickReplies'],
      categoryId: item.categoryId,
      blockLabel: item.blockLabel,
      startTime: item.startTime,
      recommendation: item.recommendation,
      generatedAt: new Date(item.generatedAt).toISOString(),
      source: item.source,
    };
  }
}
