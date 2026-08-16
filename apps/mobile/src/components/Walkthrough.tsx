import Feather from '@expo/vector-icons/Feather';
import { MotiView } from 'moti';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingStore, useShouldShowWalkthrough } from '../store/onboarding';
import { useTheme } from '../theme/ThemeProvider';
import { Button } from './Button';
import { Text } from './Text';

interface Step {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  body: string;
}

/**
 * Three steps, no more.
 *
 * Research on this app category is blunt about it: the slower the onboarding,
 * the more likely someone abandons the app before they have catalogued enough
 * clothes for it to be useful. So this explains only what is not discoverable
 * by tapping — and it is skippable from the first frame.
 */
const STEPS: Step[] = [
  {
    icon: 'plus-circle',
    title: 'Add what you own',
    body: 'Photograph a piece, or paste a link from a shop. It gets tagged for you — takes a few seconds each.',
  },
  {
    icon: 'sliders',
    title: 'Build an outfit',
    body: 'Pick a category, then swipe to choose. The figure wears whatever you pick, so you can see it come together.',
  },
  {
    icon: 'heart',
    title: 'Save the ones you like',
    body: 'Five spaces free. Saved outfits stay exactly as you made them, and you can delete any of them any time.',
  },
];

export function Walkthrough() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const shouldShow = useShouldShowWalkthrough();
  const complete = useOnboardingStore((s) => s.complete);
  const [step, setStep] = useState(0);

  if (!shouldShow) return null;

  const current = STEPS[step];
  if (!current) return null;

  const isLast = step === STEPS.length - 1;

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: theme.duration.base }}
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: theme.colour.scrim,
        justifyContent: 'flex-end',
        zIndex: 100,
      }}
    >
      <MotiView
        from={{ translateY: 40 }}
        animate={{ translateY: 0 }}
        transition={{ type: 'spring', ...theme.spring.gentle }}
        style={{
          backgroundColor: theme.colour.bg,
          borderTopLeftRadius: theme.radius['2xl'],
          borderTopRightRadius: theme.radius['2xl'],
          padding: theme.space.xl,
          paddingBottom: insets.bottom + theme.space.xl,
          gap: theme.space.lg,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Progress as dots, and a skip that is available immediately —
              never delayed, never hidden. */}
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {STEPS.map((s, index) => (
              <View
                key={s.title}
                style={{
                  width: index === step ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor:
                    index === step ? theme.colour.actionPrimary : theme.colour.borderStrong,
                }}
              />
            ))}
          </View>

          <Pressable onPress={complete} hitSlop={12} accessibilityRole="button">
            <Text variant="subhead" colour="tertiary">
              Skip
            </Text>
          </Pressable>
        </View>

        <MotiView
          key={current.title}
          from={{ opacity: 0, translateX: 16 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'timing', duration: theme.duration.base }}
          style={{ gap: theme.space.md, minHeight: 150 }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colour.surfaceMuted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name={current.icon} size={20} color={theme.colour.textPrimary} />
          </View>

          <Text variant="title2">{current.title}</Text>
          <Text variant="callout" colour="secondary">
            {current.body}
          </Text>
        </MotiView>

        <Button
          label={isLast ? "Let's go" : 'Next'}
          onPress={() => (isLast ? complete() : setStep((s) => s + 1))}
        />
      </MotiView>
    </MotiView>
  );
}
