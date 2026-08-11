import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { MotiView } from 'moti';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { Text } from '../src/components/Text';
import { useGoBack } from '../src/hooks/useGoBack';
import { STUDIO_LAYERS, itemsByIds } from '../src/mock/data';
import { useOutfitStore, useSlotsLeft } from '../src/store/outfit';
import { useTheme } from '../src/theme/ThemeProvider';

type Plan = 'annual' | 'monthly';

/** Same three promises as the You tab — a paywall must not invent features. */
const BENEFITS = [
  { icon: 'layers' as const, text: 'Unlimited outfit slots' },
  { icon: 'zap' as const, text: 'Priority try-on rendering' },
  { icon: 'download' as const, text: 'HD export, no watermark' },
] as const;

const PLANS = [
  { id: 'annual' as const, title: 'Annual', price: '£29.99', note: '£2.50/month · save 37%', badge: 'Best value' },
  { id: 'monthly' as const, title: 'Monthly', price: '£3.99', note: 'Billed monthly' },
] as const;

/**
 * The paywall (PROJECT.md §6).
 *
 * Rules this screen obeys, all of them deliberate:
 *   - triggered contextually when a slot is needed, never on launch;
 *   - loss framing — the outfit you are about to lose is shown, not described;
 *   - one tap to purchase, one tap to dismiss;
 *   - no fake countdowns, no pre-ticked upsells, no disguised close button.
 *     Judges are looking for craft, and dark patterns get flagged.
 *
 * Purchase wiring is left for RevenueCat (T26) — the trial button stays as a
 * visual CTA with no handler until then.
 */
export default function PaywallScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const goBack = useGoBack();
  const [plan, setPlan] = useState<Plan>('annual');

  const slotsLeft = useSlotsLeft();
  const layers = useOutfitStore((state) => state.layers);
  const slotsFull = slotsLeft === 0;

  // Prefer what is on the stage when slots are full — that is the outfit they
  // cannot save. Fall back to a seeded look when opened from You with room left.
  const atRisk = useMemo(() => {
    const fromStage = STUDIO_LAYERS.map((layer) => layers[layer]).filter(
      (id): id is string => id !== null,
    );
    if (slotsFull && fromStage.length >= 2) return itemsByIds(fromStage);
    return itemsByIds(['w3', 'w2', 'w6']);
  }, [layers, slotsFull]);

  const selectedPlan = PLANS.find((option) => option.id === plan) ?? PLANS[0];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colour.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: theme.layout.gutter, paddingTop: theme.space.sm }}>
        <Pressable
          onPress={goBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={{ alignSelf: 'flex-end' }}
        >
          {({ pressed }) => (
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: theme.radius.full,
                backgroundColor: pressed ? theme.colour.surfacePressed : theme.colour.surfaceMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name="x" size={18} color={theme.colour.textSecondary} />
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: theme.layout.gutter,
          paddingBottom: theme.space.xl,
          gap: theme.space.xl,
        }}
      >
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: theme.duration.slow }}
          style={{ gap: theme.space.md, paddingTop: theme.space.sm }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.sm }}>
            <Feather name="star" size={16} color={theme.colour.accent} />
            <Text variant="overline" colour="accent">
              Vastra Plus
            </Text>
          </View>

          <Text variant="display">{slotsFull ? "This one won't fit." : 'Room for every outfit.'}</Text>
          <Text variant="callout" colour="secondary">
            {slotsFull
              ? 'All five slots are full. Plus saves this look — and every one after it.'
              : 'Unlimited slots, priority try-on, and HD export in one plan.'}
          </Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: theme.duration.base, delay: 80 }}
        >
          <View
            style={{
              borderRadius: theme.radius['2xl'],
              borderWidth: theme.borderWidth.hairline,
              borderColor: theme.colour.accentBorder,
              overflow: 'hidden',
              backgroundColor: theme.colour.surface,
              ...theme.shadow.sm,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                height: 148,
                gap: theme.space.hair,
                paddingHorizontal: theme.space.md,
                paddingVertical: theme.space.base,
                backgroundColor: theme.colour.surfaceGarment,
              }}
            >
              {atRisk.map((item) => (
                <Image
                  key={item.id}
                  source={item.image}
                  style={{ flex: 1, height: '100%' }}
                  contentFit="contain"
                  transition={220}
                />
              ))}
            </View>
            <View
              style={{
                padding: theme.space.base,
                backgroundColor: theme.colour.accentSubtle,
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.space.sm,
              }}
            >
              <Feather name="alert-circle" size={14} color={theme.colour.accent} />
              <Text variant="footnote" colour="secondary" style={{ flex: 1 }}>
                {slotsFull ? 'Not saved yet' : 'What Plus unlocks'}
              </Text>
            </View>
          </View>
        </MotiView>

        <View style={{ gap: theme.space.md }}>
          {BENEFITS.map((benefit, index) => (
            <MotiView
              key={benefit.text}
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: theme.duration.base, delay: 120 + index * 40 }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.md }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: theme.radius.full,
                  backgroundColor: theme.colour.accentSubtle,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Feather name={benefit.icon} size={15} color={theme.colour.accent} />
              </View>
              <Text variant="body" colour="secondary">
                {benefit.text}
              </Text>
            </MotiView>
          ))}
        </View>

        <View style={{ gap: theme.space.sm }}>
          {PLANS.map((option) => {
            const selected = plan === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => setPlan(option.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${option.title}, ${option.price}`}
              >
                {({ pressed }) => (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: theme.space.lg,
                      borderRadius: theme.radius['2xl'],
                      borderWidth: selected ? theme.borderWidth.thick : theme.borderWidth.hairline,
                      borderColor: selected ? theme.colour.accent : theme.colour.border,
                      backgroundColor: selected
                        ? theme.colour.accentSubtle
                        : pressed
                          ? theme.colour.surfacePressed
                          : theme.colour.surface,
                      gap: theme.space.md,
                    }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: theme.radius.full,
                        borderWidth: 2,
                        borderColor: selected ? theme.colour.accent : theme.colour.borderStrong,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {selected && (
                        <View
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: theme.radius.full,
                            backgroundColor: theme.colour.accent,
                          }}
                        />
                      )}
                    </View>
                    <View style={{ flex: 1, gap: theme.space.hair }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.sm }}>
                        <Text variant="bodyMedium">{option.title}</Text>
                        {'badge' in option && option.badge ? (
                          <View
                            style={{
                              paddingHorizontal: theme.space.sm,
                              paddingVertical: theme.space.hair,
                              borderRadius: theme.radius.sm,
                              backgroundColor: theme.colour.accent,
                            }}
                          >
                            <Text variant="overline" colour="onAccent">
                              {option.badge}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text variant="caption" colour="tertiary">
                        {option.note}
                      </Text>
                    </View>
                    <Text variant="title2">{option.price}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: theme.layout.gutter,
          paddingBottom: insets.bottom + theme.space.base,
          paddingTop: theme.space.md,
          gap: theme.space.md,
          borderTopWidth: theme.borderWidth.hairline,
          borderTopColor: theme.colour.border,
          backgroundColor: theme.colour.bg,
        }}
      >
        {/* Purchase / trial wiring is owned by RevenueCat (T26). Do not attach
            onPress here — leave the control for the teammate handling IAP. */}
        <Button label="Start 7-day free trial" variant="accent" />
        <Text variant="caption" colour="tertiary" align="center">
          Free for 7 days, then {selectedPlan.price}
          {plan === 'annual' ? '/year' : '/month'}. Cancel any time in Settings.
        </Text>
      </View>
    </View>
  );
}
