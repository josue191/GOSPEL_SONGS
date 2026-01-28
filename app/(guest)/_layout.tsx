// ============================================
// Guest Stack Layout
// ============================================

import { Stack } from 'expo-router'
import { Colors } from '../../constants/Colors'

export default function GuestLayout() {
    const theme = Colors.dark

    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: theme.background,
                },
                headerTintColor: theme.text,
                headerTitleStyle: {
                    fontWeight: '900',
                    fontSize: 20,
                },
                headerShadowVisible: false, // Clean look
            }}
        >
            <Stack.Screen
                name="artists"
                options={{
                    title: 'CHANTRES',
                    headerBackTitle: 'Retour'
                }}
            />
            <Stack.Screen
                name="artist/[id]"
                options={{
                    title: 'DÉTAILS',
                    headerBackTitle: 'Liste'
                }}
            />
            <Stack.Screen
                name="history"
                options={{
                    title: 'DONS'
                }}
            />
        </Stack>
    )
}
