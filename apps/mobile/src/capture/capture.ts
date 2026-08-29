import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

/**
 * Getting photographs into the app.
 *
 * Every function here returns a result rather than throwing, and a cancellation
 * is an ordinary outcome rather than an error. Someone backing out of a camera
 * should never see a failure dialog — that is the same mistake the Google
 * sign-in error handling made before it was fixed.
 */

export type CaptureResult =
  | { ok: true; uris: string[] }
  | { ok: false; reason: 'cancelled' | 'denied' | 'unsupported' | 'failed'; message?: string };

/** Web has no native picker in this app, and pretending otherwise produces a
 *  button that does nothing. */
function supported(): boolean {
  return Platform.OS !== 'web';
}

async function ensurePermission(kind: 'camera' | 'library'): Promise<boolean> {
  const request =
    kind === 'camera'
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;
  try {
    const { granted } = await request();
    return granted;
  } catch {
    return false;
  }
}

/**
 * One photograph, taken now.
 *
 * Editing is off. A crop step per garment is a decision per garment, and the
 * background gets removed anyway — asking someone to frame a shirt they are
 * about to have cut out is work that changes nothing.
 */
export async function captureOne(): Promise<CaptureResult> {
  if (!supported()) return { ok: false, reason: 'unsupported' };
  if (!(await ensurePermission('camera'))) return { ok: false, reason: 'denied' };

  try {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });
    if (result.canceled) return { ok: false, reason: 'cancelled' };
    return { ok: true, uris: result.assets.map((a) => a.uri) };
  } catch (error) {
    return { ok: false, reason: 'failed', message: describe(error) };
  }
}

/**
 * Shoot repeatedly without leaving the flow.
 *
 * `onShot` fires after each photograph so the queue grows visibly, and
 * `shouldContinue` decides whether to reopen the camera. The loop stops the
 * moment someone cancels, which is how they finish — there is no "done"
 * button to hunt for with a camera already open.
 *
 * A true continuous viewfinder needs `expo-camera` and therefore a new native
 * build. This gets most of the benefit with no rebuild: the shutter stays one
 * tap away and nothing is tagged until the end.
 */
export async function captureBurst(
  onShot: (uri: string, total: number) => void,
  shouldContinue: () => boolean = () => true,
  max = 40,
): Promise<CaptureResult> {
  if (!supported()) return { ok: false, reason: 'unsupported' };
  if (!(await ensurePermission('camera'))) return { ok: false, reason: 'denied' };

  const uris: string[] = [];
  try {
    while (uris.length < max && shouldContinue()) {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });
      // Cancelling ends the burst and keeps everything shot so far.
      if (result.canceled) break;
      for (const asset of result.assets) {
        uris.push(asset.uri);
        onShot(asset.uri, uris.length);
      }
    }
  } catch (error) {
    // Anything already captured is still worth keeping.
    if (uris.length === 0) return { ok: false, reason: 'failed', message: describe(error) };
  }

  if (uris.length === 0) return { ok: false, reason: 'cancelled' };
  return { ok: true, uris };
}

/**
 * Several photographs already on the phone.
 *
 * The highest-yield route by a distance for anyone who already photographs
 * their clothes, because the work is done — this is selection, not capture.
 */
export async function pickFromLibrary(limit = 30): Promise<CaptureResult> {
  if (!supported()) return { ok: false, reason: 'unsupported' };
  if (!(await ensurePermission('library'))) return { ok: false, reason: 'denied' };

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: limit,
      quality: 0.8,
    });
    if (result.canceled) return { ok: false, reason: 'cancelled' };
    return { ok: true, uris: result.assets.map((a) => a.uri) };
  } catch (error) {
    return { ok: false, reason: 'failed', message: describe(error) };
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

/** Plain language for a failed capture. Never shown for a cancellation. */
export function captureMessage(reason: Exclude<CaptureResult, { ok: true }>['reason']): string {
  switch (reason) {
    case 'denied':
      return 'Vastra needs permission to use your camera or photos. You can grant it in Settings.';
    case 'unsupported':
      return 'Adding photos needs the phone app.';
    default:
      return 'That did not work. Try again.';
  }
}
