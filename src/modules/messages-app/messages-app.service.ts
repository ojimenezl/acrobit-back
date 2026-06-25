import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  MessagesApp,
  MessagesAppDocument,
} from './schemas/messages-app.schema';

@Injectable()
export class MessagesAppService {
  constructor(
    @InjectModel(MessagesApp.name)
    private readonly messagesModel: Model<MessagesAppDocument>,
  ) {}

  count(): Promise<number> {
    return this.messagesModel.countDocuments().exec();
  }

  findByDayOfYear(dayOfYear: number): Promise<MessagesAppDocument | null> {
    return this.messagesModel.findOne({ dayOfYear, active: true }).exec();
  }
}
