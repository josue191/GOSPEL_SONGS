import { useState, useEffect } from 'react'
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    TextInput,
    Alert,
    Modal,
} from 'react-native'
import { supabase } from '../../lib/supabase'
import { Database } from '../../types/database.types'

type Song = Database['public']['Tables']['songs']['Row']

export default function SongsScreen() {
    const [songs, setSongs] = useState<Song[]>([])
    const [loading, setLoading] = useState(true)

    // Add Song Form State
    const [modalVisible, setModalVisible] = useState(false)
    const [newSongTitle, setNewSongTitle] = useState('')
    const [newSongUrl, setNewSongUrl] = useState('')
    const [adding, setAdding] = useState(false)

    useEffect(() => {
        fetchSongs()
    }, [])

    async function fetchSongs() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('songs')
                .select('*')
                .eq('artist_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setSongs(data || [])
        } catch (error) {
            console.error('Error fetching songs:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleAddSong() {
        if (!newSongTitle || !newSongUrl) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs')
            return
        }

        setAdding(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await supabase
                .from('songs')
                .insert({
                    artist_id: user.id,
                    title: newSongTitle,
                    audio_url: newSongUrl,
                    is_public: true
                })

            if (error) throw error

            Alert.alert('Succès', 'Chanson ajoutée avec succès')
            setModalVisible(false)
            setNewSongTitle('')
            setNewSongUrl('')
            fetchSongs() // Refresh list
        } catch (error: any) {
            Alert.alert('Erreur', error.message)
        } finally {
            setAdding(false)
        }
    }

    function renderSong({ item }: { item: Song }) {
        return (
            <View style={styles.songCard}>
                <View style={styles.songIconContainer}>
                    <Text style={styles.songIcon}>🎵</Text>
                </View>
                <View style={styles.songInfo}>
                    <Text style={styles.songTitle}>{item.title}</Text>
                    <Text style={styles.songStats}>
                        🎧 {item.play_count} écoutes
                    </Text>
                </View>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>
                        {item.is_public ? 'Public' : 'Privé'}
                    </Text>
                </View>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.addButtonText}>+ Ajouter une chanson</Text>
            </TouchableOpacity>

            {loading ? (
                <ActivityIndicator color="#6366F1" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={songs}
                    renderItem={renderSong}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>Vous n'avez pas encore ajouté de chansons.</Text>
                    }
                />
            )}

            {/* Add Song Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Ajouter une chanson</Text>

                        <Text style={styles.label}>Titre</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Titre de la chanson"
                            placeholderTextColor="#94A3B8"
                            value={newSongTitle}
                            onChangeText={setNewSongTitle}
                        />

                        <Text style={styles.label}>URL Audio (MP3)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="https://..."
                            placeholderTextColor="#94A3B8"
                            value={newSongUrl}
                            onChangeText={setNewSongUrl}
                            autoCapitalize="none"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Annuler</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleAddSong}
                                disabled={adding}
                            >
                                {adding ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.confirmButtonText}>Ajouter</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    addButton: {
        backgroundColor: '#6366F1',
        margin: 20,
        marginBottom: 10,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    songCard: {
        flexDirection: 'row',
        backgroundColor: '#1E293B',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        alignItems: 'center',
    },
    songIconContainer: {
        width: 48,
        height: 48,
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    songIcon: {
        fontSize: 24,
    },
    songInfo: {
        flex: 1,
    },
    songTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    songStats: {
        color: '#94A3B8',
        fontSize: 14,
    },
    statusBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyText: {
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 40,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1E293B',
        borderRadius: 20,
        padding: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 20,
        textAlign: 'center',
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
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#334155',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    },
    modalButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#334155',
    },
    confirmButton: {
        backgroundColor: '#6366F1',
    },
    cancelButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
})
