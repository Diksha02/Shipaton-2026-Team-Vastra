# Legal documents — what Vastra actually needs

**Not legal advice.** This is an engineer's inventory of what exists, what is
missing, and what blocks what. Anything marked ⚖️ needs a solicitor before it is
relied on.

Status: ✅ drafted · ⚠️ partial · ❌ missing · 🔜 not needed yet

---

## A. Between the two of you — nothing exists, and this is the urgent gap

None of these exist. They are the only documents that decide **who owns Vastra**,
and every one of them gets harder to agree the moment there is money or a
disagreement. Agreeing them now, while you both want the same thing, costs a few
hundred pounds and an afternoon.

| # | Document | Status | Why it matters |
|---|---|---|---|
| A1 | ⚖️ **Founders' Agreement** | ❌ | The one that matters. Ownership shares, who decides what, what happens if one of you stops working on it, and how either of you can leave. Without it you are **joint copyright owners with a mutual veto** — neither can license or sell it without the other, which is deadlock rather than control. |
| A2 | ⚖️ **IP Assignment** | ❌ | Assigns all work done *so far* — code, designs, the name, the docs — into whatever entity or split A1 defines. Without this, work already done sits in an undefined joint pool. |
| A3 | ⚖️ **Account & Revenue Schedule** | ❌ | Names who holds each account and who receives money: the store developer account, RevenueCat, the bank account, the domain, the repo. **Whoever's developer account publishes owns the listing and receives the revenue.** This is still undecided and is the single highest-value item on this page. |
| A4 | **Contributor terms** | 🔜 | Only if a third person writes code. Then it is not optional. |
| A5 | **Mutual NDA** | 🔜 | Before pitching brands or investors. |

**Practical note, not a document:** the GitHub repo is owned by `Diksha02`; you
have push but not admin. A personal mirror of the full history is prudent
housekeeping, not an act of distrust.

---

## B. Required before the app can ship

| # | Document | Status | Notes |
|---|---|---|---|
| B1 | **Privacy Policy** | ✅ drafted | `PRIVACY.md`. Needs ⚖️ review, a hosted public URL, and the ICO number filling in. |
| B2 | **Terms of Service / EULA** | ✅ drafted | `TERMS.md`. Needs ⚖️ review. Carries the Apple 1.2 clauses. |
| B3 | **Public hosting for both** | ⚠️ | `index.html` exists; it needs a real URL. Both stores require a **publicly reachable** policy link before review. |
| B4 | **Community guidelines** | ⚠️ | Inside §4 of the Terms. Fine, but stores prefer it findable on its own. |
| B5 | **Data-safety form (Play)** | ❌ | Filled in the Play Console, not a file. Must match B1 exactly — a mismatch is a rejection and, if wrong, a misrepresentation. |
| B6 | **AI content disclosure** | ❌ | Both stores now require declaring generative-AI features. |
| B7 | **Account deletion route** | ✅ built | Required by both stores. Working in-app and documented. |

---

## C. Required before **try-on** exists — not before

Do not build try-on before C1–C3 are in place. See `RISK.md`: Illinois BIPA
carries a private right of action at **$1,000–$5,000 per person**, and virtual
try-on is an active litigation area right now.

| # | Document | Status | Notes |
|---|---|---|---|
| C1 | ⚖️ **Biometric consent notice** | ⚠️ | Must be **separate and specific** — burying it in general Terms acceptance does not satisfy BIPA. The schema field exists; the notice and screen do not. |
| C2 | ⚖️ **Biometric retention & destruction policy** | ⚠️ | Drafted inside `PRIVACY.md`, but BIPA requires it **publicly available in writing** and actually executed. The destruction job is not built. |
| C3 | ⚖️ **DPIA** (Data Protection Impact Assessment) | ❌ | UK GDPR Art. 35. Processing body images at scale almost certainly triggers a mandatory DPIA. Must be done **before** processing begins. |

---

## D. UK GDPR housekeeping — cheap, and non-optional

| # | Document | Status | Notes |
|---|---|---|---|
| D1 | **ICO registration** | ❌ | £52–60/year. Most UK controllers must pay it, and **non-payment is itself an offence**. |
| D2 | **ROPA** — record of processing | ❌ | Art. 30. A table of what you process and why. An afternoon's work. |
| D3 | ⚖️ **International transfer assessment + IDTA** | ❌ | RevenueCat, Firebase and Vertex AI process in the US. Needs the UK IDTA or the UK Addendum to the EU SCCs, plus a transfer risk assessment. |
| D4 | **Breach response plan** | ❌ | You have **72 hours** to notify the ICO. Nobody writes this calmly during a breach. |
| D5 | **Data processing agreements** | ⚠️ | Accepted rather than drafted — each provider's standard DPA. Keep copies. |

---

## E. Commercial — before money moves

| # | Document | Status | Notes |
|---|---|---|---|
| E1 | **Affiliate / partner terms** | ❌ | Once a brand pays for placement. Must state what is paid for and that disclosure is mandatory. |
| E2 | **Sponsored-content disclosure policy** | ⚠️ | The `AD` label is built. Write the internal rule so it is applied consistently. |
| E3 | **Trademark — "Vastra"** | ❌ | Class 9 (software) and Class 35 (retail). Unregistered today, and the name is a common Sanskrit word, which makes it harder to protect. Worth a search before spending on branding. |
| E4 | **Company incorporation** | 🔜 | The Terms currently say "not a limited company", so you are trading as individuals with **unlimited personal liability**. Incorporating also gives A1/A2 a clean entity to assign IP into. |

---

## What I would do, in order

1. **A3 — decide the store account and revenue split, in writing.** It is free, it takes an afternoon, and it decides who gets paid.
2. **A1 + A2 — founders' agreement and IP assignment.** One solicitor visit. Cheapest thing on this page relative to what it protects.
3. **B3 — host the policies.** A hard release blocker.
4. **D1 — ICO registration.** £52 and a form.
5. **B5, B6** during store submission.
6. **C1–C3 only if try-on is going ahead**, and before a line of it is written.
7. E and D2–D4 after launch.

Items 1 and 2 are the ones that get *harder* with time. Everything else merely
gets more urgent.
