# BUILDS

## Why a development build is now required

`react-native-purchases` is a **native module**, and Expo Go ships a fixed set
of native modules that does not include it. Purchases therefore cannot be
tested in Expo Go at all — the app degrades to "purchases unavailable" by
design rather than crashing, but no purchase flow can be exercised.

A development build is Expo Go with *our* native modules compiled in. Same
fast refresh, same QR-and-scan workflow, but RevenueCat actually works.

## Why EAS rather than a local build

This machine has no JDK, no Android SDK and no adb. Building locally would mean
downloading a JDK plus Android Studio — several gigabytes — before the first
compile.

PROJECT.md §3 already specifies **EAS Build** for CI, so the cloud path is both
the lighter option and the one the spec calls for.

## What you need to do

Claude cannot do these: they need an account and an interactive login.

**1. An Expo account** — free, at <https://expo.dev/signup>.

**2. Log in and build:**

```bash
cd apps/mobile
npx eas login
npx eas build --profile development --platform android
```

The first run asks to create an EAS project and generate an Android keystore.
Say yes to both — EAS stores the keystore, and losing it later means you cannot
update an app already on the Play Store.

**3. Install the APK.** EAS gives you a URL and a QR code when the build
finishes. Open it on the Pixel and install.

**4. Run the dev server against it:**

```bash
npx expo start --dev-client --tunnel
```

`--dev-client` matters: without it the server targets Expo Go and the build
will not connect.

Expect 10–20 minutes for a first build on the free tier, mostly queue time.

## Profiles

| Profile | Output | Purpose |
|---|---|---|
| `development` | APK, dev client | Daily work. Fast refresh, RevenueCat live. |
| `preview` | APK | Internal testing. Behaves like production, installs directly. |
| `production` | AAB | Play Store. Auto-increments version. |

`preview` is what the **12 testers** need for Google Play closed testing — see
the account-type note in docs/TASKS.md T01, since that requirement is the
longest lead time in the whole project.

## What this does not change

Expo Go still works for everything except purchases — the UI, the Studio, the
figure, navigation. Keep using it for design work; use the development build
when touching payments.
