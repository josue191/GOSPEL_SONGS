// ============================================
// AFRISENS - Artist Detail & Donation Flow
// Guest can view artist profile and make donation
// ============================================

import { useState, useEffect, useRef } from 'react'
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    TextInput,
    Modal,
    Image,
    Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { WebView } from 'react-native-webview'
import { supabase } from '../../../lib/supabase'
import { getDeviceId } from '../../../lib/deviceId'
import { Database } from '../../../types/database.types'

type Artist = Database['public']['Tables']['artists']['Row']
type Song = Database['public']['Tables']['songs']['Row']

export default function ArtistDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const router = useRouter()

    const [artist, setArtist] = useState<Artist | null>(null)
    const [songs, setSongs] = useState<Song[]>([])
    const [loading, setLoading] = useState(true)

    // Donation state
    const [showDonationModal, setShowDonationModal] = useState(false)
    const [amount, setAmount] = useState('')
    const [donorName, setDonorName] = useState('')
    const [processing, setProcessing] = useState(false)

    // Payment WebView
    const [showPaymentWebView, setShowPaymentWebView] = useState(false)
    const [paymentUrl, setPaymentUrl] = useState('')

    useEffect(() => {
        if (id) {
            fetchArtistData()
        }
    }, [id])

    async function fetchArtistData() {
        try {
            // Fetch artist
            const { data: artistData, error: artistError } = await supabase
                .from('artists')
                .select('*')
                .eq('id', id)
                .single()

            if (artistError) throw artistError
            setArtist(artistData)

            // Fetch songs
            const { data: songsData, error: songsError } = await supabase
                .from('songs')
                .select('*')
                .eq('artist_id', id)
                .eq('is_public', true)
                .order('created_at', { ascending: false })

            if (!songsError) {
                setSongs(songsData || [])
            }
        } catch (error) {
            console.error('Error fetching artist:', error)
            Alert.alert('Erreur', 'Impossible de charger les données de l\'artiste')
        } finally {
            setLoading(false)
        }
    }

    async function handleDonatePress() {
        setShowDonationModal(true)
    }

    async function initiatePayment() {
        if (!amount || parseFloat(amount) <= 0) {
            Alert.alert('Erreur', 'Veuillez entrer un montant valide')
            return
        }

        setProcessing(true)

        try {
            const deviceId = await getDeviceId()

            // Call Edge Function to create payment
            const { data, error } = await supabase.functions.invoke('create-payment', {
                body: {
                    artist_id: id,
                    amount: parseFloat(amount),
                    currency: 'USD',
                    donor_name: donorName || 'Anonyme',
                    device_id: deviceId,
                },
            })

            if (error) throw error

            if (data.success && data.payment_url) {
                // Close donation modal and open WebView
                setShowDonationModal(false)
                setPaymentUrl(data.payment_url)
                setShowPaymentWebView(true)
            } else {
                throw new Error('Payment initialization failed')
            }
        } catch (error) {
            console.error('Payment error:', error)
            Alert.alert('Erreur', 'Impossible d\'initier le paiement. Veuillez réessayer.')
        } finally {
            setProcessing(false)
        }
    }

    function handleWebViewNavigation(navState: any) {
        const { url } = navState

        // Deep link callback from CinetPay
        if (url.startsWith('afrisens://payment-return')) {
            setShowPaymentWebView(false)

            // Show success message
            Alert.alert(
                'Paiement en cours',
                'Votre paiement est en cours de traitement. Vous recevrez une notification de confirmation.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Reset and go back
                            setAmount('')
                            setDonorName('')
                            router.back()
                        },
                    },
                ]
            )
        }
    }

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        )
    }

    if (!artist) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <Text style={styles.errorText}>Artiste non trouvé</Text>
            </View>
        )
    }

    return (
        <>
            <ScrollView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    {artist.profile_image_url ? (
                        <Image
                            source={{ uri: artist.profile_image_url }}
                            style={styles.profileImage}
                        />
                    ) : (
                        <View style={[styles.profileImage, styles.placeholderImage]}>
                            <Text style={styles.placeholderText}>
                                {artist.stage_name.charAt(0)}
                            </Text>
                        </View>
                    )}

                    <Text style={styles.artistName}>{artist.stage_name}</Text>
                    {artist.church_name && (
                        <Text style={styles.churchName}>🏛️ {artist.church_name}</Text>
                    )}
                    {artist.bio && (
                        <Text style={styles.bio}>{artist.bio}</Text>
                    )}
                </View>

                {/* Songs Section */}
                {songs.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Chansons ({songs.length})</Text>
                        {songs.map((song) => (
                            <View key={song.id} style={styles.songCard}>
                                <Text style={styles.songTitle}>🎵 {song.title}</Text>
                                {/* TODO: Add audio player */}
                            </View>
                        ))}
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Donate Button */}
            <TouchableOpacity
                style={styles.donateButton}
                onPress={handleDonatePress}
            >
                <Text style={styles.donateButtonText}>💝 Faire un Don</Text>
            </TouchableOpacity>

            {/* Donation Modal */}
            <Modal
                visible={showDonationModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowDonationModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Faire un Don</Text>
                        <Text style={styles.modalSubtitle}>
                            Pour {artist.stage_name}
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Montant (USD)"
                            placeholderTextColor="#64748B"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Votre nom (optionnel)"
                            placeholderTextColor="#64748B"
                            value={donorName}
                            onChangeText={setDonorName}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowDonationModal(false)}
                                disabled={processing}
                            >
                                <Text style={styles.cancelButtonText}>Annuler</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={initiatePayment}
                                disabled={processing}
                            >
                                {processing ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.confirmButtonText}>Continuer</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Payment WebView Modal */}
            <Modal
                visible={showPaymentWebView}
                animationType="slide"
                onRequestClose={() => setShowPaymentWebView(false)}
            >
                <View style={styles.webViewContainer}>
                    <View style={styles.webViewHeader}>
                        <Text style={styles.webViewTitle}>Paiement Sécurisé</Text>
                        <TouchableOpacity
                            onPress={() => {
                                Alert.alert(
                                    'Annuler le paiement?',
                                    'Êtes-vous sûr de vouloir annuler?',
                                    [
                                        { text: 'Non' },
                                        {
                                            text: 'Oui',
                                            onPress: () => setShowPaymentWebView(false),
                                        },
                                    ]
                                )
                            }}
                        >
                            <Text style={styles.closeButton}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <WebView
                        source={{ uri: paymentUrl }}
                        onNavigationStateChange={handleWebViewNavigation}
                        startInLoadingState
                        renderLoading={() => (
                            <ActivityIndicator
                                size="large"
                                color="#10B981"
                                style={styles.webViewLoading}
                            />
                        )}
                    />
                </View>
            </Modal>
        </>
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
    },
    errorText: {
        color: '#EF4444',
        fontSize: 16,
    },
    header: {
        alignItems: 'center',
        padding: 24,
        gap: 12,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 8,
    },
    placeholderImage: {
        backgroundColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#FFFFFF',
        fontSize: 48,
        fontWeight: 'bold',
    },
    artistName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    churchName: {
        fontSize: 16,
        color: '#94A3B8',
    },
    bio: {
        fontSize: 14,
        color: '#CBD5E1',
        textAlign: 'center',
        paddingHorizontal: 16,
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 12,
    },
    songCard: {
        backgroundColor: '#1E293B',
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
    },
    songTitle: {
        color: '#FFFFFF',
        fontSize: 16,
    },
    donateButton: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: '#10B981',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    donateButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 24,
        gap: 16,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 16,
        color: '#94A3B8',
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#0F172A',
        borderRadius: 8,
        padding: 16,
        color: '#FFFFFF',
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    modalButton: {
        flex: 1,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#374151',
    },
    cancelButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    confirmButton: {
        backgroundColor: '#10B981',
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    webViewContainer: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    webViewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingTop: 48,
        backgroundColor: '#1E293B',
    },
    webViewTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        color: '#FFFFFF',
        fontSize: 32,
        paddingHorizontal: 8,
    },
    webViewLoading: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -20,
        marginTop: -20,
    },
})
