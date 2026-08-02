import { Global, Module, type OnApplicationShutdown } from '@nestjs/common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { createDatabase, type Database } from '@vastra/db';
import { sql } from 'drizzle-orm';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env';

export const DB = Symbol('DB');

@Injectable()
export class DatabaseHealth {
  private readonly logger = new Logger('DatabaseHealth');

  constructor(@Inject(DB) private readonly db: Database) {}

  /** Cheapest possible round-trip that proves the connection is real — a
   *  constructed pool object proves nothing on its own. */
  async ping(): Promise<boolean> {
    try {
      await this.db.execute(sql`select 1`);
      return true;
    } catch (error) {
      this.logger.error('database ping failed', error instanceof Error ? error.stack : error);
      return false;
    }
  }
}

@Global()
@Module({
  providers: [
    {
      provide: DB,
      inject: [ENV],
      useFactory: (env: Env): Database => createDatabase(env.DATABASE_URL),
    },
    DatabaseHealth,
  ],
  exports: [DB, DatabaseHealth],
})
export class DbModule implements OnApplicationShutdown {
  onApplicationShutdown(): void {
    // postgres-js closes its sockets when the process exits; an explicit hook
    // exists here so a future graceful-drain has an obvious home.
  }
}
