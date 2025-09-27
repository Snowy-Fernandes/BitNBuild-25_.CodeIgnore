// app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {/* register the tabs group so the router knows to load it */}
        <Stack.Screen name="(tabs)" />
        {/* register auth and other top-level routes if you want direct stack routes */}
        <Stack.Screen name="auth" />
        {/* fallback not found screen */}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
