import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

export interface LockedSectionProps {
  title: string;
  blurb: string;
  /** The illustrative preview. Rendered at reduced opacity so it reads as a
   *  glimpse of something coming, not as broken content. */
  preview?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * A locked feature (PROJECT.md §2.2).
 *
 * Hard rule: a locked tile never presents a Buy or Unlock CTA. Selling access
 * to unbuilt functionality is a store-rejection and refund risk. The only
 * action is Notify me, which sets a OneSignal `interest_<feature>` tag.
 */
export function LockedSection({ title, blurb, preview, style }: LockedSectionProps) {
  const theme = useTheme();
  const [notified, setNotified] = useState(false);

  return (
    <View
      style={[
        {
          borderRadius: theme.radius.xl,
          borderWidth: theme.borderWidth.hairline,
          borderColor: theme.colour.border,
          backgroundColor: theme.colour.surface,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {!!preview && (
        <View style={{ opacity: 0.45 }} pointerEvents="none">
          {preview}
        </View>
      )}

      <View style={{ padding: theme.space.base, gap: theme.space.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.sm }}>
          <Text variant="headline" style={{ flex: 1 }}>
            {title}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: theme.space.sm,
              paddingVertical: 3,
              borderRadius: theme.radius.sm,
              backgroundColor: theme.colour.surfaceMuted,
            }}
          >
            <Feather name="clock" size={10} color={theme.colour.textTertiary} />
            <Text variant="overline" colour="tertiary">
              Soon
            </Text>
          </View>
        </View>

        <Text variant="footnote" colour="tertiary">
          {blurb}
        </Text>

        <Pressable
          onPress={() => setNotified(true)}
          disabled={notified}
          style={{ alignSelf: 'flex-start', paddingTop: theme.space.xs }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.xs }}>
            <Feather
              name={notified ? 'check' : 'bell'}
              size={13}
              color={notified ? theme.colour.textTertiary : theme.colour.textSecondary}
            />
            <Text variant="subhead" colour={notified ? 'tertiary' : 'secondary'}>
              {notified ? "We'll tell you" : 'Notify me'}
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}
