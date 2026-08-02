<div align="center">

# Vastra

**Your whole wardrobe in your pocket.**
*Photograph what you own, build outfits from it, see yourself wearing them before you get dressed — then buy whatever's missing in two taps.*

`वस्त्र` — Sanskrit for *cloth*. From the Proto-Indo-European root \*wes-, "to clothe":
the same root that gives Latin *vestis*, Spanish *vestir*, and English *wear*.

Built for **[RevenueCat Shipaton 2026](https://revenuecat-shipaton-2026.devpost.com/)**

</div>

---

## The problem

You own more clothes than you wear.

Not because you dislike them — because you can't *see* them. They're folded in a
drawer, crushed on a rail, behind a door. So every morning you reach for the same
five things, and every so often you buy something new that turns out to be almost
identical to something you already own.

The clothes aren't the problem. The interface to them is.

## What Vastra does

**Photograph a garment.** It's auto-tagged — category, colour, material — and
lands in your wardrobe. Or paste a product URL and we read the page instead.

**Build an outfit in the Studio.** Your clothes hang on a ghost mannequin: an
anonymous figure that wears what you pick. Swipe through your tops, and the
figure changes as you go. Nobody's face, nobody's body — just the clothes,
together, so you can see whether they actually work.

**See yourself in it.** Try-on renders the outfit on *you*, once. After that it's
cached forever and free to revisit. That split is deliberate — browsing costs
nothing, so try-on stays the moment that matters.

**Save it to a space.** Five free. A finalised outfit is locked from editing so
it stays the thing you decided on — but it is always deletable, because your
data is yours.

**Buy what's missing.** Any catalogue piece is two taps from the retailer.

## Why it should win

| Category | Our angle |
|---|---|
| **HAMM** | The paywall triggers at the exact moment the fifth space fills, and shows you *the outfit you're about to lose* — not a feature list. No countdowns, no pre-ticked upsells, a real close button. Craft, not coercion. |
| **Keep Them Coming Back** | Push is native here, not bolted on: your try-on is ready, your group hasn't played with an outfit in a week. |
| **Design Award** | One design-token source drives every surface. Editorial serif against warm stone. Colour is spent on exactly one thing — Plus — so the purchase moment is the only chromatic surface in the app. |
| **#BuildInPublic** | Every decision that shaped this is in [`docs/DECISIONS.md`](docs/DECISIONS.md), including the ones that were wrong. |

## The engineering worth looking at

**The try-on cache is the business model.** The cache key is
`sha256(avatar + sorted(item_ids) + MODEL_VERSION)`. Item ids are sorted, so the
same garments in a different order hit the same entry. Cost scales with *unique
outfits created*, never with taps — which is what makes "free try-on, any time"
an honest promise rather than a subsidy we quietly withdraw.

**Moderation is calibrated for fashion.** This is a clothes app: swimwear,
underwear and activewear are the product, not an edge case. A blunt NSFW
classifier would destroy the core use case, so the thresholds fail only on
explicit classes and let `very_suggestive` through. The policy is a pure
function with tests pinning it, because it is the single most consequential
decision in the pipeline.

**URL ingestion can't be turned against us.** Users paste a link and we fetch it
server-side, which is a confused deputy waiting to happen. Private IP ranges,
carrier-grade NAT, cloud metadata endpoints and IPv4-mapped IPv6 bypasses are
all blocked before a socket opens. Fixture-based tests; CI never touches a live
retailer.

**Purchases are idempotent by construction.** RevenueCat retries on any non-2xx,
so duplicate deliveries are normal traffic. `rc_event_id` is UNIQUE, and a
nightly reconciliation repairs any drift — a dropped webhook must never cost
someone something they paid for.

**The garment layer is a real optimisation.** Outfit state holds ids, not
objects, and every garment subscribes to its own slice. Changing your shoes
re-renders the shoes and two carousel cards. Not the screen.

## Stack

| Layer | Choice |
|---|---|
| App | Expo (React Native) · TypeScript · Expo Router |
| State | Zustand · TanStack Query |
| Motion | Reanimated · Moti |
| Lists | FlashList |
| API | NestJS — modular monolith |
| Database | Postgres 16 (Neon) · Drizzle ORM |
| Queue | Redis · BullMQ |
| Storage | Cloudflare R2 |
| Auth | Clerk — phone OTP, one account per number |
| Payments | **RevenueCat** SDK + webhooks |
| Push | OneSignal |
| Try-on | Google Vertex AI `virtual-try-on-001` |
| Tagging | Ximilar · **Moderation** OpenAI + Sightengine |
| Observability | PostHog · Sentry |

Every third-party service sits behind an interface in
[`packages/providers`](packages/providers). No service imports a vendor SDK
directly, which is why the entire pipeline is testable with no credentials at
all.

## Running it

```bash
pnpm install
cp .env.example .env        # placeholders only; see docs/CREDENTIALS.md
pnpm env:up                 # Postgres + Redis, bound to 127.0.0.1
pnpm --filter @vastra/db migrate

pnpm --filter @vastra/mobile dev     # Expo
pnpm --filter @vastra/api dev        # API
```

`pnpm check` runs typecheck, lint and tests across the workspace.

**No credentials are needed to run the app.** The mobile app, design system,
navigation and every screen work entirely offline against mock data, and every
provider has a fake. Only live provider calls are blocked — see
[`docs/CREDENTIALS.md`](docs/CREDENTIALS.md).

## Layout

```
apps/
  mobile/      Expo app — Today, Studio, Outfits, You
  api/         NestJS HTTP API
packages/
  shared/      zod schemas; every type is inferred, never hand-written twice
  db/          Drizzle schema + migrations
  design/      design tokens — colour, type, space, motion
  providers/   moderation · tagging · try-on · ingest · storage
docs/
  TASKS.md         dependency-ordered work queue with phase gates
  DECISIONS.md     append-only log, one line per decision
  CREDENTIALS.md   what each service unlocks, and in what order
  ASSETS.md        imagery provenance and licensing
```

## Where it actually stands

Honesty is cheaper than a surprise later.

**Working:** monorepo, database schema and migrations, the full provider layer
with fakes and passing tests, API bootstrap, design system, and the mobile app —
Today, Studio, Outfits, You, item detail and the paywall — running on mock data.

**Not yet built:** live try-on, phone auth, the upload pipeline against real
storage, and RevenueCat purchases. All are specified, interfaced and waiting on
credentials rather than on design.

**Placeholder:** garment imagery is Unsplash-licensed and cut out with U2Net
segmentation. It ships nowhere near the store — see [`docs/ASSETS.md`](docs/ASSETS.md).

## Team

Built by **Team Vastra** for RevenueCat Shipaton 2026.
Store release must land inside 2026-07-31 → 2026-09-30.

---

<div align="center">
<sub>Your wardrobe, by you.</sub>
</div>
