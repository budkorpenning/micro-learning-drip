import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslations } from '@/hooks/use-translations';
import { createDeck } from '@/src/lib/decks';
import { fontFamilies } from '@/constants/theme';

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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ThemedView style={styles.inner}>
        <ThemedText type="subtitle" style={styles.label}>
          {t('createDeck.label')}
        </ThemedText>
        <TextInput
          style={[styles.input, { color: textColor, borderColor: inputBorder, backgroundColor: inputBackground }]}
          value={name}
          onChangeText={setName}
          placeholder={t('createDeck.placeholder')}
          placeholderTextColor={textMuted}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />

        {error && (
          <ThemedText style={[styles.error, { color: errorColor }]}>
            {error}
          </ThemedText>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: primaryColor },
            !isValid && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleSubmit}
          disabled={!isValid || isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.buttonText}>{t('createDeck.button')}</ThemedText>
          )}
        </Pressable>
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
    padding: 20,
  },
  label: {
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 2,
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
  },
  error: {
    marginTop: 16,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fontFamilies.bodySemiBold,
  },
});
