import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AmbientBackground } from '@/components/ui/AmbientBackground';
import { GradientButton } from '@/components/ui/GradientButton';
import { GradientText } from '@/components/ui/GradientText';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslations } from '@/hooks/use-translations';
import { signInWithGoogle } from '@/src/lib/auth';
import { borderRadius, fontFamilies } from '@/constants/theme';

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslations();
  const textSecondary = useThemeColor({}, 'textSecondary');
  const errorColor = useThemeColor({}, 'error');
  const primaryColor = useThemeColor({}, 'primary');

  async function handleSignIn() {
    setIsLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.signInFailed'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <AmbientBackground intensity="strong" />

      <View style={styles.content}>
        <GradientText size="displayLarge" style={styles.title}>
          {t('login.title')}
        </GradientText>
        <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
          {t('login.subtitle')}
        </ThemedText>

        {isLoading ? (
          <ActivityIndicator size="large" color={primaryColor} style={styles.loader} />
        ) : (
          <GradientButton
            title={t('login.signIn')}
            onPress={handleSignIn}
            size="lg"
            style={styles.button}
          />
        )}

        {error && (
          <View style={[styles.errorBanner, { backgroundColor: `${errorColor}20` }]}>
            <ThemedText style={[styles.errorText, { color: errorColor }]}>
              {error}
            </ThemedText>
          </View>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 48,
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    minWidth: 240,
  },
  loader: {
    marginVertical: 20,
  },
  errorBanner: {
    marginTop: 24,
    padding: 16,
    borderRadius: borderRadius.md,
    maxWidth: 320,
  },
  errorText: {
    textAlign: 'center',
    fontFamily: fontFamilies.bodyMedium,
  },
});
