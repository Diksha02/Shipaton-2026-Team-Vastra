import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { Text } from '../src/components/Text';
import { COLOUR_SWATCH, STUDIO_LAYERS, wardrobe, type StudioLayer } from '../src/mock/data';
import { usePosts } from '../src/store/posts';
import { useOutfitStore } from '../src/store/outfit';
import { useSavedOutfits } from '../src/store/savedOutfits';
import { useTheme } from '../src/theme/ThemeProvider';

type Choice =
  | { kind: 'photo'; uri: string }
  | { kind: 'outfit'; id: string }
  | null;

/**
 * Compose a post.
 *
 * Two routes, because people arrive with two different things: a photo they
 * just took, or an outfit they already built here. Both end in the same feed.
 */
export default function NewPostScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const savedOutfits = useSavedOutfits((s) => s.outfits);
  const addPost = usePosts((s) => s.add);

  const [choice, setChoice] = useState<Choice>(null);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);

  function tap() {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function pick(from: 'camera' | 'library') {
    tap();
    setBusy(true);
    try {
      // Permissions are requested at the moment of use, never at launch — a
      // permission prompt before someone knows why is the fastest way to a no.
      const permission =
        from === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          from === 'camera' ? 'Camera access needed' : 'Photo access needed',
          'You can change this any time in Settings.',
        );
        return;
      }

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.85,
      };

      const result =
        from === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);

      const asset = result.canceled ? null : result.assets[0];
      if (asset) setChoice({ kind: 'photo', uri: asset.uri });
    } finally {
      setBusy(false);
    }
  }

  function publish() {
    if (!choice) return;
    tap();

    if (choice.kind === 'photo') {
      addPost({ imageUri: choice.uri, layers: null, caption, source: 'photo' });
    } else {
      const outfit = savedOutfits.find((o) => o.id === choice.id);
      addPost({
        imageUri: null,
        layers: outfit?.layers ?? useOutfitStore.getState().layers,
        caption,
        source: 'outfit',
      });
    }

    // Replace rather than push: coming "back" to a composer you already
    // submitted is confusing.
    router.replace('/looks');
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
        <Text variant="title2">Post an outfit</Text>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
          <Feather name="x" size={20} color={theme.colour.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: theme.layout.gutter, paddingBottom: theme.space['4xl'], gap: theme.space.lg }}
      >
        {choice?.kind === 'photo' ? (
          <View style={{ gap: theme.space.sm }}>
            <View
              style={{
                aspectRatio: 3 / 4,
                borderRadius: theme.radius.xl,
                overflow: 'hidden',
                backgroundColor: theme.colour.surfaceGarment,
              }}
            >
              <Image source={{ uri: choice.uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            </View>
            <Pressable onPress={() => setChoice(null)} hitSlop={8}>
              <Text variant="subhead" colour="tertiary" align="center">
                Choose something else
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={{ flexDirection: 'row', gap: theme.space.md }}>
              <SourceButton icon="camera" label="Take a photo" onPress={() => void pick('camera')} disabled={busy} />
              <SourceButton icon="image" label="From photos" onPress={() => void pick('library')} disabled={busy} />
            </View>

            {savedOutfits.length > 0 && (
              <View style={{ gap: theme.space.md }}>
                <Text variant="overline" colour="tertiary">
                  Or post an outfit you built
                </Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: theme.space.md }}>
                  {savedOutfits.map((outfit) => {
                    const selected = choice?.kind === 'outfit' && choice.id === outfit.id;
                    const colours = STUDIO_LAYERS.map((layer: StudioLayer) => {
                      const id = outfit.layers[layer];
                      const item = id ? wardrobe.find((w) => w.id === id) : undefined;
                      return item ? COLOUR_SWATCH[item.colour] : null;
                    }).filter((c): c is string => c !== null);

                    return (
                      <Pressable key={outfit.id} onPress={() => setChoice({ kind: 'outfit', id: outfit.id })}>
                        <MotiView animate={{ scale: selected ? 1 : 0.96 }} transition={{ type: 'spring', ...theme.spring.responsive }}>
                          <View style={{ width: 108, gap: theme.space.xs }}>
                            <View
                              style={{
                                height: 144,
                                borderRadius: theme.radius.lg,
                                overflow: 'hidden',
                                flexDirection: 'row',
                                gap: 2,
                                padding: 2,
                                backgroundColor: theme.colour.surfaceGarment,
                                borderWidth: selected ? theme.borderWidth.thick : theme.borderWidth.hairline,
                                borderColor: selected ? theme.colour.actionPrimary : theme.colour.border,
                              }}
                            >
                              {colours.map((colour, index) => (
                                <View key={index} style={{ flex: 1, backgroundColor: colour, borderRadius: theme.radius.sm }} />
                              ))}
                            </View>
                            <Text variant="caption" numberOfLines={1} align="center">
                              {outfit.name}
                            </Text>
                          </View>
                        </MotiView>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </>
        )}

        <View style={{ gap: theme.space.sm }}>
          <Text variant="overline" colour="tertiary">
            Caption
          </Text>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Layered for the cold snap"
            placeholderTextColor={theme.colour.textDisabled}
            maxLength={140}
            multiline
            style={{
              minHeight: 76,
              borderRadius: theme.radius.lg,
              padding: theme.space.base,
              backgroundColor: theme.colour.surfaceMuted,
              borderWidth: theme.borderWidth.hairline,
              borderColor: theme.colour.border,
              color: theme.colour.textPrimary,
              fontFamily: theme.fontFamily.sans,
              fontSize: 16,
              textAlignVertical: 'top',
            }}
          />
        </View>

        <View style={{ gap: theme.space.sm }}>
          <Button label="Post" disabled={!choice} onPress={publish} />
          <Text variant="caption" colour="tertiary" align="center">
            Posts are checked before they appear. Anything that breaks the rules
            is removed, and you can delete your own posts at any time.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function SourceButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  disabled: boolean;
}) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} disabled={disabled} style={{ flex: 1 }} accessibilityRole="button" accessibilityLabel={label}>
      <View
        style={{
          height: 108,
          borderRadius: theme.radius.xl,
          borderWidth: theme.borderWidth.hairline,
          borderColor: theme.colour.border,
          backgroundColor: theme.colour.surface,
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.space.sm,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Feather name={icon} size={22} color={theme.colour.textPrimary} />
        <Text variant="subhead">{label}</Text>
      </View>
    </Pressable>
  );
}
