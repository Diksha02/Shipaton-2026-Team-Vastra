import { SignJWT, exportJWK, generateKeyPair, type JWK } from 'jose';
import { createLocalJWKSet } from 'jose';
import { beforeAll, describe, expect, it } from 'vitest';
import { FirebaseTokenVerifier, TokenVerificationError, bearerFrom } from './firebase-token';

/**
 * Real signatures against a real key set — only the *source* of the keys is
 * local. A verifier tested with stubs proves nothing: the whole job of this
 * class is to reject tokens that are subtly wrong, and only a genuine signing
 * round-trip can produce those.
 */

const PROJECT = 'vastra-bd3ba';
const OTHER_PROJECT = 'someone-elses-app';

// Inferred rather than named: `CryptoKey` is a DOM global this tsconfig does
// not pull in, and the key type is jose's business anyway.
let privateKey: Awaited<ReturnType<typeof generateKeyPair>>['privateKey'];
let jwks: JWK;
let verifier: FirebaseTokenVerifier;

async function mint(
  claims: Record<string, unknown>,
  overrides: { issuer?: string; audience?: string; expires?: string | number } = {},
): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
    .setIssuedAt()
    .setIssuer(overrides.issuer ?? `https://securetoken.google.com/${PROJECT}`)
    .setAudience(overrides.audience ?? PROJECT)
    .setExpirationTime(overrides.expires ?? '1h')
    .sign(privateKey);
}

beforeAll(async () => {
  const pair = await generateKeyPair('RS256', { extractable: true });
  privateKey = pair.privateKey;
  jwks = { ...(await exportJWK(pair.publicKey)), kid: 'test-key', alg: 'RS256', use: 'sig' };
  verifier = new FirebaseTokenVerifier({
    projectId: PROJECT,
    jwks: createLocalJWKSet({ keys: [jwks] }),
  });
});

describe('accepting a valid token', () => {
  it('returns the uid and claims', async () => {
    const authTime = Math.floor(Date.now() / 1000) - 120;
    const token = await mint({
      sub: 'firebase-uid-123',
      user_id: 'firebase-uid-123',
      email: 'ujjwal@example.com',
      email_verified: true,
      auth_time: authTime,
      firebase: { sign_in_provider: 'apple.com' },
    });

    const user = await verifier.verify(token);
    expect(user.uid).toBe('firebase-uid-123');
    expect(user.email).toBe('ujjwal@example.com');
    expect(user.emailVerified).toBe(true);
    expect(user.signInProvider).toBe('apple.com');
    expect(user.authTime?.getTime()).toBe(authTime * 1000);
  });

  it('does not treat an absent email as verified', async () => {
    const user = await verifier.verify(await mint({ sub: 'u1' }));
    expect(user.email).toBeNull();
    expect(user.emailVerified).toBe(false);
    expect(user.phoneNumber).toBeNull();
  });

  it('reads email_verified strictly, not truthily', async () => {
    // Firebase sends a boolean. A string "false" is truthy in JS and would
    // wrongly mark an unverified address as verified.
    const user = await verifier.verify(
      await mint({ sub: 'u1', email: 'a@b.com', email_verified: 'false' }),
    );
    expect(user.emailVerified).toBe(false);
  });
});

describe('rejecting tokens', () => {
  it('rejects a token for a different Firebase project', async () => {
    // The important one. Another project's tokens are signed by the *same*
    // Google keys, so signature checking alone would accept them and let any
    // Firebase user anywhere sign in as one of ours.
    const token = await mint(
      { sub: 'attacker' },
      {
        issuer: `https://securetoken.google.com/${OTHER_PROJECT}`,
        audience: OTHER_PROJECT,
      },
    );
    await expect(verifier.verify(token)).rejects.toThrow(TokenVerificationError);
  });

  it('rejects a right-issuer, wrong-audience token', async () => {
    const token = await mint({ sub: 'attacker' }, { audience: OTHER_PROJECT });
    await expect(verifier.verify(token)).rejects.toMatchObject({ reason: 'wrong_audience' });
  });

  it('rejects an expired token', async () => {
    const token = await mint({ sub: 'u1' }, { expires: Math.floor(Date.now() / 1000) - 3600 });
    await expect(verifier.verify(token)).rejects.toMatchObject({ reason: 'expired' });
  });

  it('rejects a token with no subject', async () => {
    await expect(verifier.verify(await mint({ email: 'a@b.com' }))).rejects.toMatchObject({
      reason: 'no_subject',
    });
  });

  it('rejects an auth_time in the future', async () => {
    const token = await mint({ sub: 'u1', auth_time: Math.floor(Date.now() / 1000) + 86400 });
    await expect(verifier.verify(token)).rejects.toMatchObject({ reason: 'future_auth_time' });
  });

  it('rejects a token signed by an unknown key', async () => {
    const rogue = await generateKeyPair('RS256', { extractable: true });
    const token = await new SignJWT({ sub: 'attacker' })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
      .setIssuedAt()
      .setIssuer(`https://securetoken.google.com/${PROJECT}`)
      .setAudience(PROJECT)
      .setExpirationTime('1h')
      .sign(rogue.privateKey);
    await expect(verifier.verify(token)).rejects.toThrow(TokenVerificationError);
  });

  it('rejects an unsigned "alg: none" token', async () => {
    // The classic JWT attack. `algorithms: ['RS256']` is what stops it.
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(
      JSON.stringify({
        sub: 'attacker',
        iss: `https://securetoken.google.com/${PROJECT}`,
        aud: PROJECT,
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    ).toString('base64url');
    await expect(verifier.verify(`${header}.${body}.`)).rejects.toThrow(TokenVerificationError);
  });

  it.each([['', 'empty'], ['not-a-jwt', 'garbage'], ['a.b.c', 'three junk segments']])(
    'rejects %s (%s) without throwing anything but TokenVerificationError',
    async (token) => {
      await expect(verifier.verify(token)).rejects.toThrow(TokenVerificationError);
    },
  );
});

describe('bearerFrom', () => {
  it('extracts a token', () => {
    expect(bearerFrom('Bearer abc.def.ghi')).toBe('abc.def.ghi');
    expect(bearerFrom('bearer abc.def.ghi')).toBe('abc.def.ghi');
  });

  it('returns null rather than throwing for anything else', () => {
    expect(bearerFrom(undefined)).toBeNull();
    expect(bearerFrom(null)).toBeNull();
    expect(bearerFrom('')).toBeNull();
    expect(bearerFrom('Basic abc')).toBeNull();
    expect(bearerFrom('Bearer')).toBeNull();
    // Two tokens is malformed, not "use the first one".
    expect(bearerFrom('Bearer a b')).toBeNull();
  });
});
