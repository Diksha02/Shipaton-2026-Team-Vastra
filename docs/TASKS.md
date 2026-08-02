# TASKS

Dependency-ordered, not date-ordered (PROJECT.md §1). Work top-down. A phase
gate must pass before the next phase starts — gates exist because the work
after them is wasted if the gate fails.

Branch per ticket: `t12-tryon-cache`. Definition of done: PROJECT.md §8.

Status: ` ` todo · `~` in progress · `x` done · `!` blocked

---

## Phase 0 — Unblock (parallel, nothing downstream can finish without these)

These are calendar-bound and mostly not code. They run alongside Phase 1.

- [ ] **T00** Try-on quality spike — **Google Vertex AI `virtual-try-on-001`**,
      10 real garment+avatar pairs, judge output honestly. **OPEN-4.** If
      quality doesn't clear the bar, F7 changes shape and §6 pricing changes
      with it. Do this first; everything about the product's appeal rests on it.
      (Provider changed from FASHN 2026-08-01; PROJECT.md §3 still says FASHN.)
- [ ] **T01** Store accounts. Apple Developer ($99/yr) + Google Play ($25).
      Play personal accounts created after 2023-11-13 need 12 testers for 14
      consecutive days before production access; **organisation accounts are
      exempt**. Decide account type deliberately — it is the difference between
      shipping in week 2 and week 6.
- [ ] **T02** Name, bundle id, handle availability. **OPEN-1.** Blocks store
      listings, RevenueCat project setup, and the domain.
- [ ] **T03** RevenueCat project + products created in both store consoles.
      Blocks T20.
- [ ] **T04** Provider accounts and keys: Clerk, R2, Neon, Upstash, OneSignal,
      PostHog, Sentry, OpenAI, Sightengine, Ximilar, Google Cloud (Vertex AI).
- [ ] **T05** Seed catalogue brand selection. **OPEN-2.** Blocks F9/T24.

**Gate 0:** T00 answered yes/no, T01 account type chosen, T02 name locked.

---

## Phase 1 — Foundation

- [x] **T06** Monorepo scaffold: pnpm workspaces, Turborepo, strict TS base,
      Prettier, `.gitignore`, `.env.example`.
- [x] **T07** Local environment: docker-compose Postgres 16 + Redis, loopback-bound.
- [ ] **T08** `packages/shared` — zod schemas, inferred types, error-code enum,
      feature flags (`tryon`, `urlIngest`, `catalogue`).
- [ ] **T09** `packages/db` — Drizzle schema for all tables in §4, uuid v7,
      soft-delete, the partial unique index on `items`, first migration.
- [ ] **T10** Design tokens — colour, type scale, spacing, radii, motion.
      Single source consumed by every surface. §6 Design Award depends on this
      being decided once, not per-screen.

**Gate 1:** `pnpm check` passes clean. Migration applies to a fresh database.

---

## Phase 2 — Spine

- [ ] **T11** `apps/api` NestJS bootstrap: config module with zod-validated env,
      `{ data }` / `{ error }` envelope, health endpoint, Sentry, PostHog.
- [ ] **T12** Clerk phone-OTP auth guard; `users` row created on first auth;
      `phone_hash` never stores a raw number.
- [ ] **T13** `apps/worker` NestJS standalone + BullMQ wiring, one no-op job
      proving the queue round-trips.
- [ ] **T14** `packages/providers` interfaces + fakes for all four provider
      kinds. Fakes first so Phase 3 is testable without live keys.

**Gate 2:** API boots, authenticates a real phone number, enqueues and drains a job.

---

## Phase 3 — Pipelines (the risky part — PROJECT.md §5)

- [ ] **T15** Signed R2 PUT URLs + `POST /assets/confirm`. Client uploads direct
      to R2, never through the API.
- [ ] **T16** Magic-byte verification and sharp re-encode (strips EXIF/GPS).
      Reject on extension alone is not acceptable.
- [ ] **T17** Moderation pass 1 (OpenAI) → pass 2 (Sightengine) with the
      **fashion-calibrated thresholds in §5.1**. Fail only `sexual_activity` /
      `sexual_display`; `erotica` to review; pass `very_suggestive` and below.
      A blunt NSFW classifier destroys the core use case — test with swimwear.
- [ ] **T18** Ximilar tagging → `items` row + `taxonomy_map`.
- [ ] **T19** URL ingestion: JSON-LD → OG → fail gracefully. robots.txt, 24h
      cache, SSRF private-IP block, 2 MB cap, fixture-based tests. Never hits
      live retailer sites in CI.

**Gate 3:** Photo in → moderated, tagged garment out, on a real device.

---

## Phase 4 — Product

- [ ] **T20** Wardrobe grid + item detail, filter by category and colour. All
      four UI states (§7).
- [ ] **T21** Outfit builder, 2–6 items, optimistic reorder.
- [ ] **T22** Try-on + the cache in §5.2. Cache key must include
      `MODEL_VERSION`. Store `cost_minor` on every generation.
- [ ] **T23** Slots: 5 free, finalised outfits edit-locked. **Deletion is always
      allowed** — edit-lock is the scarcity mechanic, never deletion-lock (§4,
      UK GDPR Art. 17). Do not "improve" this.
- [ ] **T24** Discover: seeded catalogue ~300 SKUs, 4 brands.
- [ ] **T25** Buy sheet, ≤2 taps from item view to retailer.

**Gate 4:** A new user can go from install to a saved, tried-on outfit without help.

---

## Phase 5 — Revenue and retention

- [ ] **T26** RevenueCat SDK, offerings, products per §6.
- [ ] **T27** Paywall. Contextual at slot 5 filling, never on launch. Loss
      framing — show the outfit at risk. Free trial. One tap to buy, one to
      dismiss. No dark patterns. Every view/dismiss/purchase a PostHog event.
- [ ] **T28** Webhook: signature verified, `rc_event_id` unique → idempotent
      replays. Consumable → grant slots. Client never grants locally.
- [ ] **T29** Nightly reconciliation against RC subscriber state. A dropped
      webhook must never cost a user something they paid for.
- [ ] **T30** OneSignal: push on try-on ready + one re-engagement journey.
      One deployed campaign qualifies for the OneSignal category.
- [ ] **T31** Locked UI tiles (§2.2) with `interest_<feature>` tags.
      **Never a Buy or Unlock CTA on a locked tile.**

**Gate 5:** Sandbox purchase grants slots; killing the webhook still reconciles.

---

## Phase 6 — Ship

- [ ] **T32** Account + data deletion in-app (F13). Store requirement, not optional.
- [ ] **T33** Privacy policy, data-safety form, App Privacy labels, AI-content
      disclosure.
- [ ] **T34** Store listings, screenshots (1179×2556, no device frame), icon
      (1024×1024).
- [ ] **T35** Demo video ≤2 min. **Judges may never install the app** (§1) —
      the video carries the submission.
- [ ] **T36** Judge access: free trial **and** promo codes.
- [ ] **T37** Release. Must land inside 2026-07-31 → 2026-09-30.
- [ ] **T38** Devpost submission. Closes 2026-09-30, 11:45pm PDT.

**Gate 6:** Released, and a stranger can install and reach the paywall.

---

## Post-release (Grand Prize is growth, §1)

- [ ] **T39** Retention instrumentation reviewed against real cohorts.
- [ ] **T40** RevenueCat Experiments price test with enough traffic to read.
- [ ] **T41** #BuildInPublic cadence maintained through the window.

---

## Parked — the figure (product direction, not yet scheduled)

Studio should show a **neutral, anonymous figure** wearing the selected outfit —
not the user's likeness. Seeing *yourself* in an outfit is what Try-On is for.

Why this matters beyond aesthetics: the figure is free, local and unlimited,
while a FASHN render costs ~$0.075 (docs/CREDENTIALS.md). Putting all browsing
on the figure caps COGS and makes try-on a deliberate, valuable act rather than
a tap people spam. That serves §6 directly.

The figure's proportions should come from the user's own dimensions, so the
outfit hangs on something shaped like them.

**Open questions before this can be scheduled:**

- **FA-1** Where do body dimensions actually come from? FASHN is image-to-image
  **Answered:** MediaPipe Pose Landmarker (Google AI Edge), on-device, free,
  33 landmarks + 3D world coordinates via GHUM. Yields proportions, not
  absolute sizes — ask for height as the scale reference, derive the rest, let
  the user confirm and adjust. Body data never leaves the phone.
- **FA-2** ~~2D or 3D?~~ **Decided 2026-08-01: 2D.** A parametric silhouette
  scaled to the user's proportions. 3D stays open for later.
  Original note: A rigged human with cloth
  draping needs React Three Fiber or Skia plus 3D garment assets we cannot
  derive from photographs, and §3 names no 3D library. A 2D silhouette that
  scales to the user's proportions gets most of the effect for a fraction of
  the cost, and leaves 3D open later.
- **FA-3** Garment cutouts. A figure "wearing" clothes needs transparent
  cutouts, not photographs with backgrounds. Where do those come from —
  background removal in the upload pipeline (§5.1), or supplied by brands?
- **FA-4** First-run. If proportions unlock via try-on, a new user sees the
  default figure. Studio must look finished with the default on day one; it
  cannot read as an empty state waiting for data the user has not generated.
- **FA-5** Derived measurements are personal data even without a likeness.
  They belong under the existing `avatar_consent_at` consent, must be
  separately deletable (F13), and must not be inferred silently.
