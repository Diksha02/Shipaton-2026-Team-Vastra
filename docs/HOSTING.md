# HOSTING

A genuinely free stack for the Vastra backend, and the traps in it.

## The headline finding

**PROJECT.md §3 specifies Fly.io — that is no longer free.** Fly.io and Railway
both moved to trial/usage-based pricing; neither has an always-free tier any
more. §3 needs amending if cost-free is a hard requirement.

## Recommended free stack

| Layer | Service | Free allowance | The catch |
|---|---|---|---|
| **API + worker** | [Render](https://render.com) | Free web service | **Spins down after 15 min idle, 30–60s cold start.** The big one — see below. |
| **Postgres** | [Neon](https://neon.tech) | 0.5 GiB, 10 projects, autoscaling | Already the §3 choice. Generous and genuinely free. |
| **Redis** | [Upstash](https://upstash.com) | Free tier, per-request pricing | Already the §3 choice. Fine for BullMQ at this scale. |
| **Object storage** | [Cloudflare R2](https://developers.cloudflare.com/r2/) | 10 GB storage, **zero egress fees** | Already the §3 choice. Zero egress is the reason it wins for images. |
| **Auth** | [Clerk](https://clerk.com) | 10,000 monthly active users | Already the §3 choice. |

So **four of the five are already what §3 specifies and are free.** Only the
application host needs changing.

## The cold-start problem, and why it matters here

Render's free tier spins a service down after 15 minutes of inactivity. The next
request waits **30–60 seconds**.

For this project that is not a minor annoyance:

- A **judge** opening the app after it has been idle hits a minute of nothing.
  The §1 note that judges may never install the app cuts both ways — if they do,
  a cold start is the first thing they experience.
- Any **demo** is unpredictable unless the service happens to be warm.

Three ways to handle it, in order of how much I would trust them:

1. **Keep the app local-first for anything on the critical path.** The wardrobe,
   Studio, outfits and feed already work with the server switched off. If the
   API only handles purchases, moderation and search, a cold start never blocks
   the parts a judge looks at. **This is the option I would take.**
2. **Ping it awake.** A free cron (GitHub Actions, cron-job.org) hitting
   `/v1/health` every 10 minutes keeps it live. Works, but it is a workaround,
   and it burns the free instance-hours you are trying to conserve.
3. **Pay.** Render's cheapest always-on tier is a few dollars a month, and Fly.io
   is similar. If the budget can stretch at all, this removes the problem
   entirely and is the least engineering effort.

## Alternatives considered

- **Koyeb** — has a free instance and is a reasonable fallback if Render's cold
  starts prove unworkable.
- **Vercel / Cloudflare Workers** — generous free tiers, but they are serverless
  and NestJS is a long-lived server. It can be adapted, but the worker and
  BullMQ do not fit the model at all.
- **Supabase** — free Postgres plus auth plus storage in one, which would
  replace Neon, Clerk and R2 together. Rejected earlier as a §3 substitution;
  worth revisiting only if managing four vendors becomes the bottleneck.

## What is *not* free, and needs a budget

- **Google Vertex AI** (try-on, and visual search if used) requires a billing
  account. There is a trial credit, but this has a real cost floor per render —
  which is exactly why the §5.2 cache exists: cost scales with unique outfits,
  never with taps.
- **Apple Developer** — $99/year. Unavoidable for iOS.
- **Google Play** — $25 one-off.
- **Sightengine / Ximilar** — free tiers exist but are small. Check limits before
  relying on them for moderation, which cannot be allowed to fail open.

## Suggested order

1. Neon, Upstash, R2, Clerk — all free, all already in §3.
2. Render for the API, accepting cold starts, with the app staying local-first.
3. Revisit paid hosting only if latency becomes visible in the demo video.
