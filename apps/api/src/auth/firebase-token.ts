import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from 'jose';

/**
 * Firebase ID token verification.
 *
 * Deliberately *not* firebase-admin. Verifying an ID token needs only the
 * project id: the signature is checked against Google's published public keys,
 * and `iss`/`aud` must name the project. firebase-admin would require a
 * service-account private key, which would give this process the power to mint
 * a token for any user — an enormous capability to hold in order to perform a
 * read-only check.
 *
 * So the API authenticates every request while holding nothing worth stealing.
 */

/** Google's public keys for Firebase ID tokens (RS256, `securetoken`). */
const JWKS_URL = new URL(
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
);

/** Claims we rely on, beyond the registered ones `jose` already validates. */
export interface FirebaseIdToken extends JWTPayload {
  /** Firebase uid. Always equal to `sub` for ID tokens. */
  user_id?: string;
  email?: string;
  email_verified?: boolean;
  phone_number?: string;
  auth_time?: number;
  firebase?: {
    sign_in_provider?: string;
    identities?: Record<string, unknown>;
  };
}

export interface VerifiedUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  signInProvider: string | null;
  /** When the user last actually proved who they are, as opposed to when this
   *  token was minted. Refresh tokens keep `iat` fresh for a year; `auth_time`
   *  is what a step-up check must read. */
  authTime: Date | null;
}

export class TokenVerificationError extends Error {
  constructor(
    message: string,
    readonly reason:
      | 'malformed'
      | 'expired'
      | 'wrong_audience'
      | 'wrong_issuer'
      | 'no_subject'
      | 'future_auth_time'
      | 'unavailable',
  ) {
    super(message);
    this.name = 'TokenVerificationError';
  }
}

export interface FirebaseTokenVerifierOptions {
  projectId: string;
  /** Injectable so tests can supply a local key set instead of reaching Google. */
  jwks?: JWTVerifyGetKey;
  /** Seconds of leeway for clock skew between us and Google. */
  toleranceSeconds?: number;
}

/**
 * Verifies Firebase ID tokens for one project.
 *
 * The JWKS is fetched lazily and cached by `jose`, which also handles key
 * rotation — Google rotates these roughly daily, so a hardcoded key would fail
 * silently within a day.
 */
export class FirebaseTokenVerifier {
  private readonly jwks: JWTVerifyGetKey;
  private readonly tolerance: number;

  constructor(private readonly options: FirebaseTokenVerifierOptions) {
    if (!options.projectId) {
      throw new Error('FirebaseTokenVerifier requires a projectId.');
    }
    this.jwks =
      options.jwks ??
      createRemoteJWKSet(JWKS_URL, {
        // A cold start must not hang a request forever waiting on Google.
        timeoutDuration: 5_000,
        cooldownDuration: 30_000,
        cacheMaxAge: 600_000,
      });
    this.tolerance = options.toleranceSeconds ?? 60;
  }

  async verify(token: string): Promise<VerifiedUser> {
    if (typeof token !== 'string' || token.length === 0) {
      throw new TokenVerificationError('No token supplied.', 'malformed');
    }

    let payload: FirebaseIdToken;
    try {
      const result = await jwtVerify<FirebaseIdToken>(token, this.jwks, {
        // Both are checked by `jose` itself rather than by us afterwards — a
        // token for a *different* Firebase project is signed by the same Google
        // keys and would otherwise verify perfectly.
        issuer: `https://securetoken.google.com/${this.options.projectId}`,
        audience: this.options.projectId,
        algorithms: ['RS256'],
        clockTolerance: this.tolerance,
      });
      payload = result.payload;
    } catch (error) {
      throw new TokenVerificationError(
        'Token failed verification.',
        classifyJoseError(error, this.options.projectId),
      );
    }

    const uid = payload.sub ?? payload.user_id;
    if (!uid) {
      throw new TokenVerificationError('Token carries no subject.', 'no_subject');
    }

    // Firebase's own rule: a token whose auth_time is in the future is invalid.
    const authTimeSeconds = typeof payload.auth_time === 'number' ? payload.auth_time : null;
    if (authTimeSeconds !== null && authTimeSeconds > Date.now() / 1000 + this.tolerance) {
      throw new TokenVerificationError('auth_time is in the future.', 'future_auth_time');
    }

    return {
      uid,
      email: typeof payload.email === 'string' ? payload.email : null,
      emailVerified: payload.email_verified === true,
      phoneNumber: typeof payload.phone_number === 'string' ? payload.phone_number : null,
      signInProvider: payload.firebase?.sign_in_provider ?? null,
      authTime: authTimeSeconds === null ? null : new Date(authTimeSeconds * 1000),
    };
  }
}

function classifyJoseError(error: unknown, projectId: string): TokenVerificationError['reason'] {
  const code = (error as { code?: string })?.code ?? '';
  const message = error instanceof Error ? error.message : String(error);

  if (code === 'ERR_JWT_EXPIRED') return 'expired';
  if (message.includes('"aud"')) return 'wrong_audience';
  if (message.includes('"iss"')) return 'wrong_issuer';
  if (code === 'ERR_JWKS_TIMEOUT' || code === 'ERR_JWKS_NO_MATCHING_KEY') {
    // Distinguished on purpose: this is *our* problem, not the caller's, and
    // must surface as 503 rather than 401. Telling a user their login is
    // invalid because Google was briefly unreachable is a lie that makes them
    // sign in again pointlessly.
    return code === 'ERR_JWKS_TIMEOUT' ? 'unavailable' : 'malformed';
  }
  if (message.includes(projectId)) return 'wrong_issuer';
  return 'malformed';
}

/** Extracts a bearer token, or null. Never throws — an absent header is an
 *  anonymous request, not an error, and some routes allow those. */
export function bearerFrom(header: string | undefined | null): string | null {
  if (typeof header !== 'string') return null;
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match?.[1] ?? null;
}
