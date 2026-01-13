import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function TodayScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Today</ThemedText>
      <ThemedText style={styles.placeholder}>
        Your daily learning items will appear here.
      </ThemedText>
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
  placeholder: {
    marginTop: 12,
    textAlign: 'center',
    opacity: 0.6,
  },
});
