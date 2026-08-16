/** DI token for the Firebase verifier.
 *
 *  Lives in its own file so the guard and the module can each import it without
 *  importing each other — a cycle Nest resolves at runtime but which breaks
 *  `import type` elision and makes the failure mode obscure. */
export const FIREBASE_VERIFIER = Symbol('FIREBASE_VERIFIER');
