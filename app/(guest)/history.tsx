// ============================================
// AFRISENS - Donation History (Guest Mode)
// View past donations using device ID
// ============================================

import { useState, useEffect } from 'react'
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
} from 'react-native'
import { supabase } from '../../lib/supabase'
import { getDeviceId } from '../../lib/deviceId'
import { Database } from '../../types/database.types'

type PaymentAttempt = Database['public']['Tables']['payment_attempts']['Row'] & {
    artists?: {
        stage_name: string
    }
}

export default function DonationHistoryScreen() {
    const [donations, setDonations] = useState<PaymentAttempt[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        fetchDonations()
    }, [])

    async function fetchDonations() {
        try {
            const deviceId = await getDeviceId()

            const { data, error } = await supabase
                .from('payment_attempts')
                .select(`
          *,
          artists (
            stage_name
          )
        `)
                .eq('device_id', deviceId)
                .order('created_at', { ascending: false })

            if (error) throw error
            setDonations(data || [])
        } catch (error) {
            console.error('Error fetching donations:', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    function getStatusColor(status: string) {
        switch (status) {
            case 'success':
                return '#10B981' // Green
            case 'failed':
                return '#EF4444' // Red
            case 'pending':
                return '#F59E0B' // Yellow
            default:
                return '#6B7280' // Gray
        }
    }

    function getStatusIcon(status: string) {
        switch (status) {
            case 'success':
                return '✅'
            case 'failed':
                return '❌'
            case 'pending':
                return '⏳'
            default:
                return '⚪'
        }
    }

    function getStatusText(status: string) {
        switch (status) {
            case 'success':
                return 'Confirmé'
            case 'failed':
                return 'Échoué'
            case 'pending':
                return 'En attente'
            case 'initiated':
                return 'Initié'
            default:
                return status
        }
    }

    function formatDate(dateString: string) {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        if (diffDays === 0) {
            return 'Aujourd\'hui'
        } else if (diffDays === 1) {
            return 'Hier'
        } else if (diffDays < 7) {
            return `Il y a ${diffDays} jours`
        } else {
            return date.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            })
        }
    }

    function renderDonation({ item }: { item: PaymentAttempt }) {
        return (
            <View style={styles.donationCard}>
                <View style={styles.donationHeader}>
                    <View style={styles.donationInfo}>
                        <Text style={styles.artistName}>
                            {(item.artists as any)?.stage_name || 'Artiste inconnu'}
                        </Text>
                        <Text style={styles.donorName}>
                            {item.donor_name || 'Anonyme'}
                        </Text>
                    </View>
                    <View style={styles.amountContainer}>
                        <Text style={styles.amount}>${item.amount}</Text>
                        <Text style={styles.currency}>{item.currency}</Text>
                    </View>
                </View>

                <View style={styles.donationFooter}>
                    <Text style={styles.date}>{formatDate(item.created_at)}</Text>
                    <View
                        style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(item.status) },
                        ]}
                    >
                        <Text style={styles.statusText}>
                            {getStatusIcon(item.status)} {getStatusText(item.status)}
                        </Text>
                    </View>
                </View>
            </View>
        )
    }

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.loadingText}>Chargement de votre historique...</Text>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={donations}
                renderItem={renderDonation}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true)
                            fetchDonations()
                        }}
                        tintColor="#10B981"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📜</Text>
                        <Text style={styles.emptyTitle}>Aucun don pour le moment</Text>
                        <Text style={styles.emptyText}>
                            Vos dons apparaîtront ici
                        </Text>
                    </View>
                }
                ListHeaderComponent={
                    donations.length > 0 ? (
                        <View style={styles.headerStats}>
                            <Text style={styles.statsTitle}>Mes Contributions</Text>
                            <Text style={styles.statsCount}>
                                {donations.filter((d) => d.status === 'success').length} dons confirmés
                            </Text>
                        </View>
                    ) : null
                }
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        color: '#94A3B8',
        fontSize: 16,
    },
    listContent: {
        padding: 16,
    },
    headerStats: {
        marginBottom: 20,
        alignItems: 'center',
    },
    statsTitle: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    statsCount: {
        color: '#10B981',
        fontSize: 16,
        marginTop: 4,
    },
    donationCard: {
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        gap: 12,
    },
    donationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    donationInfo: {
        flex: 1,
        gap: 4,
    },
    artistName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    donorName: {
        color: '#94A3B8',
        fontSize: 14,
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    amount: {
        color: '#10B981',
        fontSize: 24,
        fontWeight: 'bold',
    },
    currency: {
        color: '#64748B',
        fontSize: 12,
    },
    donationFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    date: {
        color: '#64748B',
        fontSize: 13,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyState: {
        padding: 60,
        alignItems: 'center',
        gap: 12,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 8,
    },
    emptyTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    emptyText: {
        color: '#64748B',
        fontSize: 14,
        textAlign: 'center',
    },
})
