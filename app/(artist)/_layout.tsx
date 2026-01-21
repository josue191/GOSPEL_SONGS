import { Stack } from 'expo-router'
import { useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter, useSegments } from 'expo-router'

export default function ArtistLayout() {
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
                contentStyle: {
                    backgroundColor: '#0F172A',
                },
            }}
        >
            <Stack.Screen
                name="auth/login"
                options={{
                    title: 'Connexion Artiste',
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="auth/register"
                options={{
                    title: 'Inscription Artiste',
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="dashboard"
                options={{
                    title: 'Tableau de bord',
                    headerLeft: () => null, // Hide back button on dashboard
                }}
            />
            <Stack.Screen
                name="songs"
                options={{
                    title: 'Mes Chansons',
                }}
            />
            <Stack.Screen
                name="payouts"
                options={{
                    title: 'Mes Retraits',
                }}
            />
            <Stack.Screen
                name="transactions"
                options={{
                    title: 'Historique des Dons',
                }}
            />
        </Stack>
    )
}
