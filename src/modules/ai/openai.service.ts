import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAiService implements OnModuleInit {
  private readonly logger = new Logger(OpenAiService.name);
  private client: OpenAI | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const apiKey = this.config.get<string>('openaiApiKey');
    if (!apiKey?.trim()) {
      this.logger.warn(
        'OPENAI_API_KEY no configurado. El organizador IA usará fallback local.',
      );
      return;
    }

    this.client = new OpenAI({ apiKey: apiKey.trim() });
    this.logger.log(
      `OpenAI listo (modelo: ${this.config.get<string>('openaiModel')}).`,
    );
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  get model(): string {
    return this.config.get<string>('openaiModel') ?? 'gpt-4o-mini';
  }

  get maxOutputTokens(): number {
    return this.config.get<number>('openaiMaxOutputTokens') ?? 6000;
  }

  /** Cliente SDK. Lanza si no hay API key. */
  getClient(): OpenAI {
    if (!this.client) {
      throw new Error('OpenAI no está configurado (OPENAI_API_KEY).');
    }
    return this.client;
  }
}
