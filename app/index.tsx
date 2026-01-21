// ============================================
// AFRISENS - Mode Selection Screen
// First screen: Guest vs Artist
// ============================================

import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native'
import { useRouter } from 'expo-router'

export default function IndexScreen() {
    const router = useRouter()

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>AFRISENS</Text>
                <Text style={styles.subtitle}>Soutenez vos artistes gospel préférés</Text>
            </View>

            {/* Mode Selection */}
            <View style={styles.modesContainer}>
                {/* Guest Mode - Primary CTA */}
                <TouchableOpacity
                    style={[styles.modeButton, styles.guestButton]}
                    onPress={() => router.push('/(guest)/artists')}
                >
                    <Text style={styles.modeIcon}>🙏</Text>
                    <Text style={styles.modeTitle}>Je veux soutenir</Text>
                    <Text style={styles.modeDescription}>
                        Faites un don à vos chanteurs gospel
                    </Text>
                </TouchableOpacity>

                {/* Artist Mode - Secondary */}
                <TouchableOpacity
                    style={[styles.modeButton, styles.artistButton]}
                    onPress={() => router.push('/(artist)/auth/login')}
                >
                    <Text style={styles.modeIcon}>🎤</Text>
                    <Text style={styles.modeTitle}>Je suis chanteur</Text>
                    <Text style={styles.modeDescription}>
                        Accédez à votre espace artiste
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Paiements sécurisés via Mobile Money
                </Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A', // Dark blue
        padding: 20,
    },
    header: {
        marginTop: 80,
        marginBottom: 60,
        alignItems: 'center',
    },
    title: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 12,
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 16,
        color: '#94A3B8',
        textAlign: 'center',
    },
    modesContainer: {
        flex: 1,
        justifyContent: 'center',
        gap: 20,
    },
    modeButton: {
        padding: 32,
        borderRadius: 16,
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    guestButton: {
        backgroundColor: '#10B981', // Green
    },
    artistButton: {
        backgroundColor: '#6366F1', // Purple
    },
    modeIcon: {
        fontSize: 48,
    },
    modeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    modeDescription: {
        fontSize: 14,
        color: '#E5E7EB',
        textAlign: 'center',
    },
    footer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#64748B',
    },
})
