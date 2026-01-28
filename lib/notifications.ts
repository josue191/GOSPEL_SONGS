// ============================================
// Firebase Cloud Messaging Setup
// Push notifications for payment confirmations
// ============================================

import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { supabase } from './supabase'

// Configure how notifications are displayed
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
})

/**
 * Register for push notifications and get FCM token
 */
export async function registerForPushNotifications(): Promise<string | null> {
    try {
        // Check if running on physical device
        if (!Device.isDevice) {
            console.log('Push notifications only work on physical devices')
            return null
        }

        // Check existing permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync()
        let finalStatus = existingStatus

        // Request permissions if not granted
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync()
            finalStatus = status
        }

        if (finalStatus !== 'granted') {
            console.log('Push notification permission denied')
            return null
        }

        // Get FCM token
        const token = (await Notifications.getExpoPushTokenAsync()).data
        console.log('FCM Token:', token)

        // Platform-specific setup
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            })
        }

        return token
    } catch (error) {
        console.error('Error registering for push notifications:', error)
        return null
    }
}

/**
 * Save FCM token to user profile
 */
export async function saveFcmToken(userId: string, token: string): Promise<void> {
    try {
        console.log('Saving FCM token for user:', userId, token)

        const { error } = await supabase
            .from('device_tokens')
            .upsert({
                user_id: userId,
                fcm_token: token,
                device_type: Platform.OS,
                last_seen_at: new Date().toISOString()
            }, {
                onConflict: 'user_id, fcm_token'
            })

        if (error) throw error
        console.log('FCM token saved successfully')

    } catch (error) {
        console.error('Error saving FCM token:', error)
    }
}

/**
 * Handle notification received while app is in foreground
 */
export function addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
) {
    return Notifications.addNotificationReceivedListener(callback)
}

/**
 * Handle notification tapped by user
 */
export function addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void
) {
    return Notifications.addNotificationResponseReceivedListener(callback)
}

/**
 * Send local notification (for testing or offline scenarios)
 */
export async function sendLocalNotification(
    title: string,
    body: string,
    data?: any
): Promise<void> {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data,
            sound: true,
        },
        trigger: null, // Show immediately
    })
}
