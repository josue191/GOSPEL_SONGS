import { useState } from 'react'
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
} from 'react-native'
import { Link, useRouter } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import { Colors } from '../../../constants/Colors'
import { Typography } from '../../../constants/Typography'

export default function LoginScreen() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const theme = Colors.dark

    async function signInWithEmail() {
        setLoading(true)
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) Alert.alert('Erreur', error.message)
            else {
                // Check if user is actually an artist
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', (await supabase.auth.getUser()).data.user?.id)
                    .single()

                if (profile?.role === 'artist') {
                    router.replace('/(artist)/dashboard')
                } else {
                    Alert.alert('Accès refusé', "Ce compte n'est pas un compte artiste.")
                    await supabase.auth.signOut()
                }
            }
        } catch (error) {
            Alert.alert('Erreur', 'Une erreur inattendue est survenue')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <StatusBar barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.icon}>🎤</Text>
                    <Text style={[styles.title, { color: theme.text }]}>Espace Artiste</Text>
                    <Text style={[styles.subtitle, { color: theme.muted }]}>Connectez-vous pour gérer votre musique</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>Email</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                            placeholder="votre@email.com"
                            placeholderTextColor={theme.muted}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>Mot de passe</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                            placeholder="••••••••"
                            placeholderTextColor={theme.muted}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.accent }]}
                        onPress={signInWithEmail}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color={theme.primary} />
                        ) : (
                            <Text style={[styles.buttonText, { color: theme.primary }]}>Se connecter</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: theme.muted }]}>Pas encore de compte ?</Text>
                        <Link href="/(artist)/auth/register" asChild>
                            <TouchableOpacity>
                                <Text style={[styles.link, { color: theme.accent }]}>S'inscrire</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    icon: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        ...Typography.presets.heading2,
        marginBottom: 8,
    },
    subtitle: {
        ...Typography.presets.body,
        textAlign: 'center',
    },
    form: {
        gap: 24,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        ...Typography.presets.bodySmall,
        fontFamily: Typography.families.medium,
    },
    input: {
        borderRadius: 16,
        padding: 18,
        ...Typography.presets.body,
        borderWidth: 1,
    },
    button: {
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: Colors.dark.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    buttonText: {
        ...Typography.presets.bodyBold,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
    },
    footerText: {
        ...Typography.presets.bodySmall,
    },
    link: {
        ...Typography.presets.bodyBold,
        fontSize: 14,
    },
})
