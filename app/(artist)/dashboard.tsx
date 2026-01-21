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

type ArtistBalance = Database['public']['Tables']['artist_balances']['Row']

export default function ArtistDashboard() {
    const router = useRouter()
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
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#6366F1" />
            </View>
        )
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.welcomeText}>Bonjour,</Text>
                <Text style={styles.artistName}>{artistName || 'Artiste'}</Text>
            </View>

            {/* Balance Card */}
            <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Solde Disponible</Text>
                <Text style={styles.balanceAmount}>
                    {balance?.available_balance.toLocaleString()} FC
                </Text>
                <View style={styles.balanceStats}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Total Gagné</Text>
                        <Text style={styles.statValue}>
                            {balance?.total_earned.toLocaleString()} FC
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Total Retiré</Text>
                        <Text style={styles.statValue}>
                            {balance?.total_withdrawn.toLocaleString()} FC
                        </Text>
                    </View>
                </View>
            </View>

            {/* Actions Grid */}
            <View style={styles.grid}>
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => router.push('/(artist)/songs')}
                >
                    <Text style={styles.cardIcon}>🎵</Text>
                    <Text style={styles.cardTitle}>Mes Chansons</Text>
                    <Text style={styles.cardSubtitle}>Gérer ma musique</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.card}
                    onPress={() => router.push('/(artist)/payouts')}
                >
                    <Text style={styles.cardIcon}>💸</Text>
                    <Text style={styles.cardTitle}>Mes Retraits</Text>
                    <Text style={styles.cardSubtitle}>Demander un paiement</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.card}
                    onPress={() => router.push('/(artist)/transactions')}
                >
                    <Text style={styles.cardIcon}>📜</Text>
                    <Text style={styles.cardTitle}>Historique</Text>
                    <Text style={styles.cardSubtitle}>Voir les dons</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.card, styles.logoutCard]}
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
        backgroundColor: '#0F172A',
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
        color: '#94A3B8',
    },
    artistName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    balanceCard: {
        backgroundColor: '#6366F1',
        borderRadius: 20,
        padding: 24,
        marginBottom: 30,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    balanceLabel: {
        fontSize: 14,
        color: '#E0E7FF',
        marginBottom: 8,
    },
    balanceAmount: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 24,
    },
    balanceStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
        paddingTop: 16,
    },
    statItem: {
        gap: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#E0E7FF',
    },
    statValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        paddingBottom: 40,
    },
    card: {
        width: '47%', // Slightly less than 50% to account for gap
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 20,
        gap: 12,
        // minHeight: 140,
    },
    logoutCard: {
        backgroundColor: '#1E293B',
        borderColor: '#EF4444',
        borderWidth: 1,
    },
    cardIcon: {
        fontSize: 32,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    logoutText: {
        color: '#EF4444',
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#94A3B8',
    },
})
