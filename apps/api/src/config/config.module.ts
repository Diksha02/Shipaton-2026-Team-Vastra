import { Global, Module } from '@nestjs/common';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { parseEnv, type Env } from './env';

export const ENV = Symbol('ENV');

/**
 * Global config. Env is parsed exactly once, at module construction, so an
 * invalid environment fails the boot rather than a request.
 */
@Global()
@Module({
  providers: [
    {
      provide: ENV,
      useFactory: (): Env => {
        // Repo-root .env; in production the platform injects real variables and
        // this simply finds nothing to load.
        loadEnv({ path: resolve(process.cwd(), '../../.env') });
        return parseEnv();
      },
    },
  ],
  exports: [ENV],
})
export class ConfigModule {}
