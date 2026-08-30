import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { memo, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { COLOUR_SWATCH, wardrobe, type MockItem, type StudioLayer } from '../mock/data';
import { useLayer } from '../store/outfit';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

/**
 * The figure is drawn at a fixed design size and scaled to whatever space the
 * stage has, so it is never clipped regardless of screen height.
 */
const FIGURE_W = 230;
const FIGURE_H = 400;

interface Part {
  left: number;
  top: number;
  width: number;
  height: number;
  radius: number;
}

/**
 * Body regions, in design-space pixels.
 *
 * INTERIM RENDERING. Garments are shown as colour on the body rather than as
 * photographs. Flat product shots pasted onto a figure read as collage, not as
 * clothing — the proportions are wrong, the lighting is wrong, and a folded
 * flat-lay never looks worn.
 *
 * Colour keeps the thing that actually matters when composing an outfit: does
 * this combination work together. Replaced by real draped renders when the
 * dedicated outfit API lands.
 */
const PARTS: Record<StudioLayer, Part[]> = {
  top: [
    { left: 72, top: 62, width: 86, height: 108, radius: 22 }, // torso
    { left: 46, top: 66, width: 24, height: 92, radius: 12 }, // left sleeve
    { left: 160, top: 66, width: 24, height: 92, radius: 12 }, // right sleeve
  ],
  outerwear: [
    { left: 36, top: 58, width: 30, height: 132, radius: 14 }, // open left panel
    { left: 164, top: 58, width: 30, height: 132, radius: 14 }, // open right panel
  ],
  bottom: [
    { left: 78, top: 170, width: 74, height: 30, radius: 12 }, // hips
    { left: 82, top: 196, width: 28, height: 132, radius: 13 }, // left leg
    { left: 120, top: 196, width: 28, height: 132, radius: 13 }, // right leg
  ],
  footwear: [
    { left: 74, top: 328, width: 40, height: 22, radius: 10 },
    { left: 116, top: 328, width: 40, height: 22, radius: 10 },
  ],
  headwear: [{ left: 88, top: 6, width: 54, height: 22, radius: 11 }],
  accessory: [{ left: 100, top: 52, width: 30, height: 12, radius: 6 }],
  bag: [{ left: 176, top: 150, width: 26, height: 34, radius: 8 }],
};

/** Painted back to front: a coat sits over a top, accessories over everything. */
const PAINT_ORDER: StudioLayer[] = [
  'bottom',
  'top',
  'outerwear',
  'footwear',
  'bag',
  'headwear',
  'accessory',
];

/** The bare body, where no garment covers it. */
const SKIN: Part[] = [
  { left: 92, top: 10, width: 46, height: 46, radius: 23 }, // head
  { left: 106, top: 48, width: 18, height: 22, radius: 7 }, // neck
  { left: 74, top: 64, width: 82, height: 104, radius: 22 }, // torso
  { left: 48, top: 68, width: 20, height: 88, radius: 10 }, // arms
  { left: 162, top: 68, width: 20, height: 88, radius: 10 },
  { left: 80, top: 168, width: 70, height: 26, radius: 12 }, // hips
  { left: 84, top: 190, width: 24, height: 140, radius: 12 }, // legs
  { left: 122, top: 190, width: 24, height: 140, radius: 12 },
];

function useItem(layer: StudioLayer): MockItem | null {
  const id = useLayer(layer);
  return id ? (wardrobe.find((candidate) => candidate.id === id) ?? null) : null;
}

/**
 * One garment, as colour on the body.
 *
 * Subscribes to its own layer and is memoised, so changing the shoes re-renders
 * the shoes and nothing else.
 */
const Worn = memo(function Worn({ layer }: { layer: StudioLayer }) {
  const theme = useTheme();
  const item = useItem(layer);

  if (!item) return null;

  const colour = COLOUR_SWATCH[item.colour];

  return (
    <>
      {PARTS[layer].map((part, index) => (
        <MotiView
          // Keyed on the garment so a swap replays the entrance — that swap is
          // the moment the whole screen exists to produce.
          key={`${item.id}-${index}`}
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', ...theme.spring.responsive }}
          style={{
            position: 'absolute',
            left: part.left,
            top: part.top,
            width: part.width,
            height: part.height,
            borderRadius: part.radius,
            backgroundColor: colour,
            // A hairline is what keeps a white garment legible on a light stage
            // and a black one on a dark stage. It was using `border`, which is
            // so close to the surface that a white sweatshirt vanished entirely
            // — the figure read as half-dressed. `borderStrong` is the token
            // that actually separates.
            borderWidth: theme.borderWidth.hairline,
            borderColor: theme.colour.borderStrong,
          }}
          pointerEvents="none"
        />
      ))}
    </>
  );
});

/** The body underneath. Deliberately faint: it is nobody, and seeing yourself
 *  in an outfit is what Try-On is for. */
function Silhouette() {
  const theme = useTheme();

  return (
    <>
      {SKIN.map((part, index) => (
        <View
          key={index}
          style={{
            position: 'absolute',
            left: part.left,
            top: part.top,
            width: part.width,
            height: part.height,
            borderRadius: part.radius,
            backgroundColor: theme.colour.surfaceMuted,
          }}
          pointerEvents="none"
        />
      ))}
    </>
  );
}

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
        // `surfaceGarment`, not `surface`. It exists precisely so clothes read
        // against the ground: light mode needs a deeper stage so a white shirt
        // shows, dark mode a lighter one so a black jacket does. The stage was
        // using plain `surface` (#FFFFFF in light), against which a white
        // garment is invisible.
        backgroundColor: theme.colour.surfaceGarment,
      }}
    >
      <LinearGradient
        colors={[theme.colour.surfaceGarment, theme.colour.surfacePressed]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.95 }}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      />

      {scale > 0 && (
        <View style={{ width: FIGURE_W, height: FIGURE_H, transform: [{ scale }] }}>
          {/* Contact shadow — most of what stops the figure looking pasted on. */}
          <View
            style={{
              position: 'absolute',
              left: 58,
              top: 356,
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
