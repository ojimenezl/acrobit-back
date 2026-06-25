import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  MessagesApp,
  MessagesAppSchema,
} from './schemas/messages-app.schema';
import { MessagesAppController } from './messages-app.controller';
import { MessagesAppService } from './messages-app.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MessagesApp.name, schema: MessagesAppSchema },
    ]),
  ],
  controllers: [MessagesAppController],
  providers: [MessagesAppService],
  exports: [MessagesAppService, MongooseModule],
})
export class MessagesAppModule {}
