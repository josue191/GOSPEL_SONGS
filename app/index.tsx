// ============================================
// AFRISENS - Écran Principal
// Sélection du mode : Invité ou Artiste
// ============================================

import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Dimensions, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { Colors } from '../constants/Colors'
import { Typography } from '../constants/Typography'

const { width } = Dimensions.get('window')

export default function IndexScreen() {
    const router = useRouter()
    const colorTheme = Colors.dark // Force dark theme for the welcome screen to match icon vibe

    return (
        <View style={[styles.container, { backgroundColor: colorTheme.background }]}>
            <StatusBar barStyle="light-content" />

            {/* Header Area */}
            <View style={styles.header}>
                <Image
                    source={require('../assets/new_icon.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                />
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
                    <View style={styles.iconContainer}>
                        <Image
                            source={require('../assets/mains.png')}
                            style={{ width: 60, height: 60, borderRadius: 12 }}
                            resizeMode="cover"
                        />
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
                    <View style={styles.iconContainer}>
                        <Image
                            source={require('../assets/microphone.png')}
                            style={{ width: 60, height: 60, borderRadius: 12 }}
                            resizeMode="cover"
                        />
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
    logoImage: {
        width: 140,
        height: 140,
        marginBottom: 10,
    },
    titleUnderline: {
        width: 40,
        height: 4,
        backgroundColor: Colors.dark.accent,
        marginTop: 4,
        borderRadius: 2,
    },
    subtitle: {
        ...Typography.presets.body,
        marginTop: 15,
        textAlign: 'center',
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
        backgroundColor: Colors.dark.card,
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
    textContainer: {
        flex: 1,
    },
    modeTitle: {
        ...Typography.presets.heading3,
        marginBottom: 4,
    },
    modeDescription: {
        ...Typography.presets.bodySmall,
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
        ...Typography.presets.caption,
        textTransform: 'none',
    },
    secureText: {
        ...Typography.presets.caption,
        marginTop: 4,
        letterSpacing: 2,
    },
})
