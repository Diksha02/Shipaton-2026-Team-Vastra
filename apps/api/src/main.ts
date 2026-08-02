import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ENV } from './config/config.module';
import type { Env } from './config/env';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    // RevenueCat webhook signatures are computed over the exact bytes received.
    // Without the raw body, verification is impossible after Express reserialises
    // the JSON (PROJECT.md §5.4).
    rawBody: true,
  });

  const env = app.get<Env>(ENV);
  const logger = new Logger('Bootstrap');

  app.use(helmet());
  app.setGlobalPrefix('v1');
  app.enableShutdownHooks();

  // Binds to 127.0.0.1 unless API_HOST is set deliberately. Exposing the API on
  // a public interface must be an explicit deployment decision.
  await app.listen(env.API_PORT, env.API_HOST);

  logger.log(`API listening on http://${env.API_HOST}:${env.API_PORT}/v1`);
  logger.log(`environment: ${env.NODE_ENV}`);
}

void bootstrap();
