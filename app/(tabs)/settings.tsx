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
import { Colors, fontFamilies } from '@/constants/theme';
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
  const surfaceColor = colors.surfaceElevated1;
  const errorBannerBackground =
    colorScheme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.08)';

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
  function handleThemeChange(newTheme: ThemePreference) {
    setThemePreference(newTheme);
  }

  function handleLanguageChange(nextLanguage: SupportedLanguage) {
    updateSetting('language', nextLanguage);
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
        <ActivityIndicator size="large" color={colors.tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: errorBannerBackground }]}>
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
          <View
            style={[
              styles.card,
              { backgroundColor: surfaceColor, borderColor: colors.cardBorder },
            ]}>
            <ThemedText style={styles.label}>{t('settings.themeLabel')}</ThemedText>
            <View style={[styles.segmentedControl, { borderColor: colors.borderSecondary }]}>
              {(['system', 'light', 'dark'] as const).map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.segment,
                    themePreference === option && { backgroundColor: primaryColor },
                  ]}
                  onPress={() => handleThemeChange(option)}>
                  <ThemedText
                    style={[
                      styles.segmentText,
                      themePreference === option && styles.segmentTextActive,
                    ]}
                    lightColor={themePreference === option ? '#fff' : undefined}
                    darkColor={themePreference === option ? '#fff' : undefined}>
                    {t(`settings.theme.${option}` as const)}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <View style={styles.controlGroup}>
              <ThemedText style={styles.label}>{t('settings.languageLabel')}</ThemedText>
              <View style={[styles.segmentedControl, { borderColor: colors.borderSecondary }]}>
                {(['en', 'sv'] as const).map((option) => (
                  <Pressable
                    key={option}
                    style={[
                      styles.segment,
                      selectedLanguage === option && { backgroundColor: primaryColor },
                    ]}
                    onPress={() => handleLanguageChange(option)}>
                    <ThemedText
                      style={[
                        styles.segmentText,
                        selectedLanguage === option && styles.segmentTextActive,
                      ]}
                      lightColor={selectedLanguage === option ? '#fff' : undefined}
                      darkColor={selectedLanguage === option ? '#fff' : undefined}>
                      {option === 'en'
                        ? t('settings.language.english')
                        : t('settings.language.swedish')}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Reminders Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            {t('settings.titleReminders')}
          </ThemedText>
          <View
            style={[
              styles.card,
              { backgroundColor: surfaceColor, borderColor: colors.cardBorder },
            ]}>
            {/* Notifications toggle */}
            <View style={styles.row}>
              <ThemedText style={styles.label}>{t('settings.notifications')}</ThemedText>
              <Switch
                value={profile?.notifications_enabled ?? true}
                onValueChange={handleNotificationsToggle}
                trackColor={{ false: colors.borderSecondary, true: primaryColor }}
                thumbColor={
                  profile?.notifications_enabled ? '#fff' : colors.surfaceElevated2
                }
              />
            </View>

            {/* Daily time picker */}
            <View style={styles.row}>
              <ThemedText style={styles.label}>{t('settings.dailyReminder')}</ThemedText>
              <Pressable
                style={[styles.timeButton, { borderColor: colors.inputBorder }]}
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
                <ThemedText style={[styles.link, { color: primaryColor }]}>
                  {t('settings.done')}
                </ThemedText>
              </Pressable>
            )}

            {/* Timezone */}
            <View style={styles.row}>
              <View style={styles.timezoneInfo}>
                <ThemedText style={styles.label}>{t('settings.timezone')}</ThemedText>
                <ThemedText style={styles.timezoneValue}>
                  {profile?.timezone ?? 'UTC'}
                </ThemedText>
              </View>
              <Pressable
                style={[styles.smallButton, { borderColor: primaryColor }]}
                onPress={handleUpdateTimezone}>
                <ThemedText style={{ color: primaryColor, fontSize: 13 }}>
                  {t('settings.useDevice')}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Diagnostics Section (DEV only) */}
        {__DEV__ && diagnostics && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {t('settings.titleDiagnostics')}
            </ThemedText>
            <View
              style={[
                styles.card,
                { backgroundColor: surfaceColor, borderColor: colors.cardBorder },
              ]}>
              <View style={styles.row}>
                <ThemedText style={styles.label}>
                  {t('settings.diagnostics.pushPermission')}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        diagnostics.permissionStatus === 'granted'
                          ? successColor
                          : errorColor,
                    },
                  ]}>
                  {diagnostics.permissionStatus}
                </ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText style={styles.label}>
                  {t('settings.diagnostics.deviceToken')}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: diagnostics.hasToken ? successColor : errorColor,
                    },
                  ]}>
                  {diagnostics.hasToken
                    ? `${t('settings.diagnostics.yes')} (${diagnostics.tokenCount})`
                    : t('settings.diagnostics.no')}
                </ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText style={styles.label}>
                  {t('settings.diagnostics.physicalDevice')}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: Device.isDevice ? successColor : warningColor,
                    },
                  ]}>
                  {Device.isDevice
                    ? t('settings.diagnostics.yes')
                    : t('settings.diagnostics.simulator')}
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Account Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            {t('settings.titleAccount')}
          </ThemedText>
          <View
            style={[
              styles.card,
              { backgroundColor: surfaceColor, borderColor: colors.cardBorder },
            ]}>
            {user && (
              <ThemedText style={styles.email}>{user.email}</ThemedText>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.signOutButton,
                { borderColor: errorColor },
                pressed && styles.buttonPressed,
              ]}
              onPress={handleSignOut}
              disabled={isSigningOut}>
              <ThemedText style={[styles.signOutText, { color: errorColor }]}>
                {isSigningOut ? t('settings.signingOut') : t('settings.signOut')}
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
    borderRadius: 8,
    borderWidth: 2,
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
    fontFamily: fontFamilies.bodyMedium,
  },
  segmentedControl: {
    flexDirection: 'row',
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
  },
  controlGroup: {
    marginTop: 16,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 14,
    fontFamily: fontFamilies.bodyMedium,
  },
  segmentTextActive: {
    fontFamily: fontFamilies.bodySemiBold,
  },
  timeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 2,
  },
  timezoneInfo: {
    flex: 1,
  },
  timezoneValue: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 2,
    fontFamily: fontFamilies.bodyMedium,
  },
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 2,
  },
  statusBadge: {
    color: '#fff',
    fontSize: 12,
    fontFamily: fontFamilies.bodySemiBold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  email: {
    opacity: 0.7,
    marginBottom: 12,
    fontFamily: fontFamilies.bodyMedium,
  },
  signOutButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.6,
  },
  signOutText: {
    fontFamily: fontFamilies.bodySemiBold,
  },
  link: {
    textAlign: 'center',
    marginTop: 8,
  },
  errorBanner: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    textAlign: 'center',
  },
});
