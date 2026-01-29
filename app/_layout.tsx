import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useEffect, useCallback } from 'react'
import * as SplashScreen from 'expo-splash-screen'
import {
    useFonts,
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
    Inter_900Black
} from '@expo-google-fonts/inter'

// Empêche l'écran de chargement de se fermer trop vite
SplashScreen.preventAutoHideAsync().catch(() => { })

export default function RootLayout() {
    const [fontsLoaded, fontError] = useFonts({
        Inter_400Regular,
        Inter_500Medium,
        Inter_700Bold,
        Inter_900Black,
    })

    const onLayoutRootView = useCallback(async () => {
        if (fontsLoaded || fontError) {
            await SplashScreen.hideAsync().catch(() => { })
        }
    }, [fontsLoaded, fontError])

    useEffect(() => {
        onLayoutRootView()
    }, [onLayoutRootView])

    if (!fontsLoaded && !fontError) {
        return null
    }

    return (
        <SafeAreaProvider onLayout={onLayoutRootView}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(guest)" options={{ headerShown: false }} />
                <Stack.Screen name="(artist)" options={{ headerShown: false }} />
            </Stack>
        </SafeAreaProvider>
    )
}
