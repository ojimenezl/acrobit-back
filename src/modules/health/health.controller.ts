import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ConnectionStates } from 'mongoose';

import { OpenAiService } from '../ai/openai.service';
import { CategoriesAppService } from '../categories-app/categories-app.service';
import { MessagesAppService } from '../messages-app/messages-app.service';
import { UsersService } from '../users/users.service';

@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly openAi: OpenAiService,
    private readonly usersService: UsersService,
    private readonly categoriesAppService: CategoriesAppService,
    private readonly messagesAppService: MessagesAppService,
  ) {}

  @Get()
  async check() {
    const mongoConnected =
      this.connection.readyState === ConnectionStates.connected;

    const [users, categories, messages] = mongoConnected
      ? await Promise.all([
          this.usersService.count(),
          this.categoriesAppService.count(),
          this.messagesAppService.count(),
        ])
      : [0, 0, 0];

    return {
      status: mongoConnected ? 'ok' : 'degraded',
      mongo: mongoConnected ? 'connected' : 'disconnected',
      openai: this.openAi.isConfigured
        ? { status: 'configured', model: this.openAi.model }
        : { status: 'missing_key' },
      collections: {
        users,
        categories_app: categories,
        messages_app: messages,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
