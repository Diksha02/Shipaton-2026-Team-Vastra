import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { AppExceptionFilter } from './common/app-exception.filter';
import { EnvelopeInterceptor } from './common/envelope.interceptor';
import { ConfigModule } from './config/config.module';
import { DbModule } from './db/db.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';

/**
 * The envelope interceptor and exception filter are registered globally rather
 * than per-controller, so the `{ data }` / `{ error }` contract in PROJECT.md §7
 * holds by construction and cannot be forgotten on a new endpoint.
 */
@Module({
  imports: [ConfigModule, AuthModule, DbModule, HealthModule, UsersModule],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: EnvelopeInterceptor },
    { provide: APP_FILTER, useClass: AppExceptionFilter },
  ],
})
export class AppModule {}
