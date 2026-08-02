# PROJECT.md — Vastra

> Load this file at the start of every Claude Code session.
> If a request in this repo conflicts with this file, stop and ask.

---

## 1. What we are building

### Name — LOCKED

**Vastra** — from वस्त्र, Sanskrit for cloth or garment.

Tagline: *by you*. Never part of the store name field — the searchable
asset is the single word. Bundle id: `app.vastra` (pending OPEN-1).

Etymology, for the Devpost description and store copy: वस्त्र descends
from the Proto-Indo-European root \*wes-, "to clothe" — the same root
that gives Latin *vestis*, Spanish *vestir*, and English *wear* and
*vest*. The word is simultaneously ancient and legible to a Western
audience without explanation. Use this story in the listing; do not put
any of it in the name.

Rejected, and not to be revisited: Vastra by You, Stella Vastra, Vastra
Vestir, KoshDrobe. All split the search term, add syllables, or repeat
the same root twice. Naming is closed. If OPEN-1 comes back blocked, the
fallbacks are **Attira** and **Everworn**, in that order.

### The product

A personal AI wardrobe with a shopping layer.

A user photographs the clothes they own (or pastes a product URL), the app
auto-tags each garment, they compose outfits from those garments plus a
curated brand catalogue, they see themselves wearing the outfit via AI
try-on, and they save the outfit to a "slot". Five slots free, more via
in-app purchase. Any catalogue item is one tap from the retailer's page.

**One-line pitch:** "Vastra is your whole wardrobe in your pocket —
photograph what you own, build outfits from it, see yourself wearing them
before you get dressed, then buy whatever's missing in two taps."

**App Store subtitle (30 char limit):** `Your wardrobe, by you.`

### The one hard external constraint

Shipping into RevenueCat Shipaton 2026.

Store release must fall inside **2026-07-31 → 2026-09-30**. Building
before that window is explicitly permitted; publishing before it
disqualifies us. Devpost submissions close 2026-09-30, 11:45pm PDT.

There is no internal schedule. Work is dependency-ordered, not
date-ordered — see `docs/TASKS.md`. Ship the store release as early in
the window as the phase gates allow, because everything after release
counts as growth and everything before it counts as nothing.

### Prize categories we are targeting

Build decisions should serve these, in order:

1. **HAMM Award** (best use of RevenueCat to drive revenue) — paywall
   craft, pricing/packaging, conversion. Our primary target.
2. **Keep Them Coming Back (OneSignal)** — highest prize-to-effort ratio
   in the event. One deployed campaign qualifies. OneSignal is therefore
   a required integration, not optional.
3. **RevenueCat Design Award** — animation and polish are in scope, not
   nice-to-have.
4. **#BuildInPublic** — not a code concern, but do not break the app on
   main; we screenshot progress daily.

**Judges may never install the app.** They are only required to watch two
minutes of video, read the description, and view screenshots. Everything
we build must look good in a screen recording.

---

## 2. Scope

### 2.1 In V1 (must work end to end)

| # | Feature | Notes |
|---|---|---|
| F1 | Phone-OTP auth | One account per phone number. Our anti-multi-account measure. |
| F2 | Avatar photo + AI consent | Required before try-on. Separately deletable. |
| F3 | Add garment via camera / gallery | → moderation → auto-tag → wardrobe |
| F4 | Add garment via pasted product URL | schema.org JSON-LD parse |
| F5 | Wardrobe grid + item detail | Filter by category and colour |
| F6 | Outfit builder | Compose 2–6 items into an outfit |
| F7 | AI try-on | Generate once, cache forever, free on replay |
| F8 | Slots | 5 free; finalised outfits are edit-locked |
| F9 | Discover | Seeded catalogue, ~300 SKUs, 4 brands |
| F10 | Buy sheet | ≤2 taps from item view to retailer page |
| F11 | RevenueCat IAP | Slot packs (consumable) + subscription |
| F12 | OneSignal | Push on try-on ready + one re-engagement journey |
| F13 | Account + data deletion | In-app. Store requirement and GDPR. |

### 2.2 In V1 as LOCKED UI (visible, not functional)

These render as real tiles/sections with a "Coming soon" badge, a blurred
or illustrative preview, and a **Notify me** button that sets a OneSignal
tag (`interest_<feature>`). They are **never** purchasable and never
gated behind a paywall.

- Influencer OOTD video feed
- Brand account connections (logo wall, all "Pending")
- Likes / comments / shares
- AI style recommendations
- Full multi-brand catalogue search

**Rule:** a locked tile must never present a Buy or Unlock CTA. Selling
access to unbuilt functionality is a store-rejection and refund risk.

### 2.3 Explicitly OUT of V1

Video upload, video moderation, comments, real affiliate feed ingestion
(Awin/CJ), social graph, web app, Android tablet layouts.

Do not build these. Do not add abstractions "ready for" these beyond what
Section 5 already specifies.

---

## 3. Stack

Do not substitute without asking.

| Layer | Choice |
|---|---|
| App | Expo (React Native), TypeScript, Expo Router |
| State | TanStack Query + Zustand for local UI state |
| Animation | Reanimated 3 + Moti |
| API | NestJS, TypeScript, modular monolith |
| DB | Postgres 16 (Neon), Drizzle ORM |
| Cache / queue | Redis + BullMQ |
| Object storage | Cloudflare R2, S3-compatible SDK |
| Auth | Clerk (phone OTP) |
| Payments | RevenueCat SDK + webhooks |
| Push | OneSignal |
| Analytics | PostHog (app + API) |
| Errors | Sentry (app + API) |
| Hosting | Fly.io (API + worker), Neon (DB), Upstash (Redis) |
| CI | GitHub Actions + EAS Build |
| Monorepo | pnpm workspaces + Turborepo |

### External AI/data services

| Purpose | Provider | Fallback |
|---|---|---|
| Moderation pass 1 | OpenAI omni-moderation (free) | — |
| Moderation pass 2 | Sightengine (`nudity-2.1`, `offensive`, `gore`) | manual queue |
| Garment tagging | Ximilar `/v2/detect_tags` | manual tag entry |
| Try-on | FASHN.ai | disable feature via flag |

Every one of these sits behind an interface in `packages/providers`.
No provider SDK is imported directly by a service.

### Repo layout

```
/apps
  /mobile          Expo app
  /api             NestJS HTTP API
  /worker          NestJS standalone, BullMQ consumers
/packages
  /shared          zod schemas + inferred TS types, shared by app and API
  /db              Drizzle schema + migrations
  /providers       moderation / tagging / tryon / ingest adapters
/docs
  PROJECT.md       this file
  TASKS.md         ordered work queue
  DECISIONS.md     append-only log, one line per decision
```

---

## 4. Data model

Drizzle, Postgres. All ids are `uuid v7` (time-sortable). All tables have
`created_at`, `updated_at`. Soft-delete via `deleted_at` on user-owned
rows; hard delete only on account deletion.

```
users
  id, clerk_id, phone_hash, handle, avatar_asset_id?, avatar_consent_at?,
  free_slots_total (default 5), deleted_at

assets                      -- every image we store
  id, user_id?, r2_key, mime, width, height, bytes, sha256,
  kind (avatar|garment|tryon|catalogue), moderation_status, deleted_at

moderation_results
  id, asset_id, provider, verdict (pass|fail|review), scores jsonb,
  raw jsonb, decided_at

items                       -- a garment: user-owned OR catalogue
  id, source (user_photo|user_url|catalogue), owner_user_id?,
  brand?, external_id?, title, price_minor?, currency?,
  product_url?, affiliate_url?, primary_asset_id,
  category, subcategory?, colour_primary?, attributes jsonb,
  raw jsonb, fetched_at?, tagging_status, deleted_at
  UNIQUE (source, brand, external_id) WHERE external_id IS NOT NULL

outfits
  id, user_id, name?, status (draft|finalised), slot_id?,
  cover_asset_id?, finalised_at, deleted_at

outfit_items
  outfit_id, item_id, position, PRIMARY KEY (outfit_id, item_id)

slots
  id, user_id, index, outfit_id?, filled_at
  UNIQUE (user_id, index)

tryon_renders               -- the cache
  id, cache_key UNIQUE, user_id, outfit_id, avatar_asset_id,
  result_asset_id, model_version, status, cost_minor, created_at

entitlements
  id, user_id, product_id, kind (consumable|subscription),
  slots_granted?, expires_at?, rc_event_id UNIQUE, granted_at

taxonomy_map
  source, source_value, our_category, our_subcategory?, reviewed
```

### Key invariants

- `items.raw` keeps the untouched provider payload forever, so we can
  re-normalise without re-fetching.
- An `outfit` with `status = finalised` is **immutable**: no adding,
  removing or reordering items. It remains deletable.
- A `slot` is freed when its outfit is deleted. Deleting an outfit is
  always allowed (UK GDPR Art. 17). The scarcity mechanic is
  edit-locking, never deletion-locking. **This is a legal requirement,
  not a product preference — do not "improve" it.**
- No asset is ever served to a client with `moderation_status != 'pass'`.

---

## 5. The four subsystems that need care

### 5.1 Upload pipeline

```
client asks for signed PUT URL
  → uploads directly to R2 (never through our API)
  → POST /assets/confirm
  → job: verify magic bytes, reject if mime mismatch
  → job: re-encode with sharp (strips EXIF/GPS and any embedded payload)
  → job: moderation pass 1 (OpenAI) → pass 2 (Sightengine) if borderline
  → job: Ximilar tagging → create item
  → push via OneSignal when ready
```

Limits: 12 MB, jpeg/png/heic/webp only, 4096px max edge after re-encode.
Reject on extension alone is not acceptable — check magic bytes.

**Moderation thresholds.** This is a fashion app. Swimwear, underwear and
activewear are legitimate content. Use Sightengine's granular nudity
classes: fail only on `sexual_activity` / `sexual_display`; send
`erotica` to the review queue; pass `very_suggestive` and below. A blunt
NSFW classifier will destroy the core use case.

### 5.2 Try-on cache

`cache_key = sha256(avatar_asset_id + ':' + sorted(item_ids).join(',') + ':' + MODEL_VERSION)`

Lookup before any provider call. On hit, serve the stored R2 object —
zero cost, instant. Only an avatar change, an outfit composition change,
or a `MODEL_VERSION` bump triggers regeneration. This is what makes
"free try-on, any time" economically honest: our cost scales with unique
outfits created, not with taps.

Store `cost_minor` on every generation so we can report real COGS.

### 5.3 URL ingestion

Only fetch URLs a user explicitly pasted. One page per request. Never
crawl, never enumerate, never follow links.

Parse order: `application/ld+json` with `@type: Product` → Open Graph →
fail with a clear "couldn't read that page, add it manually" path.

Requirements: honour robots.txt, 24h cache keyed on normalised URL,
5s timeout, 2 retries, descriptive User-Agent with a contact URL,
10s hard cap, max 2 MB response, block private IP ranges (SSRF).

Write tests against saved HTML fixtures in `packages/providers/__fixtures__/`
— never hit live retailer sites in CI.

### 5.4 Entitlements

RevenueCat is the source of truth for purchases; our DB is the source of
truth for slots granted.

- Webhook endpoint verifies the RevenueCat signature.
- `rc_event_id` is UNIQUE → replays are idempotent.
- Consumable purchase → insert entitlement → increment available slots.
- A nightly reconciliation job pulls the RC subscriber state for any user
  with a mismatch and repairs it. A dropped webhook must never cost a
  user something they paid for.
- Client never grants entitlements locally. It reads them from our API.

---

## 6. Monetisation (HAMM category — build this deliberately)

| Product | Type | Contents |
|---|---|---|
| `slots_3` | consumable | +3 slots |
| `slots_10` | consumable | +10 slots |
| `wardrobe_plus_monthly` | subscription | unlimited slots, priority try-on queue, HD export |
| `wardrobe_plus_annual` | subscription | same, discounted |

Entitlement identifier: `plus`.

Paywall rules:
- Triggered contextually at the moment slot 5 fills, never on launch.
- Show the outfit they are about to lose access to saving. Loss framing.
- Subscription offered with a free trial (Shipaton requires either a free
  trial or a judge promo code — we do both).
- One tap to purchase, one tap to dismiss. No dark patterns, no fake
  countdowns. Judges are looking for craft, and dark patterns get flagged.
- Every paywall view/dismiss/purchase is a PostHog event.

---

## 7. Conventions

- TypeScript strict. No `any`. No non-null `!` assertions.
- Validation with zod at every boundary; types are inferred from schemas
  in `packages/shared`, never hand-written twice.
- API returns `{ data }` or `{ error: { code, message } }`. Error codes
  are a shared enum.
- Every external call: timeout, 2 retries with jittered backoff, circuit
  breaker. A provider outage degrades one feature, never the app.
- Feature flags in `packages/shared/flags.ts`. `tryon`, `urlIngest`, and
  `catalogue` must each be independently killable at runtime.
- Every screen implements four states: loading (skeleton, not spinner),
  empty (illustrated, with the action that fills it), error (retry), data.
- Optimistic UI on wardrobe add and outfit edit.
- Tests: unit for providers and entitlement logic (Vitest), integration
  for the upload pipeline. No E2E — no time, and it won't pay for itself.
- Conventional commits. Branch per ticket: `t12-tryon-cache`.
- Never commit secrets. `.env.example` stays current.

## 8. Definition of done (every ticket)

1. Types build clean, lint passes
2. Tests for the logic that could silently break
3. All four UI states handled, if it touches the app
4. Works on a real Android device, not just simulator
5. `docs/DECISIONS.md` updated if a choice was made
6. Nothing on the cut list in Section 2.3 was added

---

## 9. Open questions — ask, do not assume

- **OPEN-1** Vastra availability check — `vastra.app`, App Store and Play
  search, @vastraapp on socials, UKIPO/EUIPO classes 9 and 42. Name is
  locked pending this only; if blocked, fall back to Attira, then
  Everworn (see §1).
- **OPEN-2** Which 4 brands to seed the catalogue with
- **OPEN-3** Price points per store front
- **OPEN-4** Whether try-on quality clears the bar (spike, see TASKS T00)
