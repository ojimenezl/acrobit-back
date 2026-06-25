import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express } from 'express';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { AppModule } from './app.module';
import { configureNestApp } from './configure-app';

let cachedServer: Express | null = null;
let bootstrapPromise: Promise<Express> | null = null;

async function createServer(): Promise<Express> {
  if (cachedServer) {
    return cachedServer;
  }

  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const expressApp = express();
      const adapter = new ExpressAdapter(expressApp);
      const app = await NestFactory.create(AppModule, adapter, {
        logger: ['error', 'warn', 'log'],
      });

      configureNestApp(app);
      await app.init();
      cachedServer = expressApp;
      return expressApp;
    })();
  }

  return bootstrapPromise;
}

async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const server = await createServer();
  server(req, res);
}

export default handler;
