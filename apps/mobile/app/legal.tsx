import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { Text } from '../src/components/Text';
import {
  LEGAL_INTRO,
  PRIVACY_BLOCKS,
  TERMS_BLOCKS,
  type LegalBlock,
} from '../src/legal/content';
import { useTheme } from '../src/theme/ThemeProvider';

function Block({ block }: { block: LegalBlock }) {
  const theme = useTheme();
  return (
    <View nativeID={block.id} style={{ gap: theme.space.sm, marginBottom: theme.space.xl }}>
      <Text variant="headline">{block.heading}</Text>
      {block.paragraphs.map((p) => (
        <Text key={p.slice(0, 48)} variant="callout" colour="secondary" style={{ lineHeight: 22 }}>
          {p}
        </Text>
      ))}
      {block.bullets?.map((b) => (
        <View key={b} style={{ flexDirection: 'row', gap: theme.space.sm, paddingLeft: 2 }}>
          <Text variant="callout" colour="tertiary">
            ·
          </Text>
          <Text variant="callout" colour="secondary" style={{ flex: 1, lineHeight: 22 }}>
            {b}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * In-app Terms & Privacy. Opened from the sign-in footer links. Agreement is
 * collected at the end of this screen only — sign-in UI is unchanged.
 */
export default function LegalScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [checked, setChecked] = useState(false);

  function leave() {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colour.bg }}>
      <View
        style={{
          paddingTop: insets.top + theme.space.sm,
          paddingHorizontal: theme.layout.gutter,
          paddingBottom: theme.space.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: theme.borderWidth.hairline,
          borderBottomColor: theme.colour.border,
        }}
      >
        <Pressable
          onPress={leave}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={{ width: 40, height: 40, justifyContent: 'center' }}
        >
          <Feather name="x" size={22} color={theme.colour.textTertiary} />
        </Pressable>
        <Text variant="headline">Terms & Privacy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.layout.gutter,
          paddingTop: theme.space.xl,
          paddingBottom: theme.space['2xl'],
        }}
      >
        <Text variant="overline" colour="tertiary" style={{ marginBottom: theme.space.sm }}>
          वस्त्र · Vastra
        </Text>
        <Text variant="title1" style={{ marginBottom: theme.space.sm }}>
          {LEGAL_INTRO.title}
        </Text>
        <Text variant="footnote" colour="tertiary" style={{ marginBottom: theme.space.base }}>
          {LEGAL_INTRO.updated}
        </Text>
        <Text
          variant="callout"
          colour="secondary"
          style={{ lineHeight: 22, marginBottom: theme.space['2xl'] }}
        >
          {LEGAL_INTRO.creators}
        </Text>

        {TERMS_BLOCKS.map((block) => (
          <Block key={block.heading} block={block} />
        ))}

        {PRIVACY_BLOCKS.map((block) => (
          <Block key={block.heading} block={block} />
        ))}

        <View
          style={{
            marginTop: theme.space.md,
            paddingTop: theme.space.xl,
            borderTopWidth: theme.borderWidth.hairline,
            borderTopColor: theme.colour.border,
            gap: theme.space.base,
          }}
        >
          <Pressable
            onPress={() => setChecked((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            accessibilityLabel="I have read and agree to the Terms of Service and Privacy Policy"
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.space.md }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                marginTop: 1,
                borderRadius: theme.radius.sm,
                borderWidth: theme.borderWidth.thick,
                borderColor: checked ? theme.colour.actionPrimary : theme.colour.borderStrong,
                backgroundColor: checked ? theme.colour.actionPrimary : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {checked ? (
                <Feather name="check" size={14} color={theme.colour.textOnAction} />
              ) : null}
            </View>
            <Text variant="callout" colour="secondary" style={{ flex: 1, lineHeight: 22 }}>
              I have read and agree to the Terms of Service and Privacy Policy.
            </Text>
          </Pressable>

          <Button label="Done" onPress={leave} disabled={!checked} />
        </View>
      </ScrollView>
    </View>
  );
}
