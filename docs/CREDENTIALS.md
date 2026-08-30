# CREDENTIALS

Everything the project needs from a third party: where to get it, what it
unblocks, and the order to do it in.

**Rules:** Claude never creates an account, never provisions a cloud resource,
and never invents a key. Ujjwal creates the account and pastes the value into
`.env`. `.env` is gitignored and must never be committed. Keys prefixed
`EXPO_PUBLIC_*` are compiled into the app bundle and are publishable by design —
never put a secret behind that prefix.

Status: ` ` needed · `x` provided

---

## Step 0 — do this before signing up for anything paid

The Shipaton **ShipKit unlocks in tiers**, and several things we would
otherwise pay for are free through it. Claiming in the wrong order means
paying for something that was about to be free.

1. **Register on Devpost** → unlocks Tier 1 immediately
2. **Create the RevenueCat project** → unlocks Tier 2
3. **Make a test purchase** → unlocks Tier 3

| Tier | Sponsor | Offer | Relevant to us |
|---|---|---|---|
| 1 (register) | **OneSignal** | Growth Plan **free for 3 months** | **Directly replaces a paid OneSignal plan.** Claim before signing up normally. |
| 1 | Codemagic | 500 build min/month free | CI/CD alternative to EAS Build |
| 1 | OpenRouter | $10 credit | Possible moderation/LLM fallback |
| 1 | Replit / JetBrains / Layers / Noise / Stripe | discounts + $250 Stripe credits | Peripheral |
| 2 (RC project) | **Mobbin** | 3 months free | Mobile design reference library — useful for the Design Award |
| 2 | Paddle | zero fees on first $100K | Not used; we bill through the stores |
| 3 (test purchase) | **Sentry** | **$100 credits** | Covers our error tracking outright |
| 3 | AppScreens / Linearity | 50% off | Store screenshots |
| 4 (store API call) | AppFollow / AppTweak / Airbridge | ASO + attribution discounts | Grand Prize is judged on traction |
| 5 (real purchase) | Appstack / Fload | free access | Attribution analytics |

Discord: <https://discord.gg/shipaton> · Support: shipaton@revenuecat.com

---

## Priority 1 — blocks the go/no-go decision

| | Service | Get the key here | Variables | Unblocks |
|---|---|---|---|---|
| [ ] | **Google Vertex AI** | <https://console.cloud.google.com/> → enable Vertex AI API | `GOOGLE_CLOUD_PROJECT`, `GOOGLE_APPLICATION_CREDENTIALS` (service-account JSON) | **T00 try-on spike (F7).** Model `virtual-try-on-001`, Imagen family. Takes a person image + a garment image. Requires a GCP project with billing enabled. If quality doesn't clear the bar, F7 changes shape and §6 pricing changes with it. |

> **Decision (2026-08-01):** try-on runs on **Google Vertex AI**, not FASHN.
> PROJECT.md §3 still names FASHN — the spec needs amending.
>
> Whatever the per-render price turns out to be, the §5.2 cache is what keeps
> it bounded: cost scales with unique outfits created, never with taps. For
> scale, FASHN charges ~$0.075/render, so ten taps on one outfit would cost
> 75¢ uncached versus 7.5¢ once with the cache.
>
> **Not yet needed.** Documented now, wired later — nothing in the codebase
> calls a try-on provider yet, and `TryonProvider` in `packages/providers`
> keeps the swap to one adapter file.

### Body measurements — no credential required

Body proportions come from **MediaPipe Pose Landmarker**
(<https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker>),
which runs **on-device**: free, no API key, and body data never leaves the
phone. 33 landmarks plus 3D world coordinates via the GHUM model.

It yields proportions, not absolute sizes — one scale reference fixes that, so
ask the user for height, derive the rest, and let them confirm and adjust.
Single-photo estimates are not tailoring-accurate (pose, loose clothing and
lens all shift them), but shaping a 2D silhouette does not need tailoring
accuracy. See FA-1 in docs/TASKS.md.

## Priority 2 — competition-mandatory

| | Service | Get it here | Variables | Unblocks |
|---|---|---|---|---|
| [x] | **RevenueCat** (test key set) | <https://app.revenuecat.com/> · Expo guide <https://www.revenuecat.com/docs/getting-started/installation/expo> | `EXPO_PUBLIC_REVENUECAT_IOS_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`, `REVENUECAT_SECRET_API_KEY`, `REVENUECAT_WEBHOOK_SECRET` | F11. **No RevenueCat purchase, no valid entry.** Creating the project also unlocks ShipKit Tier 2. |
| [ ] | **Apple Developer** | <https://developer.apple.com/programs/enroll/> | account | Store release. $99/yr. |
| [ ] | **Google Play** | <https://play.google.com/console/signup> | account | $25 one-time. Personal accounts created after 2023-11-13 need 12 testers for 14 consecutive days before production access — **organisation accounts are exempt**. Choose deliberately. |

## Priority 3 — nothing works end to end without these

| | Service | Get the key here | Variables |
|---|---|---|---|
| [ ] | **Clerk** | <https://dashboard.clerk.com/> | `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`, `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` |
| [ ] | **Cloudflare R2** | <https://dash.cloudflare.com/> → R2 → Manage API Tokens | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`, `R2_PUBLIC_BASE_URL` |

Clerk unblocks F1 phone-OTP auth and every authenticated route. R2 unblocks F2,
F3 and F7 — no photos, avatars or try-on renders exist without it.

## Priority 4 — the garment pipeline

| | Service | Get the key here | Variables |
|---|---|---|---|
| [ ] | **OpenAI** | <https://platform.openai.com/api-keys> | `OPENAI_API_KEY` |
| [ ] | **Sightengine** | <https://dashboard.sightengine.com/api-credentials> | `SIGHTENGINE_API_USER`, `SIGHTENGINE_API_SECRET` |
| [ ] | **Ximilar** | <https://app.ximilar.com/> | `XIMILAR_API_TOKEN` |

Moderation pass 1 is OpenAI omni-moderation (free). Pass 2 is Sightengine —
mind the fashion-calibrated thresholds in §5.1: swimwear and underwear **must**
pass. Ximilar does auto-tagging and degrades to manual entry.

## Priority 5 — retention and observability

| | Service | Get the key here | Variables |
|---|---|---|---|
| [ ] | **OneSignal** | <https://dashboard.onesignal.com/> — **claim the free Growth Plan via ShipKit Tier 1 first** | `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`, `EXPO_PUBLIC_ONESIGNAL_APP_ID` |
| [ ] | **PostHog** | <https://eu.posthog.com/> | `POSTHOG_API_KEY`, `EXPO_PUBLIC_POSTHOG_KEY` |
| [ ] | **Sentry** | <https://sentry.io/> — **$100 ShipKit credit at Tier 3** | `SENTRY_DSN`, `EXPO_PUBLIC_SENTRY_DSN` |

OneSignal unblocks F12 **and** the OneSignal prize category — one deployed
campaign qualifies, which is the best prize-to-effort ratio in the event.

## Priority 6 — production infrastructure

Local Docker covers development. These are only needed to deploy.

| | Service | Get it here | Variables |
|---|---|---|---|
| [ ] | **Neon** | <https://console.neon.tech/> | `DATABASE_URL` (local: `postgresql://vastra:vastra@127.0.0.1:55432/vastra`) |
| [ ] | **Upstash** | <https://console.upstash.com/> | `REDIS_URL` (local: `redis://127.0.0.1:6379`) |
| [ ] | **Fly.io** | <https://fly.io/dashboard> | API + worker hosting |
| [ ] | **Domain** | any registrar | Ingest User-Agent contact URL, privacy policy, store listing |

---

## What already runs with no credentials at all

- Postgres + Redis (local Docker), the full schema, all migrations
- Every provider interface against fakes: moderation, tagging, try-on, ingest, storage
- The API: config validation, response envelope, error filter, health endpoint
- The mobile app shell, design system, navigation, and every screen's visual design

Only *live provider calls* are blocked. The build is not.
