/**
 * Referral codes.
 *
 * These get read off a screen and typed by hand, or dictated aloud. The alphabet
 * therefore excludes every pair people confuse: `0/O`, `1/I/L`, `2/Z`, `5/S`,
 * `8/B`. What survives is unambiguous in most typefaces and over a phone call.
 *
 * Vowels are also gone, which removes the accidental-profanity problem entirely
 * rather than maintaining a blocklist — a blocklist is a losing game across
 * every language a user might speak.
 */
export const REFERRAL_ALPHABET = 'CDFGHJKMNPQRTVWXY34679';
export const REFERRAL_CODE_LENGTH = 7;

/**
 * ~22^7 ≈ 2.5e9 codes. Collisions are handled by a unique index and a retry, not
 * by hoping — at a million users the birthday bound makes a collision likely,
 * and a silently reused code would credit the wrong person's referral.
 */
export function generateReferralCode(random: () => number = Math.random): string {
  let code = '';
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i += 1) {
    code += REFERRAL_ALPHABET[Math.floor(random() * REFERRAL_ALPHABET.length)];
  }
  return code;
}

/**
 * Normalises what a user typed: case folded, separators stripped.
 *
 * Deliberately does **not** map confusable characters onto the alphabet. The
 * tempting version folds `O→Q` and `1→7` so a misread still resolves — but every
 * such mapping is a guess, and a wrong guess lands on a *different valid code*
 * and credits a stranger's referral. Since the alphabet already excludes the
 * confusable characters, anything outside it means the code was misread, and
 * saying so beats silently rewarding the wrong person.
 */
export function normaliseReferralCode(input: string): string {
  return input.toUpperCase().replace(/[\s\-_]/g, '');
}

/** True when a string could be a code at all. Cheap client-side check so an
 *  obviously wrong entry does not cost a network round-trip. */
export function looksLikeReferralCode(input: string): boolean {
  const normalised = normaliseReferralCode(input);
  if (normalised.length !== REFERRAL_CODE_LENGTH) return false;
  return [...normalised].every((char) => REFERRAL_ALPHABET.includes(char));
}
