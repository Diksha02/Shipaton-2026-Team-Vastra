import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FirebaseAuthGuard, OPTIONAL_AUTH, PUBLIC_ROUTE, type AuthedRequest } from './auth.guard';
import { TokenVerificationError, type FirebaseTokenVerifier } from './firebase-token';

/**
 * The guard's job is to be closed by default. These tests exist mainly to catch
 * the failure that does not look like a failure: a request sailing through
 * because something was misconfigured rather than because it was authorised.
 */

function contextFor(headers: Record<string, string> = {}) {
  const request = { headers } as unknown as AuthedRequest;
  return {
    request,
    ctx: {
      getHandler: () => () => undefined,
      getClass: () => class {},
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext,
  };
}

function reflectorWith(meta: Record<string, boolean>): Reflector {
  const reflector = new Reflector();
  vi.spyOn(reflector, 'getAllAndOverride').mockImplementation(
    (key: unknown) => meta[key as string] as never,
  );
  return reflector;
}

const verified = {
  uid: 'uid-1',
  email: null,
  emailVerified: false,
  phoneNumber: null,
  signInProvider: 'google.com',
  authTime: null,
};

let verifier: FirebaseTokenVerifier;

beforeEach(() => {
  verifier = { verify: vi.fn().mockResolvedValue(verified) } as unknown as FirebaseTokenVerifier;
});

describe('closed by default', () => {
  it('rejects a request with no Authorization header', async () => {
    const guard = new FirebaseAuthGuard(reflectorWith({}), verifier);
    const { ctx } = contextFor();
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a malformed Authorization header', async () => {
    const guard = new FirebaseAuthGuard(reflectorWith({}), verifier);
    const { ctx } = contextFor({ authorization: 'Basic abc' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    expect(verifier.verify).not.toHaveBeenCalled();
  });

  it('attaches the verified user on success', async () => {
    const guard = new FirebaseAuthGuard(reflectorWith({}), verifier);
    const { ctx, request } = contextFor({ authorization: 'Bearer good.token.here' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.user).toEqual(verified);
  });
});

describe('unconfigured must not mean unprotected', () => {
  it('answers 503 rather than allowing the request when there is no verifier', async () => {
    // The failure that would otherwise be invisible: FIREBASE_PROJECT_ID unset
    // in production, every token waved through, everything looks fine.
    const guard = new FirebaseAuthGuard(reflectorWith({}), null);
    const { ctx, request } = contextFor({ authorization: 'Bearer anything' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ServiceUnavailableException);
    expect(request.user).toBeUndefined();
  });
});

describe('@Public', () => {
  it('allows a request with no token at all', async () => {
    const guard = new FirebaseAuthGuard(reflectorWith({ [PUBLIC_ROUTE]: true }), verifier);
    await expect(guard.canActivate(contextFor().ctx)).resolves.toBe(true);
  });

  it('does not even consult the verifier', async () => {
    const guard = new FirebaseAuthGuard(reflectorWith({ [PUBLIC_ROUTE]: true }), null);
    await expect(guard.canActivate(contextFor().ctx)).resolves.toBe(true);
  });
});

describe('@OptionalAuth', () => {
  it('allows an anonymous request and leaves user unset', async () => {
    const guard = new FirebaseAuthGuard(reflectorWith({ [OPTIONAL_AUTH]: true }), verifier);
    const { ctx, request } = contextFor();
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.user).toBeUndefined();
  });

  it('still identifies a caller who does present a valid token', async () => {
    const guard = new FirebaseAuthGuard(reflectorWith({ [OPTIONAL_AUTH]: true }), verifier);
    const { ctx, request } = contextFor({ authorization: 'Bearer good.token.here' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.user).toEqual(verified);
  });

  it('degrades an expired token to anonymous rather than emptying the screen', async () => {
    verifier.verify = vi.fn().mockRejectedValue(new TokenVerificationError('nope', 'expired'));
    const guard = new FirebaseAuthGuard(reflectorWith({ [OPTIONAL_AUTH]: true }), verifier);
    const { ctx, request } = contextFor({ authorization: 'Bearer stale.token.here' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.user).toBeUndefined();
  });
});

describe('distinguishing our fault from theirs', () => {
  it('answers 503, not 401, when Google is unreachable', async () => {
    // A 401 here tells users their login is invalid and sends them round a
    // re-authentication loop that cannot possibly help.
    verifier.verify = vi.fn().mockRejectedValue(new TokenVerificationError('jwks', 'unavailable'));
    const guard = new FirebaseAuthGuard(reflectorWith({}), verifier);
    const { ctx } = contextFor({ authorization: 'Bearer good.token.here' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ServiceUnavailableException);
  });

  it('answers 503 even on an optional route, rather than silently anonymising', async () => {
    verifier.verify = vi.fn().mockRejectedValue(new TokenVerificationError('jwks', 'unavailable'));
    const guard = new FirebaseAuthGuard(reflectorWith({ [OPTIONAL_AUTH]: true }), verifier);
    const { ctx } = contextFor({ authorization: 'Bearer good.token.here' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ServiceUnavailableException);
  });

  it('answers 401 for a genuinely invalid token', async () => {
    verifier.verify = vi.fn().mockRejectedValue(new TokenVerificationError('bad', 'wrong_audience'));
    const guard = new FirebaseAuthGuard(reflectorWith({}), verifier);
    const { ctx } = contextFor({ authorization: 'Bearer forged.token.here' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });
});
