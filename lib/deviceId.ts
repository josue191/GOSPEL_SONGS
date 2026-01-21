// ============================================
// Device ID Management
// Generates and persists unique device identifier
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Device from 'expo-device'

const DEVICE_ID_KEY = '@afrisens:device_id'

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
}

/**
 * Get or create device ID
 * This is the pseudo-identity for guest users
 */
export async function getDeviceId(): Promise<string> {
    try {
        // Try to get existing device ID
        let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY)

        if (!deviceId) {
            // Generate new device ID combining expo Device ID and UUID
            const expoDeviceId = Device.deviceYearClass || 'unknown'
            deviceId = `${expoDeviceId}_${generateUUID()}`

            // Persist it
            await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId)
            console.log('Generated new device ID:', deviceId)
        } else {
            console.log('Retrieved existing device ID:', deviceId)
        }

        return deviceId
    } catch (error) {
        console.error('Error managing device ID:', error)
        // Fallback: generate temporary ID (not persisted)
        return `temp_${generateUUID()}`
    }
}

/**
 * Clear device ID (for testing or user request)
 */
export async function clearDeviceId(): Promise<void> {
    try {
        await AsyncStorage.removeItem(DEVICE_ID_KEY)
        console.log('Device ID cleared')
    } catch (error) {
        console.error('Error clearing device ID:', error)
    }
}

/**
 * Get device info for debugging/analytics
 */
export function getDeviceInfo() {
    return {
        brand: Device.brand,
        manufacturer: Device.manufacturer,
        modelName: Device.modelName,
        osName: Device.osName,
        osVersion: Device.osVersion,
        totalMemory: Device.totalMemory,
    }
}
