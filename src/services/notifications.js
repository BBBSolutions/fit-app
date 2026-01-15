import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export const registerForPushNotificationsAsync = async () => {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Platform.OS === 'web') {
        console.log("Push notifications on Web require VAPID key setup. Skipping for now.");
        // alert("Web Push skipped used console for details");
        return;
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            alert('Failed to get push token for push notification!');
            return;
        }

        // Learn more about projectId:
        // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
        try {
            const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

            if (!projectId) {
                console.log("No EAS Project ID found.");
                alert("Push Notifications require an EAS Project ID.\nPlease run 'npx eas init' in your terminal to set it up.");
                return null;
            }

            // For now, simpler call often works without project ID if not using EAS strict
            token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            console.log("Expo Push Token:", token);
            alert(`Push Token Generated: ${token.substring(0, 10)}...`);
        } catch (e) {
            console.log("Error getting token:", e);
            if (e.message.includes('projectId')) {
                alert("Push Notifications require an EAS Project ID.\nPlease run 'npx eas init' in your terminal.");
            } else {
                alert(`Failed to get Push Token: ${e.message}`);
            }
        }
    } else {
        alert('Must use physical device for Push Notifications');
        console.log("Must use physical device for Push Notifications");
    }

    return token;
};

export const setupNotifications = async () => {
    try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
            // Send to backend
            await api.savePushToken(token);
            console.log("Token saved to backend");
        }
    } catch (error) {
        console.log("Error setting up notifications:", error);
        alert("Failed to setup notifications: " + error.message);
    }
};
