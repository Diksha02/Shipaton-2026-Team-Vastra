const fs = require('node:fs');
const path = require('node:path');

/**
 * Attaches the Firebase config files, but only when they actually exist.
 *
 * `app.json` cannot express "if present", and naming a missing file is not a
 * soft failure: Expo reports `Could not parse Expo config` on *every* manifest
 * request, which surfaces on a device as an app that sits there reloading. The
 * iOS plist in particular will not exist until there is an Apple Developer
 * account, and both files are gitignored, so a fresh clone has neither.
 *
 * Returning the static config untouched when a file is absent keeps the app
 * runnable for anyone who has not set Firebase up yet.
 */
module.exports = ({ config }) => {
  const android = path.join(__dirname, 'google-services.json');
  const ios = path.join(__dirname, 'GoogleService-Info.plist');

  return {
    ...config,
    android: {
      ...config.android,
      ...(fs.existsSync(android) ? { googleServicesFile: './google-services.json' } : {}),
    },
    ios: {
      ...config.ios,
      ...(fs.existsSync(ios) ? { googleServicesFile: './GoogleService-Info.plist' } : {}),
    },
  };
};
