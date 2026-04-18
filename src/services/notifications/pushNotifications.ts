// Push notifications are removed in Expo Go SDK 53+
// We skip initializing the native notification handler to avoid fatal crashes.


export async function registerForPushNotificationsAsync(userId: string) {
  console.log('Skipping push notifications because we are using Expo Go.');
  return null;
}