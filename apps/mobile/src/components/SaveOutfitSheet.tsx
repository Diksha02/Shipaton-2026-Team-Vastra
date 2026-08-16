import Feather from '@expo/vector-icons/Feather';
import { MotiView } from 'moti';
import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SlotKind } from '../store/savedOutfits';
import { useTheme } from '../theme/ThemeProvider';
import { Button } from './Button';
import { Text } from './Text';

export interface SaveOutfitSheetProps {
  visible: boolean;
  /** Suggested name, so the field is never empty on open. */
  suggestion: string;
  /** Which space this save will take. Null means there is none. */
  nextSlot: SlotKind | null;
  /** Single-use saves remaining *before* this one. */
  creditsLeft: number;
  /** Pro: no ceiling, so no cost to disclose. */
  unlimited: boolean;
  onCancel: () => void;
  onSave: (name: string) => void;
}

/**
 * Naming an outfit before it is saved.
 *
 * A saved outfit you cannot tell apart from four others is not really saved.
 * The field is pre-filled so the fast path is one tap, and editable so the
 * careful path costs nothing extra.
 *
 * This sheet is also the disclosure point for single-use saves. Someone must
 * know a credit is about to be spent *while they can still back out* — the cost
 * is stated on the button itself, not buried in grey text underneath it.
 */
export function SaveOutfitSheet({
  visible,
  suggestion,
  nextSlot,
  creditsLeft,
  unlimited,
  onCancel,
  onSave,
}: SaveOutfitSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(suggestion);

  // Re-seed each time it opens, or yesterday's name persists into today's outfit.
  useEffect(() => {
    if (visible) setName(suggestion);
  }, [visible, suggestion]);

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
        zIndex: 50,
      }}
    >
      <Pressable style={{ flex: 1 }} onPress={onCancel} accessibilityLabel="Cancel" />

      <MotiView
        from={{ translateY: 30 }}
        animate={{ translateY: 0 }}
        transition={{ type: 'spring', ...theme.spring.gentle }}
        style={{
          backgroundColor: theme.colour.bg,
          borderTopLeftRadius: theme.radius['2xl'],
          borderTopRightRadius: theme.radius['2xl'],
          padding: theme.space.xl,
          paddingBottom: insets.bottom + theme.space.xl,
          gap: theme.space.base,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="title2">Name this outfit</Text>
          <Pressable onPress={onCancel} hitSlop={12} accessibilityRole="button" accessibilityLabel="Cancel">
            <Feather name="x" size={20} color={theme.colour.textSecondary} />
          </Pressable>
        </View>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Monday, office"
          placeholderTextColor={theme.colour.textDisabled}
          autoFocus
          maxLength={60}
          returnKeyType="done"
          onSubmitEditing={() => onSave(name)}
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

        {/* Stated before the button, never after it. */}
        {nextSlot === 'single_use' && !unlimited && (
          <View
            style={{
              flexDirection: 'row',
              gap: theme.space.md,
              padding: theme.space.base,
              borderRadius: theme.radius.lg,
              backgroundColor: theme.colour.surfaceMuted,
              borderWidth: theme.borderWidth.hairline,
              borderColor: theme.colour.border,
            }}
          >
            <Feather name="info" size={16} color={theme.colour.textSecondary} />
            <Text variant="footnote" colour="secondary" style={{ flex: 1 }}>
              This uses one of your {creditsLeft} single-use saves. You can delete it whenever you
              like — but the space won&apos;t come back.
            </Text>
          </View>
        )}

        <Button
          label={
            nextSlot === 'single_use' && !unlimited ? 'Use a single-use save' : 'Save outfit'
          }
          onPress={() => onSave(name)}
        />

        <Text variant="caption" colour="tertiary" align="center">
          {unlimited
            ? 'Unlimited spaces with Pro.'
            : nextSlot === 'reusable'
              ? 'This goes in your permanent space. Delete and re-save it as often as you like.'
              : `${creditsLeft} single-use ${creditsLeft === 1 ? 'save' : 'saves'} left.`}
        </Text>
      </MotiView>
    </MotiView>
  );
}
