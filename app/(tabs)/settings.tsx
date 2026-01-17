import DateTimePicker from '@react-native-community/datetimepicker';
import * as Device from 'expo-device';
import * as Localization from 'expo-localization';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/context/AuthContext';
import { ThemePreference, useThemePreference } from '@/src/context/ThemeContext';
import { signOut } from '@/src/lib/auth';
import {
  formatDateToTime,
  formatTimeForDb,
  formatTimeForDisplay,
  getProfile,
  parseTimeToDate,
  ProfileSettings,
  updateProfile,
} from '@/src/lib/settings';
import { supabase } from '@/src/lib/supabase';

type DiagnosticsData = {
  permissionStatus: string;
  hasToken: boolean;
  tokenCount: number;
};

export default function SettingsScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const { preference: themePreference, setPreference: setThemePreference } = useThemePreference();
  const colors = Colors[colorScheme];

  // Profile state
  const [profile, setProfile] = useState<ProfileSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Time picker state
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Diagnostics state (DEV only)
  const [diagnostics, setDiagnostics] = useState<DiagnosticsData | null>(null);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
    if (__DEV__) {
      loadDiagnostics();
    }
  }, []);

  async function loadProfile() {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getProfile();
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadDiagnostics() {
    if (!user) return;

    try {
      // Check notification permission
      const { status } = await Notifications.getPermissionsAsync();

      // Check for saved tokens
      const { data: devices, error } = await supabase
        .from('devices')
        .select('id')
        .eq('user_id', user.id)
        .is('disabled_at', null);

      setDiagnostics({
        permissionStatus: status,
        hasToken: !error && devices !== null && devices.length > 0,
        tokenCount: devices?.length ?? 0,
      });
    } catch (err) {
      console.error('Failed to load diagnostics:', err);
    }
  }

  // Optimistic update helper
  const updateSetting = useCallback(
    async <K extends keyof ProfileSettings>(
      key: K,
      value: ProfileSettings[K],
      dbValue?: unknown
    ) => {
      if (!profile) return;

      // Optimistic update
      const previousProfile = profile;
      setProfile({ ...profile, [key]: value });
      setError(null);

      try {
        await updateProfile({ [key]: dbValue ?? value });
      } catch (err) {
        // Revert on error
        setProfile(previousProfile);
        setError(err instanceof Error ? err.message : 'Failed to save');
      }
    },
    [profile]
  );

  // Handlers
  function handleThemeChange(newTheme: ThemePreference) {
    setThemePreference(newTheme);
  }

  function handleNotificationsToggle(value: boolean) {
    updateSetting('notifications_enabled', value);
  }

  function handleTimeChange(event: unknown, selectedDate?: Date) {
    setShowTimePicker(Platform.OS === 'ios'); // Keep open on iOS
    if (selectedDate) {
      const displayTime = formatDateToTime(selectedDate);
      const dbTime = formatTimeForDb(displayTime);
      updateSetting('daily_time', dbTime, dbTime);
    }
  }

  async function handleUpdateTimezone() {
    const deviceTz = Localization.getCalendars()[0]?.timeZone ?? 'UTC';
    updateSetting('timezone', deviceTz);
  }

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

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {error && (
          <View style={styles.errorBanner}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        )}

        {/* Appearance Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Appearance
          </ThemedText>
          <View style={[styles.card, { backgroundColor: colors.background }]}>
            <ThemedText style={styles.label}>Theme</ThemedText>
            <View style={styles.segmentedControl}>
              {(['system', 'light', 'dark'] as const).map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.segment,
                    themePreference === option && styles.segmentActive,
                  ]}
                  onPress={() => handleThemeChange(option)}>
                  <ThemedText
                    style={[
                      styles.segmentText,
                      themePreference === option && styles.segmentTextActive,
                    ]}
                    lightColor={themePreference === option ? '#fff' : undefined}
                    darkColor={themePreference === option ? '#000' : undefined}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Reminders Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Reminders
          </ThemedText>
          <View style={[styles.card, { backgroundColor: colors.background }]}>
            {/* Notifications toggle */}
            <View style={styles.row}>
              <ThemedText style={styles.label}>Notifications</ThemedText>
              <Switch
                value={profile?.notifications_enabled ?? true}
                onValueChange={handleNotificationsToggle}
                trackColor={{ false: '#767577', true: '#0a7ea4' }}
                thumbColor={profile?.notifications_enabled ? '#fff' : '#f4f3f4'}
              />
            </View>

            {/* Daily time picker */}
            <View style={styles.row}>
              <ThemedText style={styles.label}>Daily reminder</ThemedText>
              <Pressable
                style={[styles.timeButton, { borderColor: colors.icon }]}
                onPress={() => setShowTimePicker(true)}>
                <ThemedText>
                  {profile ? formatTimeForDisplay(profile.daily_time) : '--:--'}
                </ThemedText>
              </Pressable>
            </View>
            {showTimePicker && profile && (
              <DateTimePicker
                value={parseTimeToDate(profile.daily_time)}
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
              />
            )}
            {Platform.OS === 'android' && showTimePicker && (
              <Pressable onPress={() => setShowTimePicker(false)}>
                <ThemedText style={styles.link}>Done</ThemedText>
              </Pressable>
            )}

            {/* Timezone */}
            <View style={styles.row}>
              <View style={styles.timezoneInfo}>
                <ThemedText style={styles.label}>Timezone</ThemedText>
                <ThemedText style={styles.timezoneValue}>
                  {profile?.timezone ?? 'UTC'}
                </ThemedText>
              </View>
              <Pressable
                style={[styles.smallButton, { borderColor: colors.tint }]}
                onPress={handleUpdateTimezone}>
                <ThemedText style={{ color: colors.tint, fontSize: 13 }}>
                  Use device
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Diagnostics Section (DEV only) */}
        {__DEV__ && diagnostics && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Diagnostics (DEV)
            </ThemedText>
            <View style={[styles.card, { backgroundColor: colors.background }]}>
              <View style={styles.row}>
                <ThemedText style={styles.label}>Push permission</ThemedText>
                <ThemedText
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        diagnostics.permissionStatus === 'granted'
                          ? '#22c55e'
                          : '#ef4444',
                    },
                  ]}>
                  {diagnostics.permissionStatus}
                </ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText style={styles.label}>Device token saved</ThemedText>
                <ThemedText
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: diagnostics.hasToken ? '#22c55e' : '#ef4444',
                    },
                  ]}>
                  {diagnostics.hasToken ? `Yes (${diagnostics.tokenCount})` : 'No'}
                </ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText style={styles.label}>Physical device</ThemedText>
                <ThemedText
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: Device.isDevice ? '#22c55e' : '#f59e0b',
                    },
                  ]}>
                  {Device.isDevice ? 'Yes' : 'Simulator'}
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Account Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Account
          </ThemedText>
          <View style={[styles.card, { backgroundColor: colors.background }]}>
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
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  label: {
    fontSize: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: '#0a7ea4',
  },
  segmentText: {
    fontSize: 14,
  },
  segmentTextActive: {
    fontWeight: '600',
  },
  timeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  timezoneInfo: {
    flex: 1,
  },
  timezoneValue: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 2,
  },
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadge: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  email: {
    opacity: 0.7,
    marginBottom: 12,
  },
  signOutButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff4444',
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.6,
  },
  signOutText: {
    color: '#ff4444',
    fontWeight: '600',
  },
  link: {
    color: '#0a7ea4',
    textAlign: 'center',
    marginTop: 8,
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
  },
});
