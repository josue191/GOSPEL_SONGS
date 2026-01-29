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
    StatusBar,
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { Database } from '../../types/database.types'
import { Colors } from '../../constants/Colors'
import { Typography } from '../../constants/Typography'

type Artist = Database['public']['Tables']['artists']['Row']

export default function ArtistsScreen() {
    const router = useRouter()
    const theme = Colors.dark
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
                style={[styles.artistCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => router.push(`/(guest)/artist/${item.id}`)}
                activeOpacity={0.7}
            >
                {/* Profile Image with subtle border */}
                <View style={[styles.artistImageContainer, { borderColor: theme.accent + '30' }]}>
                    {item.profile_image_url ? (
                        <Image
                            source={{ uri: item.profile_image_url }}
                            style={styles.artistImage}
                        />
                    ) : (
                        <View style={[styles.artistImage, styles.placeholderImage, { backgroundColor: theme.secondary }]}>
                            <Text style={[styles.placeholderText, { color: theme.accent }]}>
                                {item.stage_name.charAt(0)}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Artist Info */}
                <View style={styles.artistInfo}>
                    <Text style={[styles.artistName, { color: theme.text }]}>{item.stage_name}</Text>
                    {item.church_name && (
                        <Text style={[styles.artistChurch, { color: theme.muted }]}>
                            ⛪ {item.church_name}
                        </Text>
                    )}
                    {item.bio && (
                        <Text style={[styles.artistBio, { color: theme.muted + 'CC' }]} numberOfLines={1}>
                            {item.bio}
                        </Text>
                    )}
                </View>

                {/* Action Indicator */}
                <View style={[styles.actionIndicator, { backgroundColor: theme.primary + '20' }]}>
                    <Text style={[styles.arrow, { color: theme.accent }]}>→</Text>
                </View>
            </TouchableOpacity>
        )
    }

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.accent} />
                <Text style={[styles.loadingText, { color: theme.muted }]}>Chargement des chantres...</Text>
            </View>
        )
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle="light-content" />

            {/* Search Header */}
            <View style={styles.headerContainer}>
                <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder="Rechercher un chantre..."
                        placeholderTextColor={theme.muted}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            {/* Artists List */}
            <FlatList
                data={filteredArtists}
                renderItem={renderArtist}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>🎵</Text>
                        <Text style={[styles.emptyText, { color: theme.muted }]}>Aucun chantre trouvé</Text>
                    </View>
                }
            />

            {/* Floating History Button */}
            <TouchableOpacity
                style={[styles.historyButton, { backgroundColor: theme.accent }]}
                onPress={() => router.push('/(guest)/history')}
                activeOpacity={0.9}
            >
                <Text style={styles.historyButtonText}>📜 MES DONS</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        ...Typography.presets.body,
    },
    headerContainer: {
        padding: 20,
        paddingBottom: 10,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        height: 56,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    searchIcon: {
        fontSize: 18,
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        ...Typography.presets.body,
    },
    listContent: {
        padding: 20,
        paddingBottom: 100,
    },
    artistCard: {
        flexDirection: 'row',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    artistImageContainer: {
        width: 60,
        height: 60,
        borderRadius: 18,
        borderWidth: 2,
        padding: 2,
        marginRight: 16,
    },
    artistImage: {
        width: '100%',
        height: '100%',
        borderRadius: 14,
    },
    placeholderImage: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        ...Typography.presets.heading2,
    },
    artistInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    artistName: {
        ...Typography.presets.heading3,
        marginBottom: 2,
    },
    artistChurch: {
        ...Typography.presets.bodySmall,
        fontFamily: Typography.families.medium,
        marginBottom: 4,
    },
    artistBio: {
        ...Typography.presets.bodySmall,
        fontSize: 12,
        fontStyle: 'italic',
    },
    actionIndicator: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrow: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    emptyState: {
        padding: 60,
        alignItems: 'center',
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
        opacity: 0.3,
    },
    emptyText: {
        ...Typography.presets.body,
    },
    historyButton: {
        position: 'absolute',
        bottom: 24,
        alignSelf: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        shadowColor: Colors.dark.accent,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    historyButtonText: {
        ...Typography.presets.caption,
        color: Colors.dark.primary,
        letterSpacing: 2,
    },
})
