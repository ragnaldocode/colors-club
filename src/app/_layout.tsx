import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ProgressProvider } from '@/state/progress-context';
import { colors } from '@/theme/tokens';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ProgressProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="challenge/[drawingId]" />
          <Stack.Screen name="studio/[drawingId]" options={{ animation: 'slide_from_bottom' }} />
        </Stack>
      </ProgressProvider>
    </SafeAreaProvider>
  );
}
