import { useState, useEffect } from 'react'
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { Database } from '../../types/database.types'

import { Colors } from '../../constants/Colors'

type ArtistBalance = Database['public']['Tables']['artist_balances']['Row']

export default function ArtistDashboard() {
    const router = useRouter()
    const theme = Colors.dark
    const [balance, setBalance] = useState<ArtistBalance | null>(null)
    const [loading, setLoading] = useState(true)
    const [artistName, setArtistName] = useState('')

    useEffect(() => {
        fetchDashboardData()
    }, [])

    async function fetchDashboardData() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.replace('/(artist)/auth/login')
                return
            }

            // Fetch Artist Profile
            const { data: artist } = await supabase
                .from('artists')
                .select('stage_name')
                .eq('id', user.id)
                .single()

            if (artist) setArtistName(artist.stage_name)

            // Fetch Balance
            const { data: balanceData, error } = await supabase
                .from('artist_balances')
                .select('*')
                .eq('artist_id', user.id)
                .single()

            if (error && error.code !== 'PGRST116') throw error // Ignore if not found (new artist)
            setBalance(balanceData)

        } catch (error) {
            console.error('Error fetching dashboard:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleSignOut() {
        await supabase.auth.signOut()
        router.replace('/')
    }

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.accent} />
            </View>
        )
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <Text style={[styles.welcomeText, { color: theme.muted }]}>Bonjour,</Text>
                <Text style={[styles.artistName, { color: theme.text }]}>{artistName || 'Artiste'}</Text>
            </View>

            {/* Balance Card */}
            <View style={[styles.balanceCard, { backgroundColor: theme.primary, shadowColor: theme.primary }]}>
                <Text style={[styles.balanceLabel, { color: theme.muted + 'CC' }]}>Solde Disponible</Text>
                <Text style={[styles.balanceAmount, { color: 'white' }]}>
                    {balance?.available_balance.toLocaleString()} FC
                </Text>
                <View style={[styles.balanceStats, { borderTopColor: 'rgba(255,255,255,0.1)' }]}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: theme.muted + 'CC' }]}>Total Gagné</Text>
                        <Text style={[styles.statValue, { color: 'white' }]}>
                            {balance?.total_earned.toLocaleString()} FC
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: theme.muted + 'CC' }]}>Total Retiré</Text>
                        <Text style={[styles.statValue, { color: 'white' }]}>
                            {balance?.total_withdrawn.toLocaleString()} FC
                        </Text>
                    </View>
                </View>
            </View>

            {/* Actions Grid */}
            <View style={styles.grid}>
                <TouchableOpacity
                    style={[styles.card, { backgroundColor: theme.card }]}
                    onPress={() => router.push('/(artist)/songs')}
                >
                    <Text style={styles.cardIcon}>🎵</Text>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Mes Chansons</Text>
                    <Text style={[styles.cardSubtitle, { color: theme.muted }]}>Gérer ma musique</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.card, { backgroundColor: theme.card }]}
                    onPress={() => router.push('/(artist)/payouts')}
                >
                    <Text style={styles.cardIcon}>💸</Text>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Mes Retraits</Text>
                    <Text style={[styles.cardSubtitle, { color: theme.muted }]}>Demander un paiement</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.card, { backgroundColor: theme.card }]}
                    onPress={() => router.push('/(artist)/transactions')}
                >
                    <Text style={styles.cardIcon}>📜</Text>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Historique</Text>
                    <Text style={[styles.cardSubtitle, { color: theme.muted }]}>Voir les dons</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.card, styles.logoutCard, { backgroundColor: theme.card }]}
                    onPress={handleSignOut}
                >
                    <Text style={styles.cardIcon}>🚪</Text>
                    <Text style={[styles.cardTitle, styles.logoutText]}>Déconnexion</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        marginTop: 20,
        marginBottom: 30,
    },
    welcomeText: {
        fontSize: 16,
    },
    artistName: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    balanceCard: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 30,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    balanceLabel: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '600',
    },
    balanceAmount: {
        fontSize: 40,
        fontWeight: '900',
        marginBottom: 24,
    },
    balanceStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        paddingTop: 16,
    },
    statItem: {
        gap: 4,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    statValue: {
        fontSize: 16,
        fontWeight: '800',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        paddingBottom: 40,
    },
    card: {
        width: '47%',
        borderRadius: 20,
        padding: 20,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    logoutCard: {
        borderColor: '#EF4444',
        borderWidth: 1,
    },
    cardIcon: {
        fontSize: 32,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    logoutText: {
        color: '#EF4444',
    },
    cardSubtitle: {
        fontSize: 12,
    },
})
