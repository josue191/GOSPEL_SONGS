import { useState, useEffect } from 'react'
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
} from 'react-native'
import { supabase } from '../../lib/supabase'
import { Database } from '../../types/database.types'

type Transaction = Database['public']['Tables']['transactions']['Row'] & {
    payment_attempt: Database['public']['Tables']['payment_attempts']['Row']
}

export default function TransactionsScreen() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchTransactions()
    }, [])

    async function fetchTransactions() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('transactions')
                .select('*, payment_attempt:payment_attempts(*)')
                .eq('artist_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setTransactions(data || [])
        } catch (error) {
            console.error('Error fetching transactions:', error)
        } finally {
            setLoading(false)
        }
    }

    function renderTransaction({ item }: { item: Transaction }) {
        return (
            <View style={styles.card}>
                <View style={styles.row}>
                    <View>
                        <Text style={styles.donorName}>
                            {item.donor_name || 'Donateur Anonyme'}
                        </Text>
                        <Text style={styles.date}>
                            {new Date(item.created_at).toLocaleDateString()} à {new Date(item.created_at).toLocaleTimeString()}
                        </Text>
                    </View>
                    <View style={styles.amountContainer}>
                        <Text style={styles.netAmount}>+{item.net_amount.toLocaleString()} FC</Text>
                        <Text style={styles.grossAmount}>{item.gross_amount.toLocaleString()} FC (brut)</Text>
                    </View>
                </View>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator color="#6366F1" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={transactions}
                    renderItem={renderTransaction}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>Aucun don reçu pour le moment.</Text>
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
    listContent: {
        padding: 20,
    },
    card: {
        backgroundColor: '#1E293B',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    donorName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    date: {
        color: '#94A3B8',
        fontSize: 12,
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    netAmount: {
        color: '#10B981',
        fontSize: 18,
        fontWeight: 'bold',
    },
    grossAmount: {
        color: '#64748B',
        fontSize: 12,
    },
    emptyText: {
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16,
    },
})
