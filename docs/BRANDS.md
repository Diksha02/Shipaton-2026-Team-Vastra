# Getting real product imagery

**Not legal advice.** An engineer's map of how to replace the placeholder
cutouts with licensed brand photography, what has to exist before a brand will
talk to you, and the one licensing problem that is specific to this app.

---

## Where we are

`apps/mobile/assets/garments/*.webp` are **17 Unsplash photographs** with their
backgrounds removed. They are placeholders, marked as such in `ASSETS.md`, and
18 more were discarded during sourcing because they carried third-party
trademarks — a Nike swoosh, Levi's tabs, a D&G bag.

They cannot ship as a catalogue. Unsplash's licence covers using the photograph;
it does not make the photographed garment a product you may list, and it gives
you no relationship with the brand whose clothes appear in it.

---

## ⚠️ Read this before negotiating anything

**Vastra does not display product photographs. It cuts them up.**

The Studio removes the background from a garment and composites it onto a
figure alongside other brands' garments. That is a **derivative work**, and
almost every standard product-image licence — affiliate feeds included —
permits *display* while forbidding *modification*.

So the right that matters to us is not the one usually on offer. When a licence
says "you may display our imagery in your app", that is **not** permission to:

- remove the background
- crop, mask or recolour
- composite the garment with a competitor's garment on one figure
- generate a try-on image derived from it

This has to be raised explicitly, in the first conversation, in writing. A
partnership signed on standard display terms and then used for cutouts is an
infringement we walked into knowingly, and "everyone does it" is not a defence.

**Two fallbacks if a brand will not grant modification rights:**

1. **Shop-only imagery.** Their photographs appear in Shop, Trending, brand
   pages and search — unmodified, as supplied — and are simply not available
   in the Studio. The Studio then works on your own wardrobe only, which is
   what it is for anyway.
2. **Ask for flat-lays or PNGs with alpha.** Many brands already produce
   cutout packshots for their own site. Asking for the asset you need is far
   easier than asking for the right to make it.

Fallback 1 is achievable today and needs no negotiation. Design for it.

---

## Route 1 — Affiliate networks (do this first)

**This is how essentially every shopping app gets its catalogue**, and it needs
no brand to say yes to you personally.

Networks: **Awin**, **CJ Affiliate**, **Rakuten Advertising**, **Sovrn Commerce**,
**Impact**. In the UK, Awin has the deepest fashion roster.

What you get: a **product feed** — titles, prices, sizes, stock, deep links and
**image URLs the network is licensed to sublicense to publishers**. Plus
commission on sales, which is the revenue model in `PROJECT.md` already.

Why it is first: networks accept small publishers, the imagery question is
answered by the network's publisher terms rather than by twenty separate
negotiations, and the ingest pipeline for it already half exists in
`packages/providers/src/ingest`.

**What they will ask you for**

| | Status |
|---|---|
| A live website or app with real content | ⚠️ app not released |
| Privacy policy at a public URL | ⚠️ drafted, not hosted |
| Terms of service at a public URL | ⚠️ drafted, not hosted |
| A legal entity, or a named sole trader | ❌ neither |
| A bank account for commission | ❌ |
| Traffic estimate, honestly given | ⚠️ pre-launch |
| A description of how links are used | ✅ easy |

**Read the publisher terms for the modification clause.** Most permit display of
feed imagery and forbid altering it. That is the constraint above, arriving
through the front door.

---

## Route 2 — Aggregator and marketplace APIs

Faster than brand deals, broader than a single retailer.

- **Shopify Collabs** — reaches thousands of independent brands at once, and
  smaller labels are far more likely to grant unusual rights than a global one.
- **Amazon Product Advertising API** — vast, strict, and its terms are
  restrictive about image handling.
- **eBay / Zalando / ASOS partner programmes** — regional, varying quality.

Independent Shopify brands are the realistic first "yes" for cutout rights,
because the decision-maker is a founder rather than a legal department.

---

## Route 3 — Direct brand partnership

The version that gives you the AD placements and the "Free try-on week" moments
already designed into the Today screen. Also the slowest, and nobody signs one
with an unreleased app.

**What must exist before you send the first email**

1. **A legal entity.** Brands do not contract with two individuals. This is
   `CHECKLIST.md` item E4, and it gates this entire route.
2. **A live, installable app** with real users, and a number you can state.
3. **A one-page media kit** — what Vastra is, who uses it, what a brand gets,
   what you need from them.
4. **A technical one-pager** — feed format accepted, update cadence, how deep
   links and attribution work, where their logo and imagery appear.
5. **Brand-safety answers.** What stops their coat appearing beside something
   objectionable in the Looks feed. You have moderation, reporting and blocking
   built — say so.
6. **Insurance.** Larger brands ask for professional indemnity and public
   liability before contracting.

---

## The rights to ask for, explicitly

Do not accept "you can use our images". Ask for each of these in writing:

| Right | Why we need it |
|---|---|
| **Display** in-app | The catalogue, search, brand pages |
| **Resize and re-encode** | Thumbnails, WebP, CDN delivery |
| **Background removal / masking** | The Studio. **The one they will hesitate on.** |
| **Composite with third-party garments** | Outfits mix brands by definition |
| **Derivative generation (try-on)** | Only if try-on is going ahead — see `RISK.md` |
| **Cache and self-host** | Feeds go stale; many licences require hotlinking |
| **Territory** | UK minimum, worldwide preferred |
| **Term and termination** | What happens to cached imagery when it ends |
| **Trademark use** | Their name and logo on a brand page and an AD label |
| **Attribution** | What credit they require, and where |

Two that get missed and cause real problems later: **caching** (if you must
hotlink, their CDN outage becomes your empty screen) and **termination** (if
imagery must be purged on notice, that has to be a job you can actually run).

---

## What to build to be worth partnering with

The pitch is not "give us your pictures". It is "we send purchase-intent traffic
and can prove it".

- **Feed ingestion** — Awin/CJ CSV and XML. Half built in `providers/ingest`.
- **Attribution** — affiliate deep links with our publisher ID. `items` already
  carries `affiliateUrl` beside `productUrl`.
- **Click and conversion reporting** — the number every brand asks for first.
- **Stock and price freshness** — a stale price is a support complaint for them.
- **Brand pages** — built. `/brand/[slug]`.
- **Disclosure** — the `AD` label is built and is a *selling point*: it shows a
  brand you run compliant placements under the CAP Code and FTC guidance.

---

## Honest sequencing

1. **Incorporate**, host the policies, open a bank account. Nothing else is
   possible without these — every route asks for all three.
2. **Join one affiliate network** (Awin). Read the publisher terms for the
   modification clause before building against it.
3. **Ship the app.** Every conversation improves once there is something to
   install.
4. **Build Shop on unmodified feed imagery**, with the Studio using only the
   user's own garments. This is the design that needs no special rights, and it
   should be the default rather than a fallback.
5. **Approach independent Shopify brands** for cutout rights, since a founder
   can say yes to something unusual.
6. **Approach larger brands** only with usage numbers in hand.

The trap to avoid is building the Studio around brand imagery you do not yet
have the right to modify — and then discovering the whole mechanic rests on a
permission nobody grants by default.
