import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatePresence, MotiView } from 'moti';
import { memo, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { wardrobe, type MockItem, type StudioLayer } from '../mock/data';
import { useLayer } from '../store/outfit';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

/**
 * The figure is drawn at a fixed design size and scaled to whatever space the
 * stage actually has. Laying it out in raw pixels is what made an earlier
 * version clip its own head and shoes on a 360pt phone.
 */
const FIGURE_W = 230;
const FIGURE_H = 400;

interface Zone {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Where each garment hangs on the figure, in design-space pixels.
 *
 * Garments are transparent cutouts, so the garment's own silhouette is the
 * shape — nothing is clipped into a body-shaped hole. Each zone is just an area
 * to fit inside, and `contain` keeps every piece at its true proportions.
 */
const ZONES: Record<StudioLayer, Zone> = {
  top: { left: 50, top: 58, width: 130, height: 128 },
  outerwear: { left: 30, top: 52, width: 170, height: 152 },
  bottom: { left: 66, top: 168, width: 98, height: 164 },
  footwear: { left: 56, top: 320, width: 118, height: 58 },
  bag: { left: 158, top: 148, width: 62, height: 74 },
  headwear: { left: 72, top: -10, width: 86, height: 56 },
  accessory: { left: 88, top: 18, width: 54, height: 30 },
};

/** Back to front. Outerwear sits over the top; accessories sit over everything. */
const PAINT_ORDER: StudioLayer[] = [
  'bottom',
  'top',
  'outerwear',
  'footwear',
  'bag',
  'headwear',
  'accessory',
];

function useItem(layer: StudioLayer): MockItem | null {
  const id = useLayer(layer);
  return id ? (wardrobe.find((candidate) => candidate.id === id) ?? null) : null;
}

/**
 * One garment on the figure.
 *
 * Subscribes to its own layer and is memoised, so changing the shoes re-renders
 * the shoes and nothing else. `AnimatePresence` with `exitBeforeEnter` makes the
 * outgoing garment leave before the incoming one arrives, rather than the two
 * crossfading through each other.
 */
const Worn = memo(function Worn({ layer }: { layer: StudioLayer }) {
  const theme = useTheme();
  const item = useItem(layer);
  const zone = ZONES[layer];

  return (
    <View
      style={{ position: 'absolute', left: zone.left, top: zone.top, width: zone.width, height: zone.height }}
      pointerEvents="none"
    >
      <AnimatePresence exitBeforeEnter>
        {!!item && (
          <MotiView
            key={item.id}
            from={{ opacity: 0, translateY: 12, scale: 0.94 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            exit={{ opacity: 0, translateY: -8, scale: 0.97 }}
            transition={{ type: 'timing', duration: theme.duration.fast }}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <Image
              source={item.image}
              style={{ width: '100%', height: '100%' }}
              // `contain`, never `cover` — a cutout cropped to fill its box is a
              // garment with its sleeves cut off.
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          </MotiView>
        )}
      </AnimatePresence>
    </View>
  );
});

/**
 * The body underneath — head, shoulders, legs.
 *
 * Deliberately faint. It exists so the stage reads as a person even when
 * nothing is chosen, and so garments have something to hang on. It is nobody:
 * seeing yourself in an outfit is what Try-On is for.
 */
function Silhouette() {
  const theme = useTheme();
  const skin = theme.colour.surfaceMuted;

  const part = (left: number, top: number, width: number, height: number, radius: number) => (
    <View
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        borderRadius: radius,
        backgroundColor: skin,
      }}
    />
  );

  return (
    <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} pointerEvents="none">
      {part(92, 8, 46, 46, 23)}
      {part(106, 46, 18, 22, 7)}
      {part(72, 64, 86, 112, 26)}
      {part(80, 168, 70, 26, 12)}
      {part(84, 186, 26, 148, 13)}
      {part(120, 186, 26, 148, 13)}
      {part(78, 326, 34, 20, 8)}
      {part(118, 326, 34, 20, 8)}
    </View>
  );
}

/**
 * The stage — a ghost mannequin.
 *
 * "Ghost mannequin" is the fashion-photography term for a garment shown as if
 * worn by an invisible person, which is exactly the model here: the figure is
 * anonymous, the clothes hang on it, and nobody's likeness is on screen.
 */
export function OutfitStage() {
  const theme = useTheme();
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);

  function onLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setBox({ width, height });
  }

  const scale = box ? Math.min((box.width * 0.9) / FIGURE_W, (box.height * 0.92) / FIGURE_H) : 0;

  return (
    <View
      onLayout={onLayout}
      style={{
        flex: 1,
        borderRadius: theme.radius['2xl'],
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colour.surface,
      }}
    >
      {/* A vertical wash rather than a hard-edged arch — light falling on the
          figure, not a shape drawn behind it. */}
      <LinearGradient
        colors={[theme.colour.surfaceMuted, theme.colour.surface]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.95 }}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      />

      {scale > 0 && (
        <View style={{ width: FIGURE_W, height: FIGURE_H, transform: [{ scale }] }}>
          {/* Contact shadow. Small, but it is most of what stops the figure
              looking pasted onto the background. */}
          <View
            style={{
              position: 'absolute',
              left: 58,
              top: 372,
              width: 114,
              height: 11,
              borderRadius: 999,
              backgroundColor: theme.colour.textPrimary,
              opacity: 0.08,
            }}
            pointerEvents="none"
          />

          <Silhouette />

          {PAINT_ORDER.map((layer) => (
            <Worn key={layer} layer={layer} />
          ))}
        </View>
      )}

      <EmptyHint />
    </View>
  );
}

/** Its own subscriber, so the hint appearing never re-renders the figure. */
function EmptyHint() {
  const theme = useTheme();
  const top = useLayer('top');
  const bottom = useLayer('bottom');
  const footwear = useLayer('footwear');
  const outerwear = useLayer('outerwear');

  if (top || bottom || footwear || outerwear) return null;

  return (
    <View style={{ position: 'absolute', bottom: theme.space.lg }}>
      <Text variant="caption" colour="tertiary">
        Pick a piece to dress the figure
      </Text>
    </View>
  );
}
