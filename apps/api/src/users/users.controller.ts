import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../auth/auth.guard';
import type { VerifiedUser } from '../auth/firebase-token';
import { UsersService, type UserProfile } from './users.service';

/**
 * The caller's own account.
 *
 * Note there is no `:id` here and no user id in any body. Identity comes only
 * from `@CurrentUser`, which came from a signature we verified — an endpoint
 * that accepts an id and trusts it is the standard shape of an IDOR.
 */
@Controller('me')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  async me(@CurrentUser() caller: VerifiedUser): Promise<UserProfile> {
    // Provisions on first sight, so there is no separate sign-up round-trip to
    // fail between authenticating and existing.
    return this.users.provision(caller);
  }
}
