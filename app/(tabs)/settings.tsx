import DateTimePicker from '@react-native-community/datetimepicker';
import * as Device from 'expo-device';
import { LinearGradient } from 'expo-linear-gradient';
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
import { AmbientBackground } from '@/components/ui/AmbientBackground';
import { Card } from '@/components/ui/Card';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { borderRadius, Colors, fontFamilies, gradient, ratingColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslations } from '@/hooks/use-translations';
import { useAuth } from '@/src/context/AuthContext';
import { useLanguagePreference } from '@/src/context/LanguageContext';
import { ThemePreference, useThemePreference } from '@/src/context/ThemeContext';
import { isSupportedLanguage, type SupportedLanguage } from '@/src/lib/i18n';
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
  const { t } = useTranslations();
  const { preference: themePreference, setPreference: setThemePreference } = useThemePreference();
  const { language, setLanguage } = useLanguagePreference();
  const colors = Colors[colorScheme];
  const primaryColor = colors.primary;
  const errorColor = colors.error;
  const successColor = colors.success;
  const warningColor = colors.warning;

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

  useEffect(() => {
    if (!profile?.language) return;
    if (isSupportedLanguage(profile.language) && profile.language !== language) {
      setLanguage(profile.language);
    }
  }, [profile?.language, language, setLanguage]);

  async function loadProfile() {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getProfile();
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.errorLoad'));
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
    ): Promise<boolean> => {
      if (!profile) return false;

      // Optimistic update
      const previousProfile = profile;
      setProfile({ ...profile, [key]: value });
      setError(null);

      try {
        await updateProfile({ [key]: dbValue ?? value });
        return true;
      } catch (err) {
        // Revert on error
        setProfile(previousProfile);
        setError(err instanceof Error ? err.message : t('settings.errorSave'));
        return false;
      }
    },
    [profile, t]
  );

  // Handlers
  function handleThemeChange(value: string) {
    setThemePreference(value as ThemePreference);
  }

  function handleLanguageChange(nextLanguage: string) {
    updateSetting('language', nextLanguage as SupportedLanguage);
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

  const selectedLanguage =
    profile?.language && isSupportedLanguage(profile.language)
      ? profile.language
      : language;

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <AmbientBackground intensity="subtle" />
        <ActivityIndicator size="large" color={primaryColor} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <AmbientBackground intensity="subtle" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: `${errorColor}20` }]}>
            <ThemedText style={[styles.errorText, { color: errorColor }]}>
              {error}
            </ThemedText>
          </View>
        )}

        {/* Appearance Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            {t('settings.titleAppearance')}
          </ThemedText>
          <Card>
            <ThemedText style={styles.label}>{t('settings.themeLabel')}</ThemedText>
            <SegmentedControl
              options={[
                { value: 'system', label: t('settings.theme.system') },
                { value: 'light', label: t('settings.theme.light') },
                { value: 'dark', label: t('settings.theme.dark') },
              ]}
              selected={themePreference}
              onSelect={handleThemeChange}
              style={styles.segmentControl}
            />

            <View style={styles.controlGroup}>
              <ThemedText style={styles.label}>{t('settings.languageLabel')}</ThemedText>
              <SegmentedControl
                options={[
                  { value: 'en', label: t('settings.language.english') },
                  { value: 'sv', label: t('settings.language.swedish') },
                ]}
                selected={selectedLanguage}
                onSelect={handleLanguageChange}
                style={styles.segmentControl}
              />
            </View>
          </Card>
        </View>

        {/* Reminders Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            {t('settings.titleReminders')}
          </ThemedText>
          <Card>
            {/* Notifications toggle */}
            <View style={styles.row}>
              <ThemedText style={styles.label}>{t('settings.notifications')}</ThemedText>
              <Switch
                value={profile?.notifications_enabled ?? true}
                onValueChange={handleNotificationsToggle}
                trackColor={{ false: colors.borderSecondary, true: primaryColor }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Daily time picker */}
            <View style={[styles.row, { borderTopColor: colors.borderSecondary }]}>
              <ThemedText style={styles.label}>{t('settings.dailyReminder')}</ThemedText>
              <Pressable
                style={[styles.timeButton, { borderColor: colors.borderSecondary }]}
                onPress={() => setShowTimePicker(true)}
              >
                <ThemedText style={styles.timeText}>
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
                <ThemedText style={[styles.link, { color: primaryColor }]}>
                  {t('settings.done')}
                </ThemedText>
              </Pressable>
            )}

            {/* Timezone */}
            <View style={[styles.row, { borderTopColor: colors.borderSecondary }]}>
              <View style={styles.timezoneInfo}>
                <ThemedText style={styles.label}>{t('settings.timezone')}</ThemedText>
                <ThemedText style={[styles.timezoneValue, { color: colors.textSecondary }]}>
                  {profile?.timezone ?? 'UTC'}
                </ThemedText>
              </View>
              <Pressable
                style={[styles.smallButton, { borderColor: primaryColor }]}
                onPress={handleUpdateTimezone}
              >
                <ThemedText style={[styles.smallButtonText, { color: primaryColor }]}>
                  {t('settings.useDevice')}
                </ThemedText>
              </Pressable>
            </View>
          </Card>
        </View>

        {/* Diagnostics Section (DEV only) */}
        {__DEV__ && diagnostics && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {t('settings.titleDiagnostics')}
            </ThemedText>
            <Card>
              <View style={styles.row}>
                <ThemedText style={styles.label}>
                  {t('settings.diagnostics.pushPermission')}
                </ThemedText>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        diagnostics.permissionStatus === 'granted'
                          ? successColor
                          : errorColor,
                    },
                  ]}
                >
                  <ThemedText style={styles.statusText}>
                    {diagnostics.permissionStatus}
                  </ThemedText>
                </View>
              </View>
              <View style={[styles.row, { borderTopColor: colors.borderSecondary }]}>
                <ThemedText style={styles.label}>
                  {t('settings.diagnostics.deviceToken')}
                </ThemedText>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: diagnostics.hasToken ? successColor : errorColor,
                    },
                  ]}
                >
                  <ThemedText style={styles.statusText}>
                    {diagnostics.hasToken
                      ? `${t('settings.diagnostics.yes')} (${diagnostics.tokenCount})`
                      : t('settings.diagnostics.no')}
                  </ThemedText>
                </View>
              </View>
              <View style={[styles.row, { borderTopColor: colors.borderSecondary }]}>
                <ThemedText style={styles.label}>
                  {t('settings.diagnostics.physicalDevice')}
                </ThemedText>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: Device.isDevice ? successColor : warningColor,
                    },
                  ]}
                >
                  <ThemedText style={styles.statusText}>
                    {Device.isDevice
                      ? t('settings.diagnostics.yes')
                      : t('settings.diagnostics.simulator')}
                  </ThemedText>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* Account Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            {t('settings.titleAccount')}
          </ThemedText>
          <Card>
            {user && (
              <ThemedText style={[styles.email, { color: colors.textSecondary }]}>
                {user.email}
              </ThemedText>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.signOutButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleSignOut}
              disabled={isSigningOut}
            >
              <LinearGradient
                colors={ratingColors.forgot.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.signOutGradient}
              >
                <ThemedText style={styles.signOutText}>
                  {isSigningOut ? t('settings.signingOut') : t('settings.signOut')}
                </ThemedText>
              </LinearGradient>
            </Pressable>
          </Card>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
  },
  label: {
    fontSize: 16,
    fontFamily: fontFamilies.bodyMedium,
  },
  segmentControl: {
    marginTop: 12,
  },
  controlGroup: {
    marginTop: 20,
  },
  timeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  timeText: {
    fontFamily: fontFamilies.bodyMedium,
  },
  timezoneInfo: {
    flex: 1,
  },
  timezoneValue: {
    fontSize: 13,
    marginTop: 4,
    fontFamily: fontFamilies.bodyMedium,
  },
  smallButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  smallButtonText: {
    fontSize: 13,
    fontFamily: fontFamilies.bodyMedium,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: fontFamilies.bodySemiBold,
  },
  email: {
    marginBottom: 16,
    fontFamily: fontFamilies.bodyMedium,
  },
  signOutButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  signOutGradient: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: borderRadius.lg,
  },
  signOutText: {
    color: '#ffffff',
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 16,
  },
  link: {
    textAlign: 'center',
    marginTop: 8,
    fontFamily: fontFamilies.bodyMedium,
  },
  errorBanner: {
    padding: 12,
    borderRadius: borderRadius.md,
    marginBottom: 16,
  },
  errorText: {
    textAlign: 'center',
    fontFamily: fontFamilies.bodyMedium,
  },
});
