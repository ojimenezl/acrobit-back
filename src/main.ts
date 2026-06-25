import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';
import { configureNestApp } from './configure-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureNestApp(app);

  const config = app.get(ConfigService);
  const port = config.get<number>('port') ?? 3000;
  await app.listen(port);

  console.log(`[Acrobit API] http://localhost:${port}/api/health`);
}

void bootstrap();
