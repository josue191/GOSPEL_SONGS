// ============================================
// Guest Stack Layout
// ============================================

import { Stack } from 'expo-router'

export default function GuestLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#0F172A',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Stack.Screen
                name="artists"
                options={{
                    title: 'Artistes Gospel',
                    headerBackTitle: 'Retour'
                }}
            />
            <Stack.Screen
                name="artist/[id]"
                options={{
                    title: 'Artiste',
                    headerBackTitle: 'Liste'
                }}
            />
            <Stack.Screen
                name="history"
                options={{
                    title: 'Mes Dons'
                }}
            />
        </Stack>
    )
}
