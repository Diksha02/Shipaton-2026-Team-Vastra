import Feather from '@expo/vector-icons/Feather';
import { applyCatalogueQuery } from '@vastra/shared';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GarmentTile } from '../src/components/GarmentTile';
import { Text } from '../src/components/Text';
import { catalogue, wardrobe } from '../src/mock/data';
import { useDepartments } from '../src/store/departments';
import { useRecentSearches } from '../src/store/recentSearches';
import { useActiveSizeProfile } from '../src/store/sizeProfile';
import { useTheme } from '../src/theme/ThemeProvider';

/** Starting points for someone who has opened search with nothing in mind. An
 *  empty search box with no suggestions is a dead end. */
const SUGGESTIONS = ['Black jacket', 'Denim', 'Trainers', 'Bag', 'Knit'];

/**
 * Search across the catalogue and your own wardrobe.
 *
 * Both sources on purpose: "where are my black jeans" and "I want black jeans"
 * are the same question typed the same way, and making someone choose a corpus
 * first is a decision the app can make for them.
 *
 * Ranking lives in `@vastra/shared`, unit-tested, so results are identical
 * whether they come from memory now or the API later.
 */
export default function SearchScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [text, setText] = useState('');
  const departments = useDepartments((s) => s.selected);
  const sizeProfile = useActiveSizeProfile();
  const recents = useRecentSearches((s) => s.queries);
  const remember = useRecentSearches((s) => s.remember);
  const clearRecents = useRecentSearches((s) => s.clear);

  const query = text.trim();

  const results = useMemo(() => {
    if (query.length === 0) return [];
    // Catalogue first, then wardrobe: the shop is what someone is usually
    // searching, and their own pieces are a shorter list they can scroll to.
    const all = [...catalogue, ...wardrobe];
    return applyCatalogueQuery(all, {
      text: query,
      departments,
      ...(sizeProfile ? { sizeProfile } : {}),
    });
  }, [query, departments, sizeProfile]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colour.bg, paddingTop: insets.top }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space.sm,
          paddingHorizontal: theme.layout.gutter,
          paddingTop: theme.space.md,
          paddingBottom: theme.space.base,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Feather name="chevron-left" size={22} color={theme.colour.textPrimary} />
        </Pressable>

        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space.sm,
            height: 44,
            paddingHorizontal: theme.space.base,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colour.surfaceMuted,
            borderWidth: theme.borderWidth.hairline,
            borderColor: theme.colour.border,
          }}
        >
          <Feather name="search" size={16} color={theme.colour.textTertiary} />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Search your wardrobe and shops"
            placeholderTextColor={theme.colour.textDisabled}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => remember(query)}
            style={{
              flex: 1,
              color: theme.colour.textPrimary,
              fontFamily: theme.fontFamily.sans,
              fontSize: 15,
            }}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setText('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
              <Feather name="x-circle" size={16} color={theme.colour.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: theme.layout.gutter,
          paddingBottom: theme.space['4xl'],
          gap: theme.space.lg,
        }}
      >
        {query.length === 0 ? (
          <>
            {recents.length > 0 && (
              <View style={{ gap: theme.space.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text variant="overline" colour="tertiary">
                    Recent
                  </Text>
                  <Pressable onPress={clearRecents} hitSlop={10} accessibilityRole="button">
                    <Text variant="caption" colour="tertiary">
                      Clear
                    </Text>
                  </Pressable>
                </View>
                {recents.map((recent) => (
                  <Pressable
                    key={recent}
                    onPress={() => setText(recent)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.md, height: 40 }}
                  >
                    <Feather name="clock" size={15} color={theme.colour.textTertiary} />
                    <Text variant="callout">{recent}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            <View style={{ gap: theme.space.sm }}>
              <Text variant="overline" colour="tertiary">
                Try
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
                {SUGGESTIONS.map((suggestion) => (
                  <Pressable key={suggestion} onPress={() => setText(suggestion)}>
                    <View
                      style={{
                        paddingHorizontal: theme.space.base,
                        height: 34,
                        borderRadius: theme.radius.full,
                        justifyContent: 'center',
                        borderWidth: theme.borderWidth.hairline,
                        borderColor: theme.colour.border,
                      }}
                    >
                      <Text variant="subhead" colour="secondary">
                        {suggestion}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        ) : results.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: theme.space['3xl'], gap: theme.space.sm }}>
            <Feather name="search" size={22} color={theme.colour.textTertiary} />
            <Text variant="headline" align="center">
              Nothing matches “{query}”
            </Text>
            {/* Says what to do about it. A dead end that only reports failure
                leaves someone with nowhere to go but back. */}
            <Text variant="footnote" colour="tertiary" align="center" style={{ maxWidth: 280 }}>
              {departments.length > 0 || sizeProfile
                ? 'Your filters may be narrowing this. Try clearing them, or a shorter search.'
                : 'Try fewer words, or a colour and a category — “black jacket”.'}
            </Text>
          </View>
        ) : (
          <>
            <Text variant="caption" colour="tertiary">
              {results.length} {results.length === 1 ? 'result' : 'results'}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.base }}>
              {results.map((item, index) => (
                <MotiView
                  key={item.id}
                  from={{ opacity: 0, translateY: 8 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: theme.duration.fast, delay: Math.min(index, 8) * 30 }}
                  style={{ width: '48%' }}
                >
                  <GarmentTile
                    item={item}
                    wishlistable
                    onPress={() => {
                      remember(query);
                      router.push(`/item/${item.id}`);
                    }}
                  />
                </MotiView>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

