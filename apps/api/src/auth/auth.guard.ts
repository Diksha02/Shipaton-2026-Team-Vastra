import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
  SetMetadata,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import {
  TokenVerificationError,
  bearerFrom,
  type FirebaseTokenVerifier,
  type VerifiedUser,
} from './firebase-token';
import { FIREBASE_VERIFIER } from './auth.tokens';

/**
 * Marks a route as reachable without a token.
 *
 * Opt-*out* rather than opt-in: the guard is global, so a new endpoint is
 * protected by default and making it public is a visible, deliberate line of
 * code. The reverse — remembering to add a guard — is the standard way an
 * endpoint ships unauthenticated.
 */
export const PUBLIC_ROUTE = 'auth:public';
export const Public = () => SetMetadata(PUBLIC_ROUTE, true);

/**
 * Marks a route that reads the user when present but does not require one.
 *
 * Needed for the Looks feed, which shows the same posts to a signed-out browser
 * and a signed-in user, but must know who is looking to mark their own likes.
 */
export const OPTIONAL_AUTH = 'auth:optional';
export const OptionalAuth = () => SetMetadata(OPTIONAL_AUTH, true);

export interface AuthedRequest extends Request {
  user?: VerifiedUser;
}

/** The verified caller. Never read identity from a body or query parameter —
 *  only this, which came from a signature we checked. */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest<AuthedRequest>().user;
});

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger('FirebaseAuthGuard');

  constructor(
    private readonly reflector: Reflector,
    @Inject(FIREBASE_VERIFIER) private readonly verifier: FirebaseTokenVerifier | null,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE, targets) ?? false;
    if (isPublic) return true;

    const isOptional = this.reflector.getAllAndOverride<boolean>(OPTIONAL_AUTH, targets) ?? false;
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const token = bearerFrom(request.headers.authorization);

    if (!token) {
      if (isOptional) return true;
      throw new UnauthorizedException('Sign in to continue.');
    }

    // Unconfigured must never mean unprotected. If FIREBASE_PROJECT_ID is
    // absent we cannot verify anything, so every authenticated route closes
    // rather than waving tokens through.
    if (!this.verifier) {
      throw new ServiceUnavailableException('Authentication is not configured.');
    }

    try {
      request.user = await this.verifier.verify(token);
      return true;
    } catch (error) {
      if (error instanceof TokenVerificationError && error.reason === 'unavailable') {
        // Google was unreachable — our problem, not the caller's. A 401 here
        // would tell users their login is invalid and send them round a
        // pointless re-authentication loop.
        this.logger.error('JWKS unavailable; failing closed with 503');
        throw new ServiceUnavailableException('Could not verify sign-in. Try again shortly.');
      }

      // A bad token on an optional route is treated as anonymous, not as an
      // error: an expired token while scrolling a public feed should not empty
      // the screen.
      if (isOptional) return true;

      throw new UnauthorizedException('Your session has expired. Sign in again.');
    }
  }
}
