import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { colors, typography } from '@/theme/tokens';

function TabEmoji({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={[styles.icon, focused ? styles.iconFocused : styles.iconIdle]}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Meu mundo',
          tabBarIcon: ({ focused }) => <TabEmoji emoji="🏡" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: 'Galeria',
          tabBarIcon: ({ focused }) => <TabEmoji emoji="🖼️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="album"
        options={{
          title: 'Meu álbum',
          tabBarIcon: ({ focused }) => <TabEmoji emoji="🏅" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.outline,
    borderTopWidth: 1,
    height: 76,
    paddingTop: 8,
    paddingBottom: 10,
  },
  tabLabel: {
    ...typography.caption,
    fontSize: 12,
  },
  tabItem: {
    paddingVertical: 4,
  },
  icon: {
    fontSize: 22,
  },
  iconFocused: {
    opacity: 1,
  },
  iconIdle: {
    opacity: 0.55,
  },
});
