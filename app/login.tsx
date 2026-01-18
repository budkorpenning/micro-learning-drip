import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslations } from '@/hooks/use-translations';
import { signInWithGoogle } from '@/src/lib/auth';
import { fontFamilies } from '@/constants/theme';

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslations();
  const primaryColor = useThemeColor({}, 'primary');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const errorColor = useThemeColor({}, 'error');

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
      <ThemedText type="title" style={styles.title}>
        {t('login.title')}
      </ThemedText>
      <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
        {t('login.subtitle')}
      </ThemedText>

      <Pressable
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: primaryColor },
          pressed && styles.buttonPressed,
          isLoading && styles.buttonDisabled,
        ]}
        onPress={handleSignIn}
        disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.buttonText}>
            {t('login.signIn')}
          </ThemedText>
        )}
      </Pressable>

      {error && (
        <ThemedText style={[styles.error, { color: errorColor }]}>
          {error}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 40,
    fontFamily: fontFamilies.bodyMedium,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 6,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fontFamilies.bodySemiBold,
  },
  error: {
    marginTop: 16,
    textAlign: 'center',
  },
});
