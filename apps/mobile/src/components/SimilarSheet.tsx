import Feather from '@expo/vector-icons/Feather';
import { MotiView } from 'moti';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLOUR_SWATCH, formatPrice } from '../mock/data';
import { findSimilar, matchLabel, type SimilarItem } from '../search/similar';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

export interface SimilarSheetProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
}

/**
 * "Shop this look".
 *
 * The commercial heart of the feed: see an outfit, find what's close, buy it.
 * Results carry real prices and open the retailer directly, which is the
 * two-taps-to-buy promise in F10.
 */
export function SimilarSheet({ visible, imageUri, onClose }: SimilarSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SimilarItem[]>([]);
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    setLoading(true);
    setReason(null);

    void findSimilar(imageUri).then((result) => {
      if (cancelled) return;
      setItems(result.items);
      setReason(result.ok ? null : (result.reason ?? 'Could not search right now.'));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [visible, imageUri]);

  if (!visible) return null;

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: theme.duration.fast }}
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: theme.colour.scrim,
        justifyContent: 'flex-end',
        zIndex: 60,
      }}
    >
      <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" />

      <MotiView
        from={{ translateY: 40 }}
        animate={{ translateY: 0 }}
        transition={{ type: 'spring', ...theme.spring.gentle }}
        style={{
          backgroundColor: theme.colour.bg,
          borderTopLeftRadius: theme.radius['2xl'],
          borderTopRightRadius: theme.radius['2xl'],
          paddingTop: theme.space.lg,
          paddingBottom: insets.bottom + theme.space.lg,
          maxHeight: '72%',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: theme.layout.gutter,
            marginBottom: theme.space.base,
          }}
        >
          <View>
            <Text variant="title2">Shop this look</Text>
            <Text variant="caption" colour="tertiary">
              Closest pieces we can find
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
            <Feather name="x" size={20} color={theme.colour.textSecondary} />
          </Pressable>
        </View>

        {loading ? (
          <View style={{ paddingVertical: theme.space['4xl'], alignItems: 'center', gap: theme.space.md }}>
            <ActivityIndicator color={theme.colour.textSecondary} />
            <Text variant="caption" colour="tertiary">
              Looking for matches…
            </Text>
          </View>
        ) : reason ? (
          <View style={{ paddingHorizontal: theme.layout.gutter, paddingVertical: theme.space.xl, gap: theme.space.sm }}>
            <Text variant="headline">Couldn&apos;t search</Text>
            <Text variant="callout" colour="tertiary">
              {reason}
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: theme.layout.gutter, gap: theme.space.md }}
          >
            {items.map(({ item, score, retailerUrl }) => (
              <Pressable
                key={item.id}
                onPress={() => retailerUrl && void Linking.openURL(retailerUrl)}
                accessibilityRole="link"
                accessibilityLabel={`${item.title} at ${item.brand}`}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.space.base,
                    padding: theme.space.md,
                    borderRadius: theme.radius.lg,
                    borderWidth: theme.borderWidth.hairline,
                    borderColor: theme.colour.border,
                    backgroundColor: theme.colour.surface,
                  }}
                >
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: theme.radius.md,
                      backgroundColor: COLOUR_SWATCH[item.colour],
                      borderWidth: theme.borderWidth.hairline,
                      borderColor: theme.colour.border,
                    }}
                  />

                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="overline" colour="tertiary">
                      {item.brand}
                    </Text>
                    <Text variant="subhead" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text variant="caption" colour="secondary">
                      {formatPrice(item.priceMinor, item.currency)} · {matchLabel(score)}
                    </Text>
                  </View>

                  <Feather name="external-link" size={16} color={theme.colour.textTertiary} />
                </View>
              </Pressable>
            ))}

            {/* Honest about what this is. Affiliate disclosure is a legal
                requirement in most markets once links start earning. */}
            <Text variant="caption" colour="tertiary" align="center" style={{ paddingTop: theme.space.sm }}>
              Matches are suggestions, not exact items. Links open the retailer.
            </Text>
          </ScrollView>
        )}
      </MotiView>
    </MotiView>
  );
}
