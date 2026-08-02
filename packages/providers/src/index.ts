/**
 * @vastra/providers — every third-party dependency, behind an interface.
 *
 * PROJECT.md §3: "Every one of these sits behind an interface in
 * packages/providers. No provider SDK is imported directly by a service."
 *
 * Two consequences that matter:
 *   - a provider can be swapped without touching a service;
 *   - every pipeline is testable with no credentials, which is why Phase 3 can
 *     be built and verified before a single account exists.
 */

export * from './ingest';
export * from './moderation';
export * from './resilience';
export * from './storage';
export * from './tagging';
export * from './tryon';
