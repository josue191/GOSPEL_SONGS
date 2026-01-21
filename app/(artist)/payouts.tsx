import { useState, useEffect } from 'react'
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native'
import { supabase } from '../../lib/supabase'
import { Database } from '../../types/database.types'

type PayoutRequest = Database['public']['Tables']['payout_requests']['Row']

export default function PayoutsScreen() {
    const [payouts, setPayouts] = useState<PayoutRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [balance, setBalance] = useState(0)

    // New Request State
    const [amount, setAmount] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch Balance
            const { data: balanceData } = await supabase
                .from('artist_balances')
                .select('available_balance')
                .eq('artist_id', user.id)
                .single()

            if (balanceData) setBalance(balanceData.available_balance)

            // Fetch Payouts
            const { data: payoutsData, error } = await supabase
                .from('payout_requests')
                .select('*')
                .eq('artist_id', user.id)
                .order('requested_at', { ascending: false })

            if (error) throw error
            setPayouts(payoutsData || [])
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleRequestPayout() {
        const amountNum = parseFloat(amount)
        if (!amount || !phoneNumber) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs')
            return
        }
        if (isNaN(amountNum) || amountNum <= 0) {
            Alert.alert('Erreur', 'Montant invalide')
            return
        }
        if (amountNum > balance) {
            Alert.alert('Erreur', 'Solde insuffisant')
            return
        }

        setSubmitting(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await supabase
                .from('payout_requests')
                .insert({
                    artist_id: user.id,
                    amount: amountNum,
                    mobile_money_number: phoneNumber,
                    status: 'pending'
                })

            if (error) throw error

            Alert.alert('Succès', 'Demande de retrait envoyée')
            setAmount('')
            setPhoneNumber('')
            fetchData() // Refresh
        } catch (error: any) {
            Alert.alert('Erreur', error.message)
        } finally {
            setSubmitting(false)
        }
    }

    function getStatusColor(status: string) {
        switch (status) {
            case 'approved': return '#10B981' // Green
            case 'paid': return '#10B981' // Green
            case 'pending': return '#F59E0B' // Orange
            case 'rejected': return '#EF4444' // Red
            default: return '#94A3B8'
        }
    }

    function renderPayout({ item }: { item: PayoutRequest }) {
        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.amount}>{item.amount.toLocaleString()} FC</Text>
                    <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                        <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
                            {item.status.toUpperCase()}
                        </Text>
                    </View>
                </View>
                <Text style={styles.date}>
                    {new Date(item.requested_at).toLocaleDateString()}
                </Text>
                {item.mobile_money_number && (
                    <Text style={styles.phone}>📞 {item.mobile_money_number}</Text>
                )}
                {item.rejection_reason && (
                    <Text style={styles.reason}>⚠️ {item.rejection_reason}</Text>
                )}
            </View>
        )
    }

    return (
        <View style={styles.container}>
            {/* Request Form */}
            <View style={styles.formCard}>
                <Text style={styles.balanceTitle}>Solde Disponible</Text>
                <Text style={styles.balanceAmount}>{balance.toLocaleString()} FC</Text>

                <Text style={styles.label}>Montant à retirer (FC)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor="#94A3B8"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                />

                <Text style={styles.label}>Numéro Mobile Money</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: 0812345678"
                    placeholderTextColor="#94A3B8"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                />

                <TouchableOpacity
                    style={[styles.button, (!amount || !phoneNumber) && styles.buttonDisabled]}
                    onPress={handleRequestPayout}
                    disabled={submitting || !amount || !phoneNumber}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Demander le retrait</Text>
                    )}
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Historique</Text>

            {loading ? (
                <ActivityIndicator color="#6366F1" />
            ) : (
                <FlatList
                    data={payouts}
                    renderItem={renderPayout}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>Aucune demande de retrait.</Text>
                    }
                />
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    formCard: {
        backgroundColor: '#1E293B',
        margin: 20,
        padding: 20,
        borderRadius: 16,
    },
    balanceTitle: {
        color: '#94A3B8',
        fontSize: 14,
        textAlign: 'center',
    },
    balanceAmount: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    label: {
        color: '#E2E8F0',
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#0F172A',
        borderRadius: 12,
        padding: 16,
        color: '#FFFFFF',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    button: {
        backgroundColor: '#6366F1',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#475569',
        opacity: 0.7,
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    sectionTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 20,
        marginBottom: 10,
    },
    listContent: {
        padding: 20,
        paddingTop: 0,
    },
    card: {
        backgroundColor: '#1E293B',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    amount: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    date: {
        color: '#94A3B8',
        fontSize: 14,
    },
    phone: {
        color: '#CBD5E1',
        marginTop: 4,
    },
    reason: {
        color: '#EF4444',
        marginTop: 8,
        fontStyle: 'italic',
    },
    emptyText: {
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 20,
    },
})
