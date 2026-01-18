import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslations } from '@/hooks/use-translations';
import { createItem } from '@/src/lib/items';

export default function AddItemScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#ccc', dark: '#444' }, 'text');
  const { t } = useTranslations();

  const isValid = title.trim().length > 0 && content.trim().length > 0 && deckId;

  async function handleSubmit() {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await createItem({
        deck_id: deckId!,
        title,
        content,
        source_url: sourceUrl || null,
        tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('addItem.error'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ThemedView style={styles.inner}>
        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
          <ThemedText type="subtitle" style={styles.label}>
            {t('addItem.questionLabel')}
          </ThemedText>
          <TextInput
            style={[styles.input, { color: textColor, borderColor }]}
            value={title}
            onChangeText={setTitle}
            placeholder={t('addItem.questionPlaceholder')}
            placeholderTextColor="#888"
            autoFocus
          />

          <ThemedText type="subtitle" style={styles.label}>
            {t('addItem.answerLabel')}
          </ThemedText>
          <TextInput
            style={[styles.input, styles.textArea, { color: textColor, borderColor }]}
            value={content}
            onChangeText={setContent}
            placeholder={t('addItem.answerPlaceholder')}
            placeholderTextColor="#888"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <ThemedText type="subtitle" style={styles.label}>
            {t('addItem.sourceLabel')}
          </ThemedText>
          <TextInput
            style={[styles.input, { color: textColor, borderColor }]}
            value={sourceUrl}
            onChangeText={setSourceUrl}
            placeholder="https://..."
            placeholderTextColor="#888"
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <ThemedText type="subtitle" style={styles.label}>
            {t('addItem.tagsLabel')}
          </ThemedText>
          <TextInput
            style={[styles.input, { color: textColor, borderColor }]}
            value={tags}
            onChangeText={setTags}
            placeholder={t('addItem.tagsPlaceholder')}
            placeholderTextColor="#888"
            autoCapitalize="none"
          />

          {error && (
            <ThemedText style={styles.error}>{error}</ThemedText>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.button,
              !isValid && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleSubmit}
            disabled={!isValid || isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>{t('addItem.button')}</ThemedText>
            )}
          </Pressable>
        </ScrollView>
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
  scroll: {
    flex: 1,
    padding: 20,
  },
  label: {
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
  },
  error: {
    color: '#ff4444',
    marginTop: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4285F4',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
