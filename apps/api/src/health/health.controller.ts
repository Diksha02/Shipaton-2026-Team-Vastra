import { Controller, Get, Inject } from '@nestjs/common';
import { Public } from '../auth/auth.guard';
import { DEFAULT_FLAGS } from '@vastra/shared';
import { ENV } from '../config/config.module';
import { integrationStatus, type Env } from '../config/env';
import { DatabaseHealth } from '../db/db.module';

@Public()
@Controller('health')
export class HealthController {
  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly database: DatabaseHealth,
  ) {}

  /**
   * Liveness plus a real dependency check.
   *
   * `integrations` reports which credentials are actually configured, which is
   * what makes "build against fakes first" workable: it is visible at a glance
   * which features are live and which are still stubbed.
   *
   * Deliberately exposes no secret values — only booleans.
   */
  @Get()
  async check() {
    const databaseOk = await this.database.ping();

    return {
      status: databaseOk ? 'ok' : 'degraded',
      environment: this.env.NODE_ENV,
      checks: {
        database: databaseOk ? 'up' : 'down',
      },
      integrations: integrationStatus(this.env),
      flags: DEFAULT_FLAGS,
    };
  }
}
