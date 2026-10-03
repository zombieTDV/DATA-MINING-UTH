// Import NativeWind global stylesheet (CSS processing)
import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { Colors } from '@/theme';
import { linkingConfig } from '@/navigation';

/**
 * Root layout for the UTH Data Mining UI.
 * Configures:
 *   - Global CSS via NativeWind (global.css imported at top)
 *   - PaperProvider for Material Design 3 components
 *   - Stack navigation with typed routes
 *   - Deep linking (web + custom scheme)
 *   - Light/dark status bar based on system theme
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const theme = isDark
    ? {
        ...MD3DarkTheme,
        colors: {
          ...MD3DarkTheme.colors,
          primary: colors.accent,
          background: colors.background,
          surface: colors.surface,
          onSurface: colors.text,
        },
      }
    : {
        ...MD3LightTheme,
        colors: {
          ...MD3LightTheme.colors,
          primary: colors.accent,
          background: colors.background,
          surface: colors.surface,
          onSurface: colors.text,
        },
      };

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="paper/[id]"
          options={{ title: 'Paper Detail', presentation: 'card' }}
        />
      </Stack>
    </PaperProvider>
  );
}
