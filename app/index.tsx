// ============================================
// AFRISENS - Écran Principal
// Sélection du mode : Invité ou Artiste
// ============================================

import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { Colors } from '../constants/Colors'

const { width } = Dimensions.get('window')

export default function IndexScreen() {
    const router = useRouter()
    const colorTheme = Colors.dark // Force dark theme for the welcome screen to match icon vibe

    return (
        <View style={[styles.container, { backgroundColor: colorTheme.background }]}>
            <StatusBar barStyle="light-content" />

            {/* Header Area */}
            <View style={styles.header}>
                <View style={styles.logoPlaceholder}>
                    <Text style={styles.logoText}>A</Text>
                </View>
                <Text style={styles.title}>AFRISENS</Text>
                <View style={styles.titleUnderline} />
                <Text style={[styles.subtitle, { color: colorTheme.muted }]}>
                    Soutenez la louange, encouragez les cœurs.
                </Text>
            </View>

            {/* Choix du Mode */}
            <View style={styles.modesContainer}>
                {/* Mode Invité */}
                <TouchableOpacity
                    style={[styles.modeButton, { backgroundColor: colorTheme.card, borderColor: colorTheme.primary }]}
                    onPress={() => router.push('/(guest)/artists')}
                    activeOpacity={0.8}
                >
                    <View style={[styles.iconContainer, { backgroundColor: colorTheme.primary + '20' }]}>
                        <Text style={styles.modeIcon}>🙏</Text>
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={[styles.modeTitle, { color: colorTheme.text }]}>Je veux soutenir</Text>
                        <Text style={[styles.modeDescription, { color: colorTheme.muted }]}>
                            Encouragez vos chantres gospel par des dons sécurisés.
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Mode Artiste */}
                <TouchableOpacity
                    style={[styles.modeButton, styles.premiumButton, { borderColor: colorTheme.accent }]}
                    onPress={() => router.push('/(artist)/auth/login')}
                    activeOpacity={0.8}
                >
                    <View style={[styles.iconContainer, { backgroundColor: colorTheme.accent + '20' }]}>
                        <Text style={styles.modeIcon}>🎤</Text>
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={[styles.modeTitle, { color: colorTheme.text }]}>Je suis chantre</Text>
                        <Text style={[styles.modeDescription, { color: colorTheme.muted }]}>
                            Gérez votre ministère et recevez vos soutiens.
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <View style={styles.divider} />
                <Text style={[styles.footerText, { color: colorTheme.muted }]}>
                    Paiements 100% sécurisés
                </Text>
                <Text style={[styles.secureText, { color: colorTheme.accent }]}>
                    Mobile Money & Cartes
                </Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
    },
    header: {
        marginTop: 60,
        marginBottom: 40,
        alignItems: 'center',
    },
    logoPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: '#1E3A8A',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#1E3A8A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 10,
    },
    logoText: {
        fontSize: 40,
        fontWeight: '900',
        color: '#F59E0B',
    },
    title: {
        fontSize: 36,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 3,
    },
    titleUnderline: {
        width: 40,
        height: 4,
        backgroundColor: '#F59E0B',
        marginTop: 4,
        borderRadius: 2,
    },
    subtitle: {
        fontSize: 16,
        marginTop: 15,
        textAlign: 'center',
        fontWeight: '500',
        maxWidth: '80%',
    },
    modesContainer: {
        flex: 1,
        justifyContent: 'center',
        gap: 20,
    },
    modeButton: {
        flexDirection: 'row',
        padding: 24,
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    premiumButton: {
        backgroundColor: '#1E293B',
        borderWidth: 1.5,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    modeIcon: {
        fontSize: 28,
    },
    textContainer: {
        flex: 1,
    },
    modeTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 4,
    },
    modeDescription: {
        fontSize: 13,
        lineHeight: 18,
    },
    footer: {
        paddingVertical: 30,
        alignItems: 'center',
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#334155',
        marginBottom: 20,
    },
    footerText: {
        fontSize: 13,
        fontWeight: '600',
    },
    secureText: {
        fontSize: 12,
        fontWeight: '800',
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
})
