// ============================================
// AFRISENS - Artists List (Guest Mode)
// Browse all verified gospel artists
// ============================================

import { useState, useEffect } from 'react'
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    TextInput,
    Image,
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { Database } from '../../types/database.types'

type Artist = Database['public']['Tables']['artists']['Row']

export default function ArtistsScreen() {
    const router = useRouter()
    const [artists, setArtists] = useState<Artist[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchArtists()
    }, [])

    async function fetchArtists() {
        try {
            const { data, error } = await supabase
                .from('artists')
                .select('*')
                .eq('is_verified', true)
                .order('created_at', { ascending: false })

            if (error) throw error
            setArtists(data || [])
        } catch (error) {
            console.error('Error fetching artists:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredArtists = artists.filter(
        (artist) =>
            artist.stage_name.toLowerCase().includes(search.toLowerCase()) ||
            artist.church_name?.toLowerCase().includes(search.toLowerCase())
    )

    function renderArtist({ item }: { item: Artist }) {
        return (
            <TouchableOpacity
                style={styles.artistCard}
                onPress={() => router.push(`/(guest)/artist/${item.id}`)}
            >
                {/* Profile Image */}
                <View style={styles.artistImageContainer}>
                    {item.profile_image_url ? (
                        <Image
                            source={{ uri: item.profile_image_url }}
                            style={styles.artistImage}
                        />
                    ) : (
                        <View style={[styles.artistImage, styles.placeholderImage]}>
                            <Text style={styles.placeholderText}>
                                {item.stage_name.charAt(0)}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Artist Info */}
                <View style={styles.artistInfo}>
                    <Text style={styles.artistName}>{item.stage_name}</Text>
                    {item.church_name && (
                        <Text style={styles.artistChurch}>🏛️ {item.church_name}</Text>
                    )}
                    {item.bio && (
                        <Text style={styles.artistBio} numberOfLines={2}>
                            {item.bio}
                        </Text>
                    )}
                </View>

                {/* Arrow */}
                <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
        )
    }

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.loadingText}>Chargement des artistes...</Text>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher un artiste..."
                    placeholderTextColor="#64748B"
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {/* Artists List */}
            <FlatList
                data={filteredArtists}
                renderItem={renderArtist}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>Aucun artiste trouvé</Text>
                    </View>
                }
            />

            {/* Floating History Button */}
            <TouchableOpacity
                style={styles.historyButton}
                onPress={() => router.push('/(guest)/history')}
            >
                <Text style={styles.historyButtonText}>📜 Mes Dons</Text>
            </TouchableOpacity>
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
    searchContainer: {
        padding: 16,
    },
    searchInput: {
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: 16,
        color: '#FFFFFF',
        fontSize: 16,
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    artistCard: {
        flexDirection: 'row',
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        alignItems: 'center',
        gap: 16,
    },
    artistImageContainer: {
        width: 64,
        height: 64,
    },
    artistImage: {
        width: 64,
        height: 64,
        borderRadius: 32,
    },
    placeholderImage: {
        backgroundColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    artistInfo: {
        flex: 1,
        gap: 4,
    },
    artistName: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    artistChurch: {
        color: '#94A3B8',
        fontSize: 14,
    },
    artistBio: {
        color: '#64748B',
        fontSize: 13,
        marginTop: 4,
    },
    arrow: {
        color: '#64748B',
        fontSize: 32,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#64748B',
        fontSize: 16,
    },
    historyButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: '#10B981',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    historyButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
})
