import Feather from '@expo/vector-icons/Feather';
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { Walkthrough } from '../../src/components/Walkthrough';
import { useTheme } from '../../src/theme/ThemeProvider';

/**
 * Labels are rendered here rather than left to `tabBarLabelStyle`.
 *
 * React Navigation's own label sits in a container that clipped the descender
 * on "Today", rendering it as "Todav" on web. Setting `lineHeight` did not fix
 * it; owning the element does.
 */
function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  const theme = useTheme();

  return (
    <View style={{ height: 16, justifyContent: 'center' }}>
      <Text
        numberOfLines={1}
        style={{
          fontFamily: theme.fontFamily.sansMedium,
          fontSize: 11,
          lineHeight: 15,
          letterSpacing: 0.2,
          textAlign: 'center',
          includeFontPadding: false,
          color: focused ? theme.colour.textPrimary : theme.colour.textTertiary,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const theme = useTheme();

  // Five tabs, with Looks second — one tap from launch, never buried behind a
  // section header.
  const screens = [
    { name: 'index', label: 'Today', icon: 'home' },
    { name: 'looks', label: 'Looks', icon: 'play-circle' },
    { name: 'wardrobe', label: 'Wardrobe', icon: 'grid' },
    { name: 'studio', label: 'Studio', icon: 'sliders' },
    { name: 'outfits', label: 'Outfits', icon: 'layers' },
    { name: 'profile', label: 'You', icon: 'user' },
  ] as const;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colour.textPrimary,
        tabBarInactiveTintColor: theme.colour.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.colour.surface,
          borderTopColor: theme.colour.border,
          borderTopWidth: theme.borderWidth.hairline,
          height: 72,
          paddingTop: 10,
          paddingBottom: 14,
          // Elevation via a hairline border rather than a shadow — see DECISIONS.md.
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
        {screens.map((screen) => (
          <Tabs.Screen
            key={screen.name}
            name={screen.name}
            options={{
              title: screen.label,
              tabBarLabel: ({ focused }) => <TabLabel label={screen.label} focused={focused} />,
              tabBarIcon: ({ color }) => <Feather name={screen.icon} size={19} color={color} />,
            }}
          />
        ))}
      </Tabs>

      {/*
        The walkthrough lives *inside* the tabs, not above the root Stack.
        It teaches the tab experience, so covering a modal the user deliberately
        opened — sign-in, the paywall, add-a-piece — was simply wrong. Placing it
        here makes that impossible by construction: every modal and pushed screen
        is a sibling of `(tabs)` in the root Stack and therefore renders above
        this. A runtime route check would have worked too, and would have been
        one refactor away from breaking again.
      */}
      <Walkthrough />
    </View>
  );
}
