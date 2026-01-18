import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AmbientBackground } from '@/components/ui/AmbientBackground';
import { GradientButton } from '@/components/ui/GradientButton';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslations } from '@/hooks/use-translations';
import { createDeck } from '@/src/lib/decks';
import { borderRadius, fontFamilies } from '@/constants/theme';

export default function CreateDeckScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textColor = useThemeColor({}, 'text');
  const textMuted = useThemeColor({}, 'textMuted');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const inputBackground = useThemeColor({}, 'inputBackground');
  const primaryColor = useThemeColor({}, 'primary');
  const errorColor = useThemeColor({}, 'error');
  const { t } = useTranslations();

  const isValid = name.trim().length > 0;

  async function handleSubmit() {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await createDeck({ name });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('createDeck.error'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={styles.inner}>
        <AmbientBackground intensity="subtle" />

        <View style={styles.form}>
          <ThemedText type="subtitle" style={styles.label}>
            {t('createDeck.label')}
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                color: textColor,
                borderColor: inputBorder,
                backgroundColor: inputBackground,
              },
            ]}
            value={name}
            onChangeText={setName}
            placeholder={t('createDeck.placeholder')}
            placeholderTextColor={textMuted}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          {error && (
            <View style={[styles.errorBanner, { backgroundColor: `${errorColor}20` }]}>
              <ThemedText style={[styles.errorText, { color: errorColor }]}>
                {error}
              </ThemedText>
            </View>
          )}

          {isSubmitting ? (
            <ActivityIndicator size="large" color={primaryColor} style={styles.loader} />
          ) : (
            <GradientButton
              title={t('createDeck.button')}
              onPress={handleSubmit}
              disabled={!isValid}
              size="lg"
              style={styles.button}
            />
          )}
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  form: {
    flex: 1,
    padding: 24,
    paddingTop: 32,
  },
  label: {
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: 16,
    fontSize: 16,
    fontFamily: fontFamilies.body,
  },
  errorBanner: {
    marginTop: 20,
    padding: 12,
    borderRadius: borderRadius.md,
  },
  errorText: {
    textAlign: 'center',
    fontFamily: fontFamilies.bodyMedium,
  },
  button: {
    marginTop: 32,
  },
  loader: {
    marginTop: 32,
  },
});
