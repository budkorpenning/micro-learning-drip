import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/src/context/AuthContext';
import { signOut } from '@/src/lib/auth';

export default function SettingsScreen() {
  const { user } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Settings</ThemedText>
      <ThemedText style={styles.placeholder}>
        Configure your daily drip preferences here.
      </ThemedText>

      {user && (
        <ThemedText style={styles.email}>{user.email}</ThemedText>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.signOutButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={handleSignOut}
        disabled={isSigningOut}>
        <ThemedText style={styles.signOutText}>
          {isSigningOut ? 'Signing out...' : 'Sign out'}
        </ThemedText>
      </Pressable>
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
  email: {
    marginTop: 24,
    opacity: 0.6,
  },
  signOutButton: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  buttonPressed: {
    opacity: 0.6,
  },
  signOutText: {
    color: '#ff4444',
  },
});
