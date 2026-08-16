#!/usr/bin/env node
/**
 * Validates google-services.json before a build wastes twenty minutes on EAS.
 *
 * The failure this exists to catch: without a SHA-1 fingerprint registered in
 * Firebase, the downloaded file contains no Android OAuth client. Sign-in then
 * fails at runtime with `DEVELOPER_ERROR` (status 10) — a message that names
 * nothing and points nowhere. Everything else about the build looks fine.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXPECTED_PACKAGE = 'app.vastra';

const problems = [];
const notes = [];

let config;
try {
  config = JSON.parse(readFileSync(join(root, 'google-services.json'), 'utf8'));
} catch (error) {
  console.error('✗ google-services.json is missing or unparseable.');
  console.error('  Firebase console → Project settings → Your apps → Android → download.');
  console.error(`  (${error.message})`);
  process.exit(1);
}

const projectId = config.project_info?.project_id ?? '(none)';
const client = (config.client ?? []).find(
  (c) => c.client_info?.android_client_info?.package_name === EXPECTED_PACKAGE,
);

if (!client) {
  problems.push(`No client for package "${EXPECTED_PACKAGE}". Registered: ${
    (config.client ?? [])
      .map((c) => c.client_info?.android_client_info?.package_name ?? '?')
      .join(', ') || 'none'
  }`);
} else {
  const oauth = client.oauth_client ?? [];
  // client_type 3 is the Web client, used as `webClientId` to request an ID
  // token. client_type 1 is the Android client, which only exists once a SHA-1
  // is registered.
  const web = oauth.find((o) => o.client_type === 3);
  const android = oauth.filter((o) => o.client_type === 1);

  if (!web) {
    problems.push('No web OAuth client (client_type 3). Enable Google under Authentication → Sign-in method.');
  } else if (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() &&
             process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.trim() !== web.client_id) {
    problems.push('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID does not match this file. Sign-in will fail.');
  }

  if (android.length === 0) {
    problems.push(
      'No Android OAuth client (client_type 1) — no SHA-1 is registered.\n' +
      '    Google Sign-In will fail with DEVELOPER_ERROR (status 10).\n' +
      '    Add the SHA-1 from expo.dev → Credentials → Android → Keystore, then RE-DOWNLOAD this file.',
    );
  } else {
    notes.push(`${android.length} Android OAuth client${android.length > 1 ? 's' : ''} (SHA-1 registered)`);
    if (android.length === 1) {
      notes.push(
        'Only one SHA-1. Play re-signs uploads with its own key, so Google Sign-In\n' +
        '    will work in testing and fail for Play Store installs until the Play App\n' +
        '    Signing SHA-1 is added too (Play Console → Setup → App signing).',
      );
    }
  }
  if (!client.api_key?.length) problems.push('No api_key in the client entry.');
}

console.log(`project: ${projectId}   package: ${EXPECTED_PACKAGE}`);
for (const note of notes) console.log(`  · ${note}`);

if (problems.length) {
  console.error('\n✗ google-services.json is not ready:');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log('\n✓ google-services.json looks complete.');
