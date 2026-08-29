# Legal risk register

**Not legal advice.** This is an engineer's map of where the product creates
legal exposure and what the code must do about it. Every item marked ⚖️ needs a
solicitor's sign-off before release.

---

## 1. ⚖️ Virtual try-on is the biggest exposure in the product

Vastra's try-on feature takes a photograph of the user's body and generates an
image of them wearing a garment. In the United States that is very likely
**biometric data**, and the risk is not theoretical:

- **Illinois BIPA** provides a **private right of action** with statutory damages
  of **$1,000 per negligent violation and $5,000 per reckless or intentional
  one** — per person, with no need to prove any actual harm. This is the only US
  biometric statute individuals can sue under directly, which is why essentially
  all the litigation is there.
- Virtual try-on is an **active litigation area, right now**. Charlotte Tilbury
  settled a try-on BIPA class action for **$2.925 million**. A comparable case
  against MAC Cosmetics survived a motion to dismiss in **June 2026**.
- Those cases concern *face* geometry. A full-body photograph used to fit
  garments is at minimum arguable, and "arguable" is enough to be sued.
- **Texas (CUBI)** and **Washington** have biometric statutes too, enforced by
  their Attorneys General rather than private plaintiffs.

### What BIPA actually requires, before any collection

1. A **publicly available written retention and destruction policy**, with a
   fixed schedule — destruction when the purpose is satisfied or **within 3
   years** of last interaction, whichever is sooner.
2. **Written notice** stating that biometric data is collected, the **specific
   purpose**, and the **duration** it is kept.
3. **Affirmative written consent** obtained *before* collection. Click-through
   consent counts, but it must be specific to biometrics — burying it in a
   general Terms acceptance does not.
4. **No selling, leasing, or otherwise profiting** from biometric data.
5. Reasonable standard of care in storage, and no disclosure without consent.

### The decision this forces

**Option A — geo-restrict.** Disable try-on for users in Illinois, Texas and
Washington. Crude, and it costs a few users, but it removes the statutory-damages
exposure almost entirely. Most small teams do this.

**Option B — full BIPA compliance.** Build the consent flow, the retention
schedule, and automated destruction. More work, keeps the whole market, and is
the right answer if try-on is central to the business.

**Option C — never send a body photo anywhere.** If try-on renders garments onto
a generic mannequin rather than the user, none of this applies. This is what the
app does *today*.

⚠️ **Recommendation: decide this before building try-on, not after.** The
schema already has `avatarConsentAt` with try-on blocked while null, so the
foundation is right — but consent alone is not compliance without the retention
policy and the destruction job.

---

## 2. ⚖️ UK GDPR — the app's default jurisdiction

The developer is UK-based, so UK GDPR and the Data Protection Act 2018 apply.

- **Body photographs processed to identify or depict a specific person** are
  likely **special category data** under Article 9, which requires *explicit*
  consent — a higher bar than ordinary consent.
- **Right to erasure (Article 17)** is why the slot model charges for *saving*
  and never for *deleting*. See PROJECT.md §4. Do not weaken this.
- **Article 22** — no solely automated decisions with legal or similarly
  significant effects. Outfit recommendations do not meet that bar.
- **International transfers**: Google Vertex AI processes in the US. Requires an
  **IDTA** or the UK Addendum to the EU SCCs, plus a transfer risk assessment.
- **ICO registration**: most UK controllers must pay the ICO data protection fee
  (£52–£60/year for small organisations). Cheap, and non-payment is itself an
  offence.

---

## 3. ⚖️ US state privacy law

- **CCPA/CPRA (California)** applies above revenue/volume thresholds Vastra will
  not hit at launch — but the privacy policy should carry the disclosures anyway,
  because thresholds are crossed quietly.
- **"Do we sell data?"** The answer must be **no**, and the affiliate links must
  not become a mechanism for sharing personal data with retailers. Passing a
  user identifier to an affiliate network can count as a "sale" under CPRA even
  with no money changing hands.

---

## 4. App store requirements that are also legal exposure

- **Apple 1.2 (user-generated content)** — the Looks feed cannot ship without: a
  content filter, a **report** mechanism, the ability to **block** users, and a
  published EULA with a **zero-tolerance policy for objectionable content**.
  Apple rejects for this routinely, and it is currently **not built**. Do **not**
  promise automated pre-screening, 24-hour report handling, or blocking in the
  public Terms/Privacy until those ship.
- **Account deletion in-app** is mandatory on both stores. Currently **not
  built** (T32).
- **AI content disclosure** — both stores now require declaring generative AI
  features.
- **Auto-renewing subscriptions** must state price, period, and renewal terms
  adjacent to the purchase control. The paywall does this; keep it that way.

---

## 5. Consumer law (UK)

- **14-day statutory cancellation right** for distance contracts. Digital content
  is exempt *only* if the consumer expressly consented to immediate performance
  and acknowledged losing the right — but in practice Apple and Google handle
  refunds, and the Terms must say so rather than promising a process we do not
  control.
- **Advertising affiliate links** must be disclosed (CAP Code, and FTC guidance
  in the US). "We may earn a commission" needs to be visible, not buried.

---

## 6. What the code must do, not just say

A policy that promises behaviour the app does not implement is itself a
misrepresentation — under the FTC Act §5 in the US, and unfair-practice rules in
the UK. Every promise below needs an implementation.

| Promise in the policy | Implemented? |
|---|---|
| Delete your account and all data | ❌ T32 not built |
| Export your data (portability) | ❌ not built |
| Withdraw avatar/AI consent | ⚠️ schema field exists, no UI |
| Automatic biometric destruction schedule | ❌ not built |
| Report and block in the feed | ❌ not built |
| We never sell your data | ✅ true today |
| Deleting an outfit is always free | ✅ enforced in `@vastra/shared/slots` |
| Photos are not used to train models | ⚠️ depends on Vertex AI settings — verify |

**Do not publish a policy containing a row marked ❌ until it is built.**
