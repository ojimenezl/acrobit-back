import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Orígenes del WebView de Capacitor (APK / iOS). Sin estos, la app móvil falla con HTTP status 0. */
const CAPACITOR_ORIGINS = [
  'https://localhost',
  'http://localhost',
  'capacitor://localhost',
  'ionic://localhost',
];

export function configureNestApp(app: INestApplication): void {
  const config = app.get(ConfigService);
  const corsOrigin = config.get<string>('corsOrigin') ?? 'http://localhost:4200';

  const envOrigins = corsOrigin
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const origins = [...new Set([...envOrigins, ...CAPACITOR_ORIGINS])];

  app.enableCors({
    origin: origins.length === 1 ? origins[0] : origins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');
}
