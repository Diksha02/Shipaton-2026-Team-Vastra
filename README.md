# Vastra — वस्त्र

**Your wardrobe, by you.**

You own more clothes than you wear. Not because the rest are wrong, but because
at 7:40am you cannot see them — they are folded, behind other things, or in a
drawer you did not open. Vastra puts everything you own where you can actually
look at it, lets you put outfits together before you are standing half-dressed
in front of a mirror, and shows you what to buy only when it fits what you
already have.

Built for **RevenueCat Shipaton 2026**.

---

## What it does

**A wardrobe you can see.** Photograph a piece or paste a link from a shop. It
gets tagged, cut out, and filed. No spreadsheets, no folders.

**A studio, not a grid.** Pick a category, swipe through what you own, and the
figure wears it. Outfits get built the way you actually think about them —
visually, by trying combinations — instead of by reading a list of nouns.

**Looks.** A full-bleed vertical feed of what other people are wearing.
Double-tap to like, and tap through any post to find similar pieces you can
actually buy.

**Shopping that knows your wardrobe.** Search across your own clothes and the
shops at once, because *"where are my black jeans"* and *"I want black jeans"*
are the same question typed the same way. Filter by department, price, and your
own sizes.

**Try-on.** Your outfit, on you, generated rather than imagined. (In progress —
see [Where it actually is](#where-it-actually-is).)

---

## Why the free tier works this way

Most apps make you pay to *remove* things. Vastra never does.

You get **one permanent outfit space** and **four single-use saves**. The
permanent space is yours forever: save, delete, save again, as often as you
like. A single-use save is spent when you save, and deleting that outfit does
not return it.

**Deleting is always free, immediate, and unconditional.** That is not a
courtesy — it is UK GDPR Article 17, and the whole design exists to respect it.
An earlier version of this mechanic charged to delete; it was rejected, and the
reasoning is in [docs/DECISIONS.md](docs/DECISIONS.md).

The cost is disclosed **before** you spend it. The save sheet names the price
and the button itself reads *"Use a single-use save"*. A consumable you discover
after the fact is a dark pattern; the same consumable priced up front is just a
price.

Referrals earn permanent spaces, because that is the reward anyone actually
wants.

---

## Architecture

A pnpm + Turborepo monorepo. The interesting decision is what lives in
`packages/shared`.

```
apps/
  mobile/        Expo SDK 57 · React Native 0.86 · Expo Router · Reanimated 4
  api/           NestJS · Drizzle · Postgres · Redis
packages/
  shared/        Domain rules + zod schemas — imported by BOTH app and API
  db/            Drizzle schema and migrations
  design/        Colour, type, motion and spacing tokens
  providers/     Moderation, tagging, try-on, ingest — behind interfaces
```

**Business rules live in `packages/shared` and are imported by the client and
the server.** The client runs them to *predict* — so it can tell you what a save
will cost before you commit — and the server runs the same code to *enforce*.
One implementation means the two can never disagree about what you were charged.

That covers outfit spaces, department filtering, search ranking, price bands,
size matching, and referral codes. All of it is pure, and all of it is
unit-tested: **129 tests** across the workspace.

### A few decisions worth knowing

**The API holds no authentication secret.** Firebase ID tokens are verified
against Google's public JWKS, so the server needs only a project id. Using
`firebase-admin` would have required a service-account key — the power to mint a
token for *any user* — in order to perform a read-only check.

**Every route is closed by default.** The auth guard is registered globally, so
a new endpoint is protected unless it explicitly says `@Public()`. Forgetting the
decorator produces a locked endpoint, which is a bug report. The reverse produces
an open one, which is a breach.

**Unconfigured never means unprotected.** With no project id set, authenticated
routes answer 503 rather than waving tokens through. That is the failure that
otherwise looks exactly like success in production.

**The moderation gate is in the read path**, not in the screens. No component
can accidentally render an unmoderated or blocked post, because the only way to
read posts already filters them.

---

## Running it

```bash
pnpm install
```

### The app

```bash
cd apps/mobile
npx expo start --lan
```

Open in Expo Go. Sign-in and purchases need a development build — both are
native modules and are lazily loaded, so the app runs fine without them and says
so rather than failing.

```bash
npx eas build --profile development --platform android
```

### Web preview

Useful for looking at layouts on a phone browser without a dev build.

```bash
pnpm --filter @vastra/mobile exec expo export --platform web
node apps/mobile/scripts/serve-web.mjs
```

It prints a LAN address. Zero dependencies — deliberately, so it cannot fail on
a machine where `npx` cannot reach the network.

### The API

```bash
docker compose up -d          # Postgres on 55432, Redis
pnpm --filter @vastra/db exec drizzle-kit migrate
pnpm --filter @vastra/api dev
```

### Checks

```bash
pnpm -r run typecheck
pnpm -r run test
```

---

## Where it actually is

Honest status, because a README that overstates is worse than one that is short.

**Working and verified**

- Wardrobe, Studio, outfit spaces with the full save/delete/migration path
- Search, department/price/size filters, sort, wishlist, brand pages
- Looks feed with like, report, block-a-user and delete
- Google sign-in, end to end, on a development build
- API: Firebase token verification, global guard, `/v1/me` provisioning
- Account and data deletion
- 129 tests, clean typecheck, clean Android bundle

**Built, not yet verified against live services**

- RevenueCat paywall, placements and Customer Center — the SDK is integrated and
  a diagnostics screen exists to prove dashboard configuration, but a real
  purchase has not been exercised
- Slot grants are not yet wired to RevenueCat Virtual Currency

**Not started**

- Try-on. This is the headline feature and it is unvalidated — and it carries
  the project's largest legal exposure. Read
  [docs/legal/RISK.md](docs/legal/RISK.md) before building it.
- Catalogue ingestion. The catalogue is 20 mock items.
- iOS. The code is cross-platform and the config is correct, but there is no
  Apple Developer account and Sign in with Apple is mandatory before an iOS
  release once any third-party login is offered.

---

## Documentation

Everything is written down, including the things that went wrong.

| | |
|---|---|
| [PROJECT.md](PROJECT.md) | The specification. Authoritative — conflicts stop work. |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Append-only log of every decision **and every mistake**, with reasoning |
| [docs/legal/RISK.md](docs/legal/RISK.md) | Legal exposure map, and a promise-to-implementation table |
| [docs/legal/PRIVACY.md](docs/legal/PRIVACY.md) | Privacy policy — draft, needs a solicitor |
| [docs/legal/TERMS.md](docs/legal/TERMS.md) | Terms and EULA — draft, needs a solicitor |
| [docs/TASKS.md](docs/TASKS.md) | Work queue with gates |
| [docs/CREDENTIALS.md](docs/CREDENTIALS.md) | Every service, what it unblocks, and claim order |
| [docs/HOSTING.md](docs/HOSTING.md) | A genuinely free stack, and the traps in it |

`DECISIONS.md` records failures deliberately. Three examples: an accent colour
that shipped as harsh yellow, an aurora background that banded into grey mud,
and a `webClientId` option that was invented and would have broken sign-in
silently. Knowing why something is the way it is includes knowing what it was
before.

---

## Licence

Not yet licensed. All rights reserved pending release.
