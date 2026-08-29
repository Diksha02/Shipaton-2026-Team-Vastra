import { Global, Logger, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env';
import { FirebaseAuthGuard } from './auth.guard';
import { FirebaseTokenVerifier } from './firebase-token';
import { FIREBASE_VERIFIER } from './auth.tokens';

/**
 * Authentication.
 *
 * The guard is registered as `APP_GUARD`, so **every** route is protected
 * unless it explicitly says otherwise with `@Public()` or `@OptionalAuth()`.
 * That ordering matters: a forgotten decorator then yields a locked endpoint,
 * which is a bug report, rather than an open one, which is a breach.
 *
 * The verifier is null when `FIREBASE_PROJECT_ID` is absent — the API still
 * boots so the health check and public routes work before any account exists,
 * but authenticated routes answer 503 rather than letting tokens through
 * unchecked.
 */
@Global()
@Module({
  providers: [
    {
      provide: FIREBASE_VERIFIER,
      inject: [ENV],
      useFactory: (env: Env): FirebaseTokenVerifier | null => {
        if (!env.FIREBASE_PROJECT_ID) {
          new Logger('AuthModule').warn(
            'FIREBASE_PROJECT_ID is not set — authenticated routes will answer 503.',
          );
          return null;
        }
        return new FirebaseTokenVerifier({ projectId: env.FIREBASE_PROJECT_ID });
      },
    },
    { provide: APP_GUARD, useClass: FirebaseAuthGuard },
  ],
  exports: [FIREBASE_VERIFIER],
})
export class AuthModule {}

export { FIREBASE_VERIFIER } from './auth.tokens';
