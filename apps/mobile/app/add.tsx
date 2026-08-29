import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { Text } from '../src/components/Text';
import {
  captureBurst,
  captureMessage,
  captureOne,
  pickFromLibrary,
  type CaptureResult,
} from '../src/capture/capture';
import { useIntake, usePendingCount } from '../src/store/intake';
import { useTheme } from '../src/theme/ThemeProvider';

type Status = 'ready' | 'early';

interface Method {
  key: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  /** What it actually does. */
  body: string;
  /** Who it is the right answer for. */
  bestFor: string;
  /** Honest speed, per garment. */
  pace: string;
  status: Status;
  /** Priority order is the order of this array — see the note on METHODS. */
  run?: () => Promise<CaptureResult>;
}

/**
 * Adding clothes — the flow the whole product depends on.
 *
 * Wardrobe apps are abandoned during cataloguing, not after it. A person owns
 * 50–200 garments; at twenty seconds each that is an hour of work before the
 * app does anything for them, and almost nobody finishes. So this screen is not
 * a menu of equivalent options — it is a *ranked* list, fastest first, and each
 * route states plainly what it does, who it suits and how quickly it goes.
 *
 * The ranking is by throughput, because throughput is the thing that decides
 * whether someone reaches a usable wardrobe:
 *
 *   1. Photos you already have  — no capture at all, just selection
 *   2. Shoot a whole shelf      — one shutter tap per garment, tag later
 *   3. One at a time            — careful, and the right call for a favourite
 *   4. Paste a link             — no photograph exists yet
 *   5. Shelf scan               — one photo, many garments; early and honest
 *
 * Nothing here demands completeness. Ten pieces is a useful wardrobe, and the
 * screen says so rather than implying a finish line nobody reaches.
 */
const METHODS: Method[] = [
  {
    key: 'library',
    icon: 'image',
    title: 'Photos you already have',
    body: 'Pick several at once from your camera roll. Nothing to photograph — the work is done.',
    bestFor: 'Fastest way to a full wardrobe',
    pace: 'about 30 pieces in a minute',
    status: 'ready',
    run: () => pickFromLibrary(),
  },
  {
    key: 'burst',
    icon: 'zap',
    title: 'Shoot a whole shelf',
    body: 'The camera reopens after every shot. Empty a drawer in one go and label everything later.',
    bestFor: 'Getting a real wardrobe in quickly',
    pace: 'about 5 seconds a piece',
    status: 'ready',
  },
  {
    key: 'one',
    icon: 'camera',
    title: 'One at a time',
    body: 'Lay it flat or hang it up. We cut the background out for you.',
    bestFor: 'A single piece you care about',
    pace: 'about 10 seconds',
    status: 'ready',
    run: () => captureOne(),
  },
  {
    key: 'link',
    icon: 'link',
    title: 'Paste a shop link',
    body: 'From wherever you bought it. We read the page for the photo, brand and price.',
    bestFor: 'Something you own but never photographed',
    pace: 'no photo needed',
    status: 'ready',
  },
  {
    key: 'shelf',
    icon: 'layers',
    title: 'Scan a whole stack',
    body: 'One photo of a folded pile or a hanging rail, split into separate garments automatically.',
    bestFor: 'Big wardrobes, once it is reliable',
    pace: 'early — it misses overlapping items',
    status: 'early',
  },
];

export default function AddGarmentScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<'choose' | 'link'>('choose');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shotCount, setShotCount] = useState(0);

  const addMany = useIntake((s) => s.addMany);
  const pending = usePendingCount();

  function tap() {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleResult(result: CaptureResult) {
    setBusy(null);
    setShotCount(0);
    // Backing out is not a failure and must never be reported as one.
    if (!result.ok) {
      if (result.reason !== 'cancelled') setError(captureMessage(result.reason));
      return;
    }
    const added = addMany(result.uris);
    if (added > 0) router.replace('/intake');
  }

  async function runMethod(method: Method) {
    tap();
    setError(null);

    if (method.key === 'link') {
      setMode('link');
      return;
    }
    if (method.status === 'early') {
      setError(
        'Stack scanning is still learning. It works on a neat pile with gaps, and misses garments that overlap. Use "Shoot a whole shelf" for now — we are improving this.',
      );
      return;
    }

    setBusy(method.key);

    if (method.key === 'burst') {
      const result = await captureBurst((_uri, total) => setShotCount(total));
      handleResult(result);
      return;
    }

    if (method.run) handleResult(await method.run());
  }

  if (mode === 'link') {
    return (
      <LinkMode
        url={url}
        setUrl={setUrl}
        onBack={() => setMode('choose')}
        insets={insets.top}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colour.bg, paddingTop: insets.top }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.layout.gutter,
          paddingTop: theme.space.sm,
          paddingBottom: theme.space.base,
        }}
      >
        <Text variant="title2">Add pieces</Text>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
          <Feather name="x" size={20} color={theme.colour.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: theme.layout.gutter,
          paddingBottom: insets.bottom + theme.space['3xl'],
          gap: theme.space.md,
        }}
      >
        {/* Removes the finish line. Someone who believes they must catalogue
            everything before the app works will never start. */}
        <Text variant="footnote" colour="secondary">
          Start with the ten things you wear most — that is enough for Vastra to be useful. You can
          always add more.
        </Text>

        {pending > 0 && (
          <Pressable onPress={() => router.push('/intake')}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.space.md,
                padding: theme.space.base,
                borderRadius: theme.radius.lg,
                backgroundColor: theme.colour.accentSubtle,
                borderWidth: theme.borderWidth.hairline,
                borderColor: theme.colour.accentBorder,
              }}
            >
              <Feather name="clock" size={16} color={theme.colour.accent} />
              <Text variant="footnote" colour="secondary" style={{ flex: 1 }}>
                {pending} {pending === 1 ? 'photo is' : 'photos are'} waiting to be labelled
              </Text>
              <Feather name="chevron-right" size={16} color={theme.colour.textTertiary} />
            </View>
          </Pressable>
        )}

        {!!error && (
          <MotiView
            from={{ opacity: 0, translateY: 6 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={{
              flexDirection: 'row',
              gap: theme.space.sm,
              padding: theme.space.base,
              borderRadius: theme.radius.lg,
              backgroundColor: theme.colour.surfaceMuted,
            }}
          >
            <Feather name="info" size={15} color={theme.colour.textSecondary} />
            <Text variant="footnote" colour="secondary" style={{ flex: 1 }}>
              {error}
            </Text>
          </MotiView>
        )}

        {METHODS.map((method, index) => (
          <MethodCard
            key={method.key}
            method={method}
            rank={index + 1}
            busy={busy === method.key}
            shotCount={busy === method.key && method.key === 'burst' ? shotCount : 0}
            disabled={busy !== null && busy !== method.key}
            onPress={() => void runMethod(method)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function MethodCard({
  method,
  rank,
  busy,
  shotCount,
  disabled,
  onPress,
}: {
  method: Method;
  rank: number;
  busy: boolean;
  shotCount: number;
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const early = method.status === 'early';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${method.title}. ${method.bestFor}. ${method.pace}`}
      style={{ opacity: disabled ? 0.4 : 1 }}
    >
      <View
        style={{
          flexDirection: 'row',
          gap: theme.space.base,
          padding: theme.space.base,
          borderRadius: theme.radius.xl,
          borderWidth: theme.borderWidth.hairline,
          borderColor: rank === 1 ? theme.colour.borderStrong : theme.colour.border,
          backgroundColor: theme.colour.surface,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colour.surfaceMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Feather
            name={busy ? 'loader' : method.icon}
            size={17}
            color={early ? theme.colour.textTertiary : theme.colour.textPrimary}
          />
        </View>

        <View style={{ flex: 1, gap: 4 }}>
          {/* The badge sits above the title rather than beside it. At 360pt the
              title wraps to two lines and a trailing badge collides with it. */}
          {(rank === 1 || early) && (
            <View style={{ flexDirection: 'row' }}>
              <View
                style={{
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  borderRadius: theme.radius.sm,
                  backgroundColor: rank === 1 ? theme.colour.actionPrimary : 'transparent',
                  borderWidth: rank === 1 ? 0 : theme.borderWidth.hairline,
                  borderColor: theme.colour.border,
                }}
              >
                <Text variant="micro" colour={rank === 1 ? 'onAction' : 'tertiary'}>
                  {rank === 1 ? 'FASTEST' : 'IMPROVING'}
                </Text>
              </View>
            </View>
          )}

          <Text variant="headline">{method.title}</Text>

          <Text variant="footnote" colour="secondary">
            {method.body}
          </Text>

          {/* Labelled and stacked. Two facts separated by a dot wrapped into
              two ragged columns at 360 and read as one run-on sentence. */}
          <View style={{ gap: 2, paddingTop: 4 }}>
            <Fact label="Best for" value={method.bestFor} />
            <Fact
              label="Speed"
              value={busy && shotCount > 0 ? `${shotCount} taken — cancel to finish` : method.pace}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/** A label and a value on one line, with the label at a fixed width so the
 *  values line up down the card. */
function Fact({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
      <Text variant="caption" colour="tertiary" style={{ width: 54 }}>
        {label}
      </Text>
      <Text variant="caption" colour="secondary" style={{ flex: 1 }}>
        {value}
      </Text>
    </View>
  );
}

function LinkMode({
  url,
  setUrl,
  onBack,
  insets,
}: {
  url: string;
  setUrl: (v: string) => void;
  onBack: () => void;
  insets: number;
}) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colour.bg, paddingTop: insets }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space.md,
          paddingHorizontal: theme.layout.gutter,
          paddingTop: theme.space.sm,
          paddingBottom: theme.space.base,
        }}
      >
        <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <Feather name="chevron-left" size={22} color={theme.colour.textPrimary} />
        </Pressable>
        <Text variant="title2">Paste a link</Text>
      </View>

      <View style={{ paddingHorizontal: theme.layout.gutter, gap: theme.space.base }}>
        <TextInput
          value={url}
          onChangeText={setUrl}
          placeholder="https://"
          placeholderTextColor={theme.colour.textDisabled}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          style={{
            height: 52,
            borderRadius: theme.radius.lg,
            paddingHorizontal: theme.space.base,
            backgroundColor: theme.colour.surfaceMuted,
            borderWidth: theme.borderWidth.hairline,
            borderColor: theme.colour.border,
            color: theme.colour.textPrimary,
            fontFamily: theme.fontFamily.sans,
            fontSize: 15,
          }}
        />
        <Button label="Read this page" disabled={url.trim().length < 8} />
        <Text variant="caption" colour="tertiary">
          Reading product pages needs the server, which is not connected yet.
        </Text>
      </View>
    </View>
  );
}
