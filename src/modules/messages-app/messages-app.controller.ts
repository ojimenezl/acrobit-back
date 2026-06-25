import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import { MessagesAppService } from './messages-app.service';
import { toDailyMessageResponse } from './messages-app.mapper';

@Controller('messages-app')
export class MessagesAppController {
  constructor(private readonly messagesAppService: MessagesAppService) {}

  @Get(':dayOfYear')
  async findByDay(
    @Param('dayOfYear', ParseIntPipe) dayOfYear: number,
  ) {
    if (dayOfYear < 1 || dayOfYear > 365) {
      throw new NotFoundException('Día del año debe estar entre 1 y 365.');
    }

    const message = await this.messagesAppService.findByDayOfYear(dayOfYear);

    if (!message) {
      throw new NotFoundException(
        `No hay mensaje activo para el día ${dayOfYear}.`,
      );
    }

    return { message: toDailyMessageResponse(message) };
  }
}
