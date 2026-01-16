import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure how notifications are displayed when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions from the user
 * Returns true if granted, false otherwise
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permission not granted');
    return false;
  }

  // Set up Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-reminders', {
      name: 'Daily Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4F46E5',
    });
  }

  return true;
}

/**
 * Get the Expo push token for this device
 * Returns null if unavailable
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push tokens require a physical device');
    return null;
  }

  const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
  if (!projectId) {
    console.warn(
      'Push notifications disabled: EXPO_PUBLIC_PROJECT_ID not set in .env. ' +
      'Get your project ID from https://expo.dev'
    );
    return null;
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return token;
  } catch (error) {
    // Use warn instead of error to avoid red LogBox in Expo Go
    console.warn('Could not get push token:', error);
    return null;
  }
}

/**
 * Register the device token with Supabase
 * Upserts the token to handle token refreshes
 */
export async function registerDeviceToken(userId: string): Promise<boolean> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    return false;
  }

  const token = await getExpoPushToken();
  if (!token) {
    return false;
  }

  const platform = Platform.OS as 'ios' | 'android' | 'web';

  // Upsert device token (update last_seen_at if exists, insert if new)
  const { error } = await supabase
    .from('devices')
    .upsert(
      {
        user_id: userId,
        expo_push_token: token,
        platform,
        last_seen_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,expo_push_token',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Error registering device token:', error);
    return false;
  }

  console.log('Device token registered successfully');
  return true;
}

/**
 * Remove device token when user logs out
 */
export async function unregisterDeviceToken(): Promise<void> {
  const token = await getExpoPushToken();
  if (!token) return;

  const { error } = await supabase
    .from('devices')
    .delete()
    .eq('expo_push_token', token);

  if (error) {
    console.error('Error unregistering device token:', error);
  }
}

/**
 * Add listener for notification received while app is foregrounded
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add listener for when user taps on a notification
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
