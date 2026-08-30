import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { Text } from '../src/components/Text';
import { useTheme } from '../src/theme/ThemeProvider';

/**
 * Add a garment.
 *
 * The single most important flow in the product. Wardrobe apps are abandoned
 * when cataloguing feels like a second job — if adding one shirt takes minutes,
 * nobody reaches the point where the app is useful. So this screen is three
 * large targets and nothing else, and each one states how long it takes.
 *
 * Routes map to PROJECT.md F3 (camera / gallery) and F4 (pasted product URL).
 */
export default function AddGarmentScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<'choose' | 'link'>('choose');

  function tap() {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  const routes = [
    {
      icon: 'camera' as const,
      title: 'Take a photo',
      body: 'Lay it flat or hang it up. We remove the background.',
      meta: 'about 10 seconds',
      onPress: () => tap(),
    },
    {
      icon: 'image' as const,
      title: 'Choose from photos',
      body: 'Already have pictures? Add several at once.',
      meta: 'fastest for a big wardrobe',
      onPress: () => tap(),
    },
    {
      icon: 'link' as const,
      title: 'Paste a link',
      body: 'From a shop you bought it at. We read the page.',
      meta: 'no photo needed',
      onPress: () => {
        tap();
        setMode('link');
      },
    },
  ];

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
        <Text variant="title2">{mode === 'link' ? 'Paste a link' : 'Add a piece'}</Text>
        <Pressable
          onPress={() => (mode === 'link' ? setMode('choose') : router.back())}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={mode === 'link' ? 'Back' : 'Close'}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colour.surfaceMuted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather
              name={mode === 'link' ? 'chevron-left' : 'x'}
              size={18}
              color={theme.colour.textSecondary}
            />
          </View>
        </Pressable>
      </View>

      {mode === 'choose' ? (
        <View style={{ paddingHorizontal: theme.layout.gutter, gap: theme.space.md }}>
          {routes.map((route, index) => (
            <MotiView
              key={route.title}
              from={{ opacity: 0, translateY: 14 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: theme.duration.base, delay: index * 60 }}
            >
              <Pressable onPress={route.onPress} accessibilityRole="button">
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.space.base,
                    padding: theme.space.lg,
                    borderRadius: theme.radius.xl,
                    backgroundColor: theme.colour.surface,
                    borderWidth: theme.borderWidth.hairline,
                    borderColor: theme.colour.border,
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: theme.radius.full,
                      backgroundColor: theme.colour.surfaceMuted,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Feather name={route.icon} size={20} color={theme.colour.textPrimary} />
                  </View>

                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="headline">{route.title}</Text>
                    <Text variant="caption" colour="tertiary">
                      {route.body}
                    </Text>
                    {/* Setting the time expectation is the point. Nobody starts
                        a chore they think will take an evening. */}
                    <Text variant="micro" colour="tertiary" style={{ marginTop: 2 }}>
                      {route.meta.toUpperCase()}
                    </Text>
                  </View>

                  <Feather name="chevron-right" size={18} color={theme.colour.textTertiary} />
                </View>
              </Pressable>
            </MotiView>
          ))}

          <View style={{ paddingTop: theme.space.md, alignItems: 'center' }}>
            <Text variant="caption" colour="tertiary" align="center">
              Photos stay yours. Delete any piece, or your whole wardrobe, whenever you like.
            </Text>
          </View>
        </View>
      ) : (
        <View style={{ paddingHorizontal: theme.layout.gutter, gap: theme.space.base }}>
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="https://…"
            placeholderTextColor={theme.colour.textDisabled}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            autoFocus
            style={{
              height: 52,
              borderRadius: theme.radius.lg,
              paddingHorizontal: theme.space.base,
              backgroundColor: theme.colour.surfaceMuted,
              borderWidth: theme.borderWidth.hairline,
              borderColor: theme.colour.border,
              color: theme.colour.textPrimary,
              fontFamily: theme.fontFamily.sans,
              fontSize: 16,
            }}
          />

          <Text variant="caption" colour="tertiary">
            We only ever open the exact page you paste — we never browse a shop on
            your behalf.
          </Text>

          <Button label="Read this page" disabled={url.trim().length === 0} onPress={tap} />
        </View>
      )}
    </View>
  );
}
