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
} from 'react-native'
import { Link, useRouter } from 'expo-router'
import { supabase } from '../../../lib/supabase'

export default function RegisterScreen() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [stageName, setStageName] = useState('')
    const [churchName, setChurchName] = useState('')
    const [videoUrl, setVideoUrl] = useState('')
    const [loading, setLoading] = useState(false)

    async function signUp() {
        if (!email || !password || !stageName || !videoUrl) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires')
            return
        }

        setLoading(true)
        try {
            // 1. Create Auth User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            })

            if (authError) throw authError
            if (!authData.user) throw new Error('No user data returned')

            // 2. Create Profile
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: authData.user.id,
                    role: 'artist',
                })

            if (profileError) throw profileError

            // 3. Create Artist Entry
            const { error: artistError } = await supabase
                .from('artists')
                .insert({
                    id: authData.user.id,
                    stage_name: stageName,
                    church_name: churchName || null,
                    verification_video_url: videoUrl,
                    is_verified: false, // Default to unverified
                })

            if (artistError) throw artistError

            // 4. Initialize Balance
            const { error: balanceError } = await supabase
                .from('artist_balances')
                .insert({
                    artist_id: authData.user.id,
                    available_balance: 0,
                    total_earned: 0,
                    total_withdrawn: 0,
                })

            if (balanceError) throw balanceError

            Alert.alert(
                'Succès',
                'Votre compte a été créé ! Votre vérification est en cours.',
                [
                    {
                        text: 'Se connecter',
                        onPress: () => router.replace('/(artist)/auth/login'),
                    },
                ]
            )
        } catch (error: any) {
            Alert.alert('Erreur', error.message || "Une erreur s'est produite")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Créer un compte</Text>
                    <Text style={styles.subtitle}>Rejoignez la communauté AFRISENS</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nom de scène *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Frère Moïse"
                            placeholderTextColor="#64748B"
                            value={stageName}
                            onChangeText={setStageName}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="votre@email.com"
                            placeholderTextColor="#64748B"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mot de passe *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Minimum 6 caractères"
                            placeholderTextColor="#64748B"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Église (Optionnel)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Eglise Cité Bethel"
                            placeholderTextColor="#64748B"
                            value={churchName}
                            onChangeText={setChurchName}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Lien Vidéo de Vérification *</Text>
                        <Text style={styles.helperText}>Lien YouTube/Facebook chantant une de vos chansons</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="https://youtube.com/..."
                            placeholderTextColor="#64748B"
                            value={videoUrl}
                            onChangeText={setVideoUrl}
                            autoCapitalize="none"
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={signUp}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>S'inscrire</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Déjà un compte ?</Text>
                        <Link href="/(artist)/auth/login" asChild>
                            <TouchableOpacity>
                                <Text style={styles.link}>Se connecter</Text>
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
        backgroundColor: '#0F172A',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#94A3B8',
        textAlign: 'center',
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#E2E8F0',
    },
    helperText: {
        fontSize: 12,
        color: '#94A3B8',
        fontStyle: 'italic',
    },
    input: {
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: 16,
        color: '#FFFFFF',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    button: {
        backgroundColor: '#6366F1',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 12,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
        marginBottom: 32,
    },
    footerText: {
        color: '#94A3B8',
        fontSize: 14,
    },
    link: {
        color: '#818CF8',
        fontSize: 14,
        fontWeight: 'bold',
    },
})
