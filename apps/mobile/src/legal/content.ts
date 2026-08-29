/**
 * In-app Terms & Privacy copy.
 * Keep in sync with docs/legal/TERMS.md, PRIVACY.md, and docs/legal/index.html.
 * Bump LEGAL_DOC_VERSION when material terms change.
 */
export const LEGAL_DOC_VERSION = '2026-08-20';

export type LegalSectionId = 'terms' | 'privacy';

export interface LegalBlock {
  id?: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export const LEGAL_INTRO = {
  title: 'Terms & Privacy',
  updated: 'Last updated: 20 August 2026 · Effective: 20 August 2026',
  creators:
    'Vastra is created and operated by Diksha Nigam and Ujjwal Deep (individual creators, not a limited company). Contact: vastra.sup@gmail.com.',
};

export const TERMS_BLOCKS: LegalBlock[] = [
  {
    id: 'terms',
    heading: 'Terms of Service',
    paragraphs: [
      'These terms are a contract between you and Vastra (“we”, “us”), created and operated by Diksha Nigam and Ujjwal Deep. We are not a limited company. By using the Vastra mobile app you agree to these terms. If you do not agree, do not use the app.',
      'Contact: vastra.sup@gmail.com.',
    ],
  },
  {
    heading: '1. Who can use Vastra',
    paragraphs: [
      'You must be at least 13, and at least 16 if you are in the UK or EU. If you are under 18 you confirm a parent or guardian agrees to these terms on your behalf.',
    ],
  },
  {
    heading: '2. Your licence',
    paragraphs: [
      'We grant you a personal, non-exclusive, non-transferable, revocable licence to use Vastra on devices you own, for your own non-commercial use.',
      'You may not: copy, modify, reverse engineer or decompile the app; use it unlawfully; scrape it; attempt to defeat its security or rate limits; or resell access to it.',
    ],
  },
  {
    heading: '3. Your content',
    paragraphs: [
      'You keep ownership of everything you upload — your garment photographs, your outfits, and anything you post.',
      'You grant us a worldwide, royalty-free licence to host, store, reproduce and display your content solely to operate the app for you. For content you post publicly to the Looks feed, that licence extends to showing it to other users. The licence ends when you delete the content, except for copies we must keep to meet a legal obligation, and for copies other users may already have saved.',
      'You confirm that you own or have the right to upload what you upload, and that it does not infringe anyone else’s rights.',
    ],
  },
  {
    heading: '4. Community rules',
    paragraphs: [
      'We have zero tolerance for objectionable content and abusive behaviour.',
      'You must not post content that is: sexually explicit; violent or graphic; hateful, harassing, or discriminatory; illegal; defamatory; deceptive; a breach of someone’s privacy; an infringement of intellectual property; spam; or a photograph of another identifiable person taken or shared without their permission.',
      'We may remove content, suspend, or permanently terminate accounts that breach these rules. We report illegal content to the authorities where the law requires.',
    ],
  },
  {
    heading: '5. Purchases and payment',
    paragraphs: [
      'Payments are processed by Apple (iOS) or Google (Android) under their terms, and managed through RevenueCat. We never receive your card details. We do not take card payments directly (no Stripe or Razorpay checkout inside Vastra).',
      'Vastra is free to use. The free tier includes one permanent outfit space and four single-use saves. A single-use save is consumed when you save an outfit and is not returned if you later delete that outfit. A permanent space is released when you delete the outfit in it, and can be reused indefinitely.',
      'Deleting your own content is always free, immediate and unconditional. We never charge for deletion.',
      'Vastra Pro is offered as an auto-renewing subscription and as a one-off lifetime purchase where available. Outfit credit / slot packs may also be offered as consumable digital items. Prices are shown in your local currency before you buy. Sales tax or VAT may be added as required. We may change prices at any time; the price you see at purchase applies to that transaction.',
      'Subscriptions renew automatically unless cancelled at least 24 hours before the period ends. You cancel through your Apple or Google account, not through us. Refunds are handled by Apple and Google under their policies.',
      'Purchased outfit credits have no cash value, cannot be exchanged for money, and are not transferable between accounts. Unused credits are lost if your account is terminated for breach.',
      'If you are a UK consumer you normally have 14 days to cancel a distance contract. By starting to use paid digital content immediately you agree to immediate performance and acknowledge that you may lose that cancellation right once delivery begins. This does not affect your rights where the content is faulty.',
    ],
  },
  {
    heading: '6. Try-on and AI features',
    paragraphs: [
      'Try-on generates an image using artificial intelligence. It is an approximation, not a fitting. Garments may not look the same in reality, and we make no promise about fit, size, colour accuracy, or suitability.',
      'Try-on requires your separate, explicit consent and stays off until you give it. You can withdraw at any time. See the Privacy Policy for how we handle those photographs.',
    ],
  },
  {
    heading: '7. Shopping links',
    paragraphs: [
      'Vastra shows items from third-party retailers. We may earn a commission when you buy through those links. We do not sell those items. Your purchase is a contract with the retailer, under their terms, and we are not responsible for the product, its price, its delivery, or their customer service. Prices and availability shown in Vastra may be out of date.',
    ],
  },
  {
    heading: '8. Availability',
    paragraphs: [
      'We aim to keep Vastra working but do not guarantee it will be uninterrupted or error-free. We may change, suspend, or discontinue features. If we discontinue a paid feature you have already paid for, we will offer a fair remedy (for example a pro-rata refund where appropriate).',
    ],
  },
  {
    heading: '9. Ending this agreement',
    paragraphs: [
      'You may stop using Vastra at any time and delete your account in the app or by emailing us. We may suspend or terminate your account if you breach these terms, if required by law, or if we cease operating. Except where you have breached these terms, we will give you reasonable notice where we can.',
    ],
  },
  {
    heading: '10. Disclaimer and liability',
    paragraphs: [
      'The Services are provided on an “as is” and “as available” basis, to the fullest extent permitted by law. We disclaim warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the app will be uninterrupted, secure, or free of errors. Try-on and other AI outputs are estimates only. Third-party retailer links and products are outside our control.',
      'Nothing in these terms limits our liability for death or personal injury caused by our negligence, for fraud, or for anything else that cannot be limited by law. Your statutory rights as a consumer are not affected.',
      'Subject to that, we are not liable for: indirect or consequential loss; loss of profit, revenue, or data; content posted by other users; or the acts of third-party retailers. Our total liability is limited to the greater of the amount you paid us in the 12 months before the claim and £50. Some jurisdictions do not allow certain limitations; if those laws apply to you, some limits may not apply and you may have additional rights.',
    ],
  },
  {
    heading: '11. Changes',
    paragraphs: [
      'We may change these terms. If a change is material we will tell you in the app before it takes effect where practicable. Continuing to use Vastra afterwards means you accept it.',
    ],
  },
  {
    heading: '12. Governing law',
    paragraphs: [
      'These terms are governed by the laws of England and Wales. The courts of England and Wales have jurisdiction. If you live elsewhere in the UK or in the EU, you keep the protection of the mandatory consumer laws of your country of residence, and may bring proceedings there.',
      'Before formal proceedings, please contact vastra.sup@gmail.com so we can try to resolve the issue informally. These terms do not require binding international arbitration.',
    ],
  },
  {
    heading: '13. Contact',
    paragraphs: [
      'Vastra — Diksha Nigam and Ujjwal Deep (individual creators). Email: vastra.sup@gmail.com.',
    ],
  },
];

export const PRIVACY_BLOCKS: LegalBlock[] = [
  {
    id: 'privacy',
    heading: 'Privacy Policy',
    paragraphs: [
      'This policy explains how Vastra stores, uses, and protects personal data under UK GDPR and the Data Protection Act 2018.',
      'Vastra is created and operated by Diksha Nigam and Ujjwal Deep. We are not a limited company. We are the data controllers for the personal data described here. Privacy contact: vastra.sup@gmail.com.',
      'You may complain to the Information Commissioner’s Office (ico.org.uk, 0303 123 1113).',
    ],
  },
  {
    heading: 'The short version',
    paragraphs: [],
    bullets: [
      'Your wardrobe lives on your device by default. We do not need an account for you to use it.',
      'We do not sell your personal data, and we do not share it with advertisers.',
      'We do not use your photographs to train AI models.',
      'You can delete anything you have saved, at any time, for free. Deletion is never behind a payment.',
    ],
  },
  {
    heading: 'What we collect',
    paragraphs: [
      'Without an account: wardrobe content you create (garment photographs, outfit combinations, names) stored on your device; and basic diagnostics (app version, device model, operating system, crash reports).',
      'If you sign in with Google: a Firebase user ID, your email, and your display name and profile picture if provided. We never receive your Google password. A referral code we generate for you, and the code of whoever referred you.',
      'If you buy something: a purchase receipt, subscription status, and an anonymous or account-linked identifier via Apple/Google and RevenueCat. We never receive your card details. We do not take card payments directly.',
      'If you post to the Looks feed: the image you post, any caption, and moderation results.',
      'If you use try-on: a photograph of you that you choose to provide. Depending on where you live this may be treated as biometric information. We ask for separate, explicit consent before any such processing, and try-on stays switched off until you give it.',
    ],
  },
  {
    heading: 'Why we use it',
    paragraphs: [
      'Wardrobe and outfits, account identifiers, and referral codes: contract. Purchases: contract and legal obligation (tax). Diagnostics: legitimate interests. Moderation: legitimate interests and legal obligation. Try-on photographs: explicit consent (UK GDPR Article 9). Marketing email, if we ever send it: consent only. You can withdraw consent at any time.',
    ],
  },
  {
    heading: 'Biometric / try-on photographs',
    paragraphs: [
      'If — and only if — you enable try-on and give explicit consent, we process a photograph you supply solely to generate a try-on image at your request.',
      'Our AI processor is Google Cloud Vertex AI, acting under contract. They are not permitted to use your image for their own purposes or to train their models. We never sell, lease, trade, or otherwise profit from biometric information.',
      'We permanently destroy your try-on photograph and any biometric identifiers derived from it at the earliest of: when you withdraw consent or delete the photograph; when you delete your account; when the purpose for collection has been satisfied; or three (3) years after your last interaction with us.',
      'How to withdraw: email vastra.sup@gmail.com, or delete your try-on photo in the app. This destroys the image and disables try-on. There is no charge, and no delay.',
    ],
  },
  {
    heading: 'Processors and storage',
    paragraphs: [
      'We use on-device storage, Google Firebase (authentication), Neon (database, EU preferred), Cloudflare R2 (image storage), RevenueCat (subscriptions), Google Cloud Vertex AI (try-on), and Sentry / PostHog when enabled (crashes / analytics, EU preferred). Each is bound by contract to process only on our instructions.',
      'Some providers process data in the United States. Where they do, we rely on the UK International Data Transfer Agreement, or the UK Addendum to the EU Standard Contractual Clauses, together with a transfer risk assessment.',
      'We do not sell your personal data, and we do not “share” it for cross-context behavioural advertising under California law. When you tap through to a retailer we may earn a commission; we do not pass your name, email, or account identifier to that retailer.',
    ],
  },
  {
    heading: 'Retention',
    paragraphs: [
      'Wardrobe and outfits: until you delete them, or 12 months after account deletion request completes. Account record: until you delete your account. Try-on photographs: per the biometric schedule above. Purchase records: 6 years (UK tax). Moderation records: 12 months. Crash reports: 90 days.',
    ],
  },
  {
    heading: 'Your rights',
    paragraphs: [
      'Under UK GDPR you have the right to: access your data; correct it; erase it; restrict or object to processing; portability; and withdraw consent.',
      'If you are a California resident you additionally have the rights to know, delete, correct, and to opt out of sale or sharing — though we do neither.',
      'How to exercise them: email vastra.sup@gmail.com. We respond within one month (UK) or 45 days (California). Exercising your rights is free.',
    ],
  },
  {
    heading: 'Children',
    paragraphs: [
      'Vastra is not for children under 13, and if you are in the UK or EU you must be at least 16 to consent to the optional processing described above. We do not knowingly collect data from children. If you believe a child has given us data, email us and we will delete it.',
    ],
  },
  {
    heading: 'Security',
    paragraphs: [
      'Data is encrypted in transit (TLS) and at rest. Access is limited to those who need it. No system is perfectly secure, and we will notify you and the ICO of a personal data breach where the law requires it.',
    ],
  },
  {
    heading: 'Changes',
    paragraphs: [
      'If we change this policy materially we will tell you in the app before the change takes effect where practicable.',
    ],
  },
  {
    heading: 'Contact',
    paragraphs: [
      'Vastra — Diksha Nigam and Ujjwal Deep (individual creators). Email: vastra.sup@gmail.com.',
      'By using Vastra you acknowledge that you have read and understood these Terms of Service and this Privacy Policy.',
    ],
  },
];
