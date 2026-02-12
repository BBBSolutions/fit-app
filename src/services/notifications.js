import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api';

let notificationsInitialized = false;

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export const registerForPushNotificationsAsync = async () => {
    if (Platform.OS === 'web') {
        console.log('Push notifications on web are not enabled yet.');
        return null;
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (!Device.isDevice) {
        console.log('Push notifications require a physical device.');
        return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Push notification permission not granted.');
        return null;
    }

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
        console.log('No EAS Project ID found; skipping push token registration.');
        return null;
    }

    try {
        const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('Expo Push Token acquired.');
        return token;
    } catch (error) {
        console.log('Error getting Expo push token:', error);
        return null;
    }
};

export const setupNotifications = async () => {
    if (notificationsInitialized) {
        return;
    }

    notificationsInitialized = true;

    try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
            await api.savePushToken(token);
            console.log('Push token saved to backend.');
        }
    } catch (error) {
        console.log('Error setting up notifications:', error);
    }
};
