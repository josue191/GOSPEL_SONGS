// ============================================
// AFRISENS - Root Layout
// Navigation setup for guest and artist modes
// ============================================

import { useEffect } from 'react'
import { Slot } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { getDeviceId } from '../lib/deviceId'

export default function RootLayout() {
    useEffect(() => {
        // Initialize device ID on app launch
        getDeviceId().then((deviceId) => {
            console.log('App initialized with device ID:', deviceId)
        })
    }, [])

    return (
        <SafeAreaProvider>
            <Slot />
        </SafeAreaProvider>
    )
}
