import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
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
 * Three steps, and the last one *does* something.
 *
 * Two findings shaped this. Reaching a first meaningful action inside about a
 * minute roughly doubles seven-day retention, and three to five screens is the
 * ceiling before completion falls off measurably. The earlier version cleared
 * the second but failed the first: it ended on "Let's go", which dismissed onto
 * a browse screen, so someone finished onboarding having *read* three slides and
 * done nothing.
 *
 * Now the final button opens the Studio, where the figure is already wearing
 * something. That is this app's "aha", it costs one tap, and it needs no camera
 * permission and no photography before it pays off.
 *
 * Copy is written as things you can do, not as a feature list, and kept short —
 * every sentence here is a sentence between someone and the product.
 */
const STEPS: Step[] = [
  {
    icon: 'plus-circle',
    title: 'Add what you own',
    body: 'Photograph a piece, or paste a shop link. It gets tagged for you.',
  },
  {
    icon: 'sliders',
    title: 'See it on',
    body: 'Pick a category and swipe. The figure wears whatever you choose.',
  },
  {
    icon: 'heart',
    title: 'Keep the ones that work',
    body: 'One permanent space you can reuse forever, plus four single-use saves. Deleting is always free.',
  },
];

export function Walkthrough() {
  const theme = useTheme();
  const router = useRouter();
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

        {/* One action per step, never a choice between two. Reducing the number
            of *decisions* matters more than reducing the number of taps. */}
        <Button
          label={isLast ? 'Build your first outfit' : 'Next'}
          onPress={() => {
            if (!isLast) {
              setStep((s) => s + 1);
              return;
            }
            complete();
            router.push('/(tabs)/studio');
          }}
        />
      </MotiView>
    </MotiView>
  );
}
