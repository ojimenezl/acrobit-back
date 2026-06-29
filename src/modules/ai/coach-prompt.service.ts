import { Injectable, Logger } from '@nestjs/common';

import { CoachPhase } from '../../common/enums/task-engagement.enum';
import { DayOfWeek } from '../../common/enums/day-of-week.enum';
import { OpenAiService } from './openai.service';
import {
  buildCoachSystemPrompt,
  buildCoachUserMessage,
  coachPromptId,
} from './prompts/coach.prompt';
import {
  CoachAiPromptPayload,
  CoachBlockContext,
  CoachDayContext,
  CoachPromptInput,
  CoachPromptResult,
} from './types/coach-prompt.types';

const COACH_TITLE = 'Acrobit quiere preguntarte';
const PREP_MINUTES = 10;

@Injectable()
export class CoachPromptService {
  private readonly logger = new Logger(CoachPromptService.name);

  constructor(private readonly openAi: OpenAiService) {}

  async generatePrompt(input: CoachPromptInput): Promise<CoachPromptResult> {
    const aiPayload = await this.requestAiPayload(input);
    if (aiPayload) {
      return this.toResult(input, aiPayload, 'ai');
    }

    return this.buildFallback(input);
  }

  async generateRecommendation(
    input: CoachPromptInput,
  ): Promise<string | null> {
    const withRec = await this.requestAiPayload({
      ...input,
      phase: CoachPhase.Prep,
    });

    const recommendation = withRec?.recommendation?.trim();
    if (recommendation) {
      return recommendation.slice(0, 120);
    }

    return null;
  }

  async generateDayPrompts(
    day: DayOfWeek,
    blocks: CoachBlockContext[],
  ): Promise<{ prompts: CoachPromptResult[]; usedAi: boolean }> {
    const dayContext: CoachDayContext = { day, blocks };
    const active = blocks.filter((block) => block.label.trim().length > 0);

    const prompts: CoachPromptResult[] = [];
    let usedAi = false;

    for (const block of active) {
      for (const phase of [CoachPhase.Prep, CoachPhase.AtTime]) {
        const result = await this.generatePrompt({
          day,
          phase,
          block,
          dayContext,
          prepMinutesBefore: PREP_MINUTES,
        });
        if (result.source === 'ai') {
          usedAi = true;
        }
        prompts.push(result);
      }
    }

    return { prompts, usedAi };
  }

  private async requestAiPayload(
    input: CoachPromptInput,
  ): Promise<CoachAiPromptPayload | null> {
    if (!this.openAi.isConfigured) {
      return null;
    }

    try {
      const client = this.openAi.getClient();
      const response = await client.chat.completions.create({
        model: this.openAi.model,
        max_tokens: 400,
        temperature: 0.65,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildCoachSystemPrompt() },
          { role: 'user', content: buildCoachUserMessage(input) },
        ],
      });

      const raw = response.choices[0]?.message?.content?.trim();
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const title =
        typeof parsed['title'] === 'string' && parsed['title'].trim()
          ? parsed['title'].trim().slice(0, 80)
          : COACH_TITLE;
      const body =
        typeof parsed['body'] === 'string' && parsed['body'].trim()
          ? parsed['body'].trim().slice(0, 220)
          : null;

      if (!body) {
        return null;
      }

      const recommendation =
        input.phase === CoachPhase.Prep &&
        typeof parsed['recommendation'] === 'string'
          ? parsed['recommendation'].trim().slice(0, 120)
          : undefined;

      return {
        title,
        body,
        recommendation: recommendation || undefined,
      };
    } catch (error) {
      this.logger.warn(
        `Coach AI falló (${input.block.label}/${input.phase}): ${String(error)}`,
      );
      return null;
    }
  }

  private buildFallback(input: CoachPromptInput): CoachPromptResult {
    const { block, day, phase } = input;
    const body =
      phase === CoachPhase.Prep
        ? `En ${input.prepMinutesBefore} min toca ${block.label} (${block.startTime}). ¿Empezamos?`
        : `¡Hora de ${block.label}! Que lo disfrutes.`;

    return this.toResult(
      input,
      {
        title: COACH_TITLE,
        body,
      },
      'fallback',
    );
  }

  private toResult(
    input: CoachPromptInput,
    payload: CoachAiPromptPayload,
    source: 'ai' | 'fallback',
  ): CoachPromptResult {
    const { block, day, phase } = input;

    return {
      id: coachPromptId(day, block.id, phase),
      blockId: block.id,
      day,
      phase,
      title: payload.title || COACH_TITLE,
      body: payload.body,
      quickReplies: ['yes', 'no', 'reorganize'],
      categoryId: block.categoryId,
      blockLabel: block.label,
      startTime: block.startTime,
      recommendation: payload.recommendation,
      generatedAt: new Date().toISOString(),
      source,
    };
  }
}
