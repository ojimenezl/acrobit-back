import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { AppModule } from '../app.module';
import {
  CategoriesApp,
  CategoriesAppDocument,
} from '../modules/categories-app/schemas/categories-app.schema';
import {
  MessagesApp,
  MessagesAppDocument,
} from '../modules/messages-app/schemas/messages-app.schema';
import { CATEGORIES_APP_SEED, MESSAGES_APP_SEED } from './seed-data';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const categoriesModel = app.get<Model<CategoriesAppDocument>>(
      getModelToken(CategoriesApp.name),
    );
    const messagesModel = app.get<Model<MessagesAppDocument>>(
      getModelToken(MessagesApp.name),
    );

    for (const item of CATEGORIES_APP_SEED) {
      await categoriesModel.updateOne(
        { categoryId: item.categoryId },
        { $set: { ...item, active: true } },
        { upsert: true },
      );
    }

    for (const item of MESSAGES_APP_SEED) {
      await messagesModel.updateOne(
        { dayOfYear: item.dayOfYear },
        { $set: { ...item, active: true } },
        { upsert: true },
      );
    }

    console.log(
      `[seed] categories_app: ${CATEGORIES_APP_SEED.length} · messages_app: ${MESSAGES_APP_SEED.length}`,
    );
  } finally {
    await app.close();
  }
}

void bootstrap();
