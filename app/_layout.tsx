import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
} from '@expo-google-fonts/montserrat';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { LanguageProvider } from '@/src/context/LanguageContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { useTranslations } from '@/hooks/use-translations';

function RootLayoutNav() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { t } = useTranslations();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = (segments[0] as string) === 'login';

    if (!session && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login' as never);
    } else if (session && inAuthGroup) {
      // Redirect to home if authenticated
      router.replace('/' as never);
    }
  }, [session, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add-item" options={{ title: t('nav.addCard') }} />
        <Stack.Screen name="review" options={{ title: t('nav.review') }} />
        <Stack.Screen
          name="deck/[id]"
          options={{ title: t('nav.deck'), headerBackTitle: t('nav.library') }}
        />
        <Stack.Screen
          name="create-deck"
          options={{ presentation: 'modal', title: t('nav.createDeck') }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: t('nav.modal') }} />
      </Stack>
      <StatusBar style="auto" />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <RootLayoutNav />
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
