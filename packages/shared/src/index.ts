/**
 * @vastra/shared — the single source of truth for types shared by the app and
 * the API (PROJECT.md §7).
 *
 * Rule: types are *inferred* from zod schemas here. Nothing downstream declares
 * a duplicate interface for a wire shape. If the app and the API disagree about
 * a field, that is a bug in this package, not something to patch on one side.
 */

export * from './preference-onboarding';
export * from './api';
export * from './catalogue-query';
export * from './enums';
export * from './errors';
export * from './flags';
export * from './ids';
export * from './referral-code';
export * from './slots';

export * from './schemas/asset';
export * from './schemas/billing';
export * from './schemas/item';
export * from './schemas/outfit';
export * from './schemas/user';
