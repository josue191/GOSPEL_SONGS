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
    Image,
    StatusBar,
} from 'react-native'
import { Link, useRouter } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/Colors'
import { Typography } from '../../../constants/Typography'

type Step = 1 | 2 | 3

interface PasswordCriteria {
    minLength: boolean
    hasUpperCase: boolean
    hasLowerCase: boolean
    hasNumber: boolean
    hasSpecialChar: boolean
}

export default function RegisterScreen() {
    const router = useRouter()
    const theme = Colors.dark
    const [currentStep, setCurrentStep] = useState<Step>(1)
    const [loading, setLoading] = useState(false)

    // Step 1: Personal Information
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [stageName, setStageName] = useState('')
    const [gender, setGender] = useState<'M' | 'F' | ''>('')
    const [birthDate, setBirthDate] = useState('')
    const [phone, setPhone] = useState('')

    // Address fields (Nord-Kivu/Goma)
    const [province] = useState('Nord-Kivu')
    const [city] = useState('Goma')
    const [commune, setCommune] = useState('')
    const [avenue, setAvenue] = useState('')
    const [number, setNumber] = useState('')

    // Step 2: Verification Documents
    const [voterCardImage, setVoterCardImage] = useState<string | null>(null)
    const [selfieImage, setSelfieImage] = useState<string | null>(null)

    // Step 3: Security
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordCriteria, setPasswordCriteria] = useState<PasswordCriteria>({
        minLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false,
    })

    // Password validation in real-time
    const validatePassword = (pwd: string) => {
        setPassword(pwd)
        setPasswordCriteria({
            minLength: pwd.length >= 8,
            hasUpperCase: /[A-Z]/.test(pwd),
            hasLowerCase: /[a-z]/.test(pwd),
            hasNumber: /[0-9]/.test(pwd),
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
        })
    }

    const isPasswordValid = () => {
        return Object.values(passwordCriteria).every(criteria => criteria)
    }

    // Image picker functions
    const pickImage = async (type: 'voterCard' | 'selfie') => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

        if (status !== 'granted') {
            Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à vos photos')
            return
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: type === 'voterCard' ? [16, 9] : [1, 1],
            quality: 0.8,
        })

        if (!result.canceled && result.assets[0]) {
            if (type === 'voterCard') {
                setVoterCardImage(result.assets[0].uri)
            } else {
                setSelfieImage(result.assets[0].uri)
            }
        }
    }

    // Step validation
    const validateStep1 = () => {
        if (!firstName || !lastName || !stageName || !gender || !birthDate || !phone || !commune || !avenue) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires')
            return false
        }
        return true
    }

    const validateStep2 = () => {
        if (!voterCardImage || !selfieImage) {
            Alert.alert('Erreur', 'Veuillez télécharger votre carte d\'électeur et votre selfie')
            return false
        }
        return true
    }

    const validateStep3 = () => {
        if (!email || !password || !confirmPassword) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs')
            return false
        }
        if (!isPasswordValid()) {
            Alert.alert('Erreur', 'Le mot de passe ne respecte pas tous les critères de sécurité')
            return false
        }
        if (password !== confirmPassword) {
            Alert.alert('Erreur', 'Les mots de passe ne correspondent pas')
            return false
        }
        return true
    }

    const handleNext = () => {
        if (currentStep === 1 && validateStep1()) {
            setCurrentStep(2)
        } else if (currentStep === 2 && validateStep2()) {
            setCurrentStep(3)
        }
    }

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep((currentStep - 1) as Step)
        }
    }

    async function signUp() {
        if (!validateStep3()) return

        setLoading(true)
        try {
            // 1. Create Auth User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            })

            if (authError) throw authError
            if (!authData.user) throw new Error('No user data returned')

            // 2. Upload images to Supabase Storage
            let voterCardUrl = ''
            let selfieUrl = ''

            if (voterCardImage) {
                const voterCardExt = voterCardImage.split('.').pop()
                const voterCardPath = `${authData.user.id}/voter-card.${voterCardExt}`

                const response = await fetch(voterCardImage)
                const blob = await response.blob()

                const { data: voterCardData, error: voterCardError } = await supabase.storage
                    .from('verification-documents')
                    .upload(voterCardPath, blob)

                if (voterCardError) throw voterCardError
                voterCardUrl = voterCardPath
            }

            if (selfieImage) {
                const selfieExt = selfieImage.split('.').pop()
                const selfiePath = `${authData.user.id}/selfie.${selfieExt}`

                const response = await fetch(selfieImage)
                const blob = await response.blob()

                const { data: selfieData, error: selfieError } = await supabase.storage
                    .from('verification-documents')
                    .upload(selfiePath, blob)

                if (selfieError) throw selfieError
                selfieUrl = selfiePath
            }

            // 3. Create Profile
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: authData.user.id,
                    role: 'artist',
                })

            if (profileError) throw profileError

            // 4. Create Artist Entry with all information
            const fullAddress = `${number ? number + ', ' : ''}${avenue}, ${commune}, ${city}, ${province}`

            const { error: artistError } = await supabase
                .from('artists')
                .insert({
                    id: authData.user.id,
                    stage_name: stageName,
                    first_name: firstName,
                    last_name: lastName,
                    gender: gender,
                    birth_date: birthDate,
                    phone: phone,
                    address: fullAddress,
                    province: province,
                    city: city,
                    commune: commune,
                    avenue: avenue,
                    number: number,
                    voter_card_url: voterCardUrl,
                    selfie_url: selfieUrl,
                    is_verified: false,
                })

            if (artistError) throw artistError

            // 5. Initialize Balance
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
                '✅ Inscription réussie !',
                'Un e-mail de confirmation a été envoyé à votre adresse. Veuillez vérifier votre boîte de réception pour activer votre compte.',
                [
                    {
                        text: 'OK',
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

    const renderStepper = () => (
        <View style={styles.stepperContainer}>
            {[1, 2, 3].map((step) => (
                <View key={step} style={styles.stepWrapper}>
                    <View style={[
                        styles.stepCircle,
                        { borderColor: theme.border },
                        currentStep >= step && { backgroundColor: theme.accent, borderColor: theme.accent },
                        currentStep > step && { backgroundColor: '#10B981', borderColor: '#10B981' }
                    ]}>
                        {currentStep > step ? (
                            <Ionicons name="checkmark" size={20} color={theme.primary} />
                        ) : (
                            <Text style={[
                                styles.stepNumber,
                                { color: theme.muted },
                                currentStep >= step && { color: theme.primary }
                            ]}>{step}</Text>
                        )}
                    </View>
                    {step < 3 && (
                        <View style={[
                            styles.stepLine,
                            { backgroundColor: theme.border },
                            currentStep > step && { backgroundColor: '#10B981' }
                        ]} />
                    )}
                </View>
            ))}
        </View>
    )

    const renderPasswordCriteria = () => (
        <View style={styles.criteriaContainer}>
            <CriteriaItem
                text="Au moins 8 caractères"
                met={passwordCriteria.minLength}
            />
            <CriteriaItem
                text="Une lettre majuscule"
                met={passwordCriteria.hasUpperCase}
            />
            <CriteriaItem
                text="Une lettre minuscule"
                met={passwordCriteria.hasLowerCase}
            />
            <CriteriaItem
                text="Un chiffre"
                met={passwordCriteria.hasNumber}
            />
            <CriteriaItem
                text="Un caractère spécial (!@#$...)"
                met={passwordCriteria.hasSpecialChar}
            />
        </View>
    )

    const renderStep1 = () => (
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>📋 Informations Personnelles</Text>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Prénom *</Text>
                <View style={[styles.inputWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Ionicons name="person-outline" size={20} color={theme.accent} style={styles.inputIcon} />
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder="Votre prénom"
                        placeholderTextColor={theme.muted}
                        value={firstName}
                        onChangeText={setFirstName}
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Nom *</Text>
                <View style={[styles.inputWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Ionicons name="person-outline" size={20} color={theme.accent} style={styles.inputIcon} />
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder="Votre nom"
                        placeholderTextColor={theme.muted}
                        value={lastName}
                        onChangeText={setLastName}
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Nom de scène *</Text>
                <View style={[styles.inputWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Ionicons name="musical-notes-outline" size={20} color={theme.accent} style={styles.inputIcon} />
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder="Ex: Frère Moïse"
                        placeholderTextColor={theme.muted}
                        value={stageName}
                        onChangeText={setStageName}
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Sexe *</Text>
                <View style={styles.genderContainer}>
                    <TouchableOpacity
                        style={[styles.genderButton, { borderColor: theme.accent, backgroundColor: theme.card }, gender === 'M' && { backgroundColor: theme.accent }]}
                        onPress={() => setGender('M')}
                    >
                        <Ionicons
                            name="male"
                            size={24}
                            color={gender === 'M' ? theme.primary : theme.accent}
                        />
                        <Text style={[styles.genderText, { color: theme.accent }, gender === 'M' && { color: theme.primary }]}>
                            Masculin
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.genderButton, { borderColor: theme.accent, backgroundColor: theme.card }, gender === 'F' && { backgroundColor: theme.accent }]}
                        onPress={() => setGender('F')}
                    >
                        <Ionicons
                            name="female"
                            size={24}
                            color={gender === 'F' ? theme.primary : theme.accent}
                        />
                        <Text style={[styles.genderText, { color: theme.accent }, gender === 'F' && { color: theme.primary }]}>
                            Féminin
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Date de naissance *</Text>
                <View style={[styles.inputWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Ionicons name="calendar-outline" size={20} color={theme.accent} style={styles.inputIcon} />
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder="JJ/MM/AAAA"
                        placeholderTextColor={theme.muted}
                        value={birthDate}
                        onChangeText={setBirthDate}
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Téléphone *</Text>
                <View style={[styles.inputWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Ionicons name="call-outline" size={20} color={theme.accent} style={styles.inputIcon} />
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder="+243 XXX XXX XXX"
                        placeholderTextColor={theme.muted}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                    />
                </View>
            </View>

            <View style={[styles.addressSection, { borderTopColor: theme.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>📍 Adresse (Nord-Kivu, Goma)</Text>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.text }]}>Commune *</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
                        <Ionicons name="location-outline" size={20} color={theme.accent} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="Ex: Goma"
                            placeholderTextColor={theme.muted}
                            value={commune}
                            onChangeText={setCommune}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.text }]}>Avenue *</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
                        <Ionicons name="map-outline" size={20} color={theme.accent} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="Ex: Avenue de la Paix"
                            placeholderTextColor={theme.muted}
                            value={avenue}
                            onChangeText={setAvenue}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.text }]}>Numéro (Optionnel)</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
                        <Ionicons name="home-outline" size={20} color={theme.accent} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="Ex: 123"
                            placeholderTextColor={theme.muted}
                            value={number}
                            onChangeText={setNumber}
                        />
                    </View>
                </View>
            </View>
        </View>
    )

    const renderStep2 = () => (
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>📸 Documents de Vérification</Text>
            <Text style={[styles.cardSubtitle, { color: theme.muted }]}>
                Pour vérifier votre identité, nous avons besoin de votre carte d'électeur et d'un selfie
            </Text>

            <View style={styles.uploadSection}>
                <Text style={[styles.label, { color: theme.text }]}>Carte d'électeur *</Text>
                <TouchableOpacity
                    style={[styles.uploadButton, { borderColor: theme.border }]}
                    onPress={() => pickImage('voterCard')}
                >
                    {voterCardImage ? (
                        <View style={styles.imagePreviewContainer}>
                            <Image source={{ uri: voterCardImage }} style={styles.imagePreview} />
                            <View style={[styles.checkmarkOverlay, { backgroundColor: theme.card }]}>
                                <Ionicons name="checkmark-circle" size={32} color="#10B981" />
                            </View>
                        </View>
                    ) : (
                        <View style={[styles.uploadPlaceholder, { backgroundColor: theme.background }]}>
                            <Ionicons name="card-outline" size={48} color={theme.accent} />
                            <Text style={[styles.uploadText, { color: theme.accent }]}>Télécharger la carte d'électeur</Text>
                            <Text style={[styles.uploadHint, { color: theme.muted }]}>Format: JPG, PNG</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.uploadSection}>
                <Text style={[styles.label, { color: theme.text }]}>Selfie (Photo de vous) *</Text>
                <TouchableOpacity
                    style={[styles.uploadButton, { borderColor: theme.border }]}
                    onPress={() => pickImage('selfie')}
                >
                    {selfieImage ? (
                        <View style={styles.imagePreviewContainer}>
                            <Image source={{ uri: selfieImage }} style={styles.imagePreview} />
                            <View style={[styles.checkmarkOverlay, { backgroundColor: theme.card }]}>
                                <Ionicons name="checkmark-circle" size={32} color="#10B981" />
                            </View>
                        </View>
                    ) : (
                        <View style={[styles.uploadPlaceholder, { backgroundColor: theme.background }]}>
                            <Ionicons name="camera-outline" size={48} color={theme.accent} />
                            <Text style={[styles.uploadText, { color: theme.accent }]}>Prendre un selfie</Text>
                            <Text style={[styles.uploadHint, { color: theme.muted }]}>Photo claire de votre visage</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    )

    const renderStep3 = () => (
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>🔒 Sécurité du Compte</Text>
            <Text style={[styles.cardSubtitle, { color: theme.muted }]}>
                Créez un mot de passe sécurisé pour protéger votre compte
            </Text>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Email *</Text>
                <View style={[styles.inputWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Ionicons name="mail-outline" size={20} color={theme.accent} style={styles.inputIcon} />
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder="votre@email.com"
                        placeholderTextColor={theme.muted}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Mot de passe *</Text>
                <View style={[styles.inputWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Ionicons name="lock-closed-outline" size={20} color={theme.accent} style={styles.inputIcon} />
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder="Créer un mot de passe"
                        placeholderTextColor={theme.muted}
                        value={password}
                        onChangeText={validatePassword}
                        secureTextEntry
                    />
                </View>
            </View>

            {password.length > 0 && renderPasswordCriteria()}

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Confirmer le mot de passe *</Text>
                <View style={[styles.inputWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Ionicons name="lock-closed-outline" size={20} color={theme.accent} style={styles.inputIcon} />
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder="Confirmer le mot de passe"
                        placeholderTextColor={theme.muted}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                    />
                </View>
                {confirmPassword.length > 0 && (
                    <View style={styles.matchIndicator}>
                        {password === confirmPassword ? (
                            <View style={styles.matchSuccess}>
                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                <Text style={styles.matchSuccessText}>Les mots de passe correspondent</Text>
                            </View>
                        ) : (
                            <View style={styles.matchError}>
                                <Ionicons name="close-circle" size={16} color="#EF4444" />
                                <Text style={styles.matchErrorText}>Les mots de passe ne correspondent pas</Text>
                            </View>
                        )}
                    </View>
                )}
            </View>
        </View>
    )

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <StatusBar barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]}>Créer un compte artiste</Text>
                    <Text style={[styles.subtitle, { color: theme.muted }]}>Rejoignez la communauté AFRISENS</Text>
                </View>

                {renderStepper()}

                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}

                <View style={styles.navigationButtons}>
                    {currentStep > 1 && (
                        <TouchableOpacity
                            style={[styles.backButton, { borderColor: theme.accent, backgroundColor: 'transparent' }]}
                            onPress={handleBack}
                        >
                            <Ionicons name="arrow-back" size={20} color={theme.accent} />
                            <Text style={[styles.backButtonText, { color: theme.accent }]}>Précédent</Text>
                        </TouchableOpacity>
                    )}

                    {currentStep < 3 ? (
                        <TouchableOpacity
                            style={[styles.nextButton, { backgroundColor: theme.accent }]}
                            onPress={handleNext}
                        >
                            <Text style={[styles.nextButtonText, { color: theme.primary }]}>Suivant</Text>
                            <Ionicons name="arrow-forward" size={20} color={theme.primary} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.submitButtonDisabled, { backgroundColor: '#10B981' }]}
                            onPress={signUp}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <>
                                    <Text style={styles.submitButtonText}>S'inscrire</Text>
                                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.muted }]}>Déjà un compte ?</Text>
                    <Link href="/(artist)/auth/login" asChild>
                        <TouchableOpacity>
                            <Text style={[styles.link, { color: theme.accent }]}>Se connecter</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

// Password Criteria Component
function CriteriaItem({ text, met }: { text: string; met: boolean }) {
    return (
        <View style={styles.criteriaItem}>
            <View style={[styles.criteriaCircle, met && styles.criteriaCircleMet]}>
                {met && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
            </View>
            <Text style={[styles.criteriaText, met && styles.criteriaTextMet]}>
                {text}
            </Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 20,
    },
    title: {
        ...Typography.presets.heading2,
        marginBottom: 8,
    },
    subtitle: {
        ...Typography.presets.body,
        textAlign: 'center',
    },

    // Stepper Styles
    stepperContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    stepWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    stepNumber: {
        ...Typography.presets.bodyBold,
        fontSize: 16,
    },
    stepLine: {
        width: 60,
        height: 3,
        marginHorizontal: 8,
    },

    // Card Styles
    card: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    cardTitle: {
        ...Typography.presets.heading3,
        marginBottom: 8,
    },
    cardSubtitle: {
        ...Typography.presets.bodySmall,
        marginBottom: 20,
    },

    // Input Styles
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        ...Typography.presets.bodySmall,
        fontFamily: Typography.families.medium,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        padding: 16,
        ...Typography.presets.body,
    },

    // Gender Selection
    genderContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    genderButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1.5,
        gap: 8,
    },
    genderText: {
        ...Typography.presets.bodyBold,
        fontSize: 15,
    },

    // Address Section
    addressSection: {
        marginTop: 12,
        paddingTop: 20,
        borderTopWidth: 1,
    },
    sectionTitle: {
        ...Typography.presets.bodyBold,
        marginBottom: 16,
    },

    // Upload Styles
    uploadSection: {
        marginBottom: 24,
    },
    uploadButton: {
        borderRadius: 16,
        borderWidth: 2,
        borderStyle: 'dashed',
        overflow: 'hidden',
    },
    uploadPlaceholder: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadText: {
        ...Typography.presets.bodyBold,
        fontSize: 15,
        marginTop: 12,
    },
    uploadHint: {
        ...Typography.presets.caption,
        textTransform: 'none',
        marginTop: 4,
    },
    imagePreviewContainer: {
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
    },
    checkmarkOverlay: {
        position: 'absolute',
        top: 12,
        right: 12,
        borderRadius: 20,
        padding: 4,
    },

    // Password Criteria
    criteriaContainer: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        padding: 16,
        marginTop: 12,
        gap: 10,
    },
    criteriaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    criteriaCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    criteriaCircleMet: {
        backgroundColor: '#10B981',
    },
    criteriaText: {
        ...Typography.presets.caption,
        textTransform: 'none',
    },
    criteriaTextMet: {
        color: '#10B981',
        fontFamily: Typography.families.medium,
    },

    // Match Indicator
    matchIndicator: {
        marginTop: 8,
    },
    matchSuccess: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    matchSuccessText: {
        ...Typography.presets.caption,
        textTransform: 'none',
        color: '#10B981',
        fontFamily: Typography.families.medium,
    },
    matchError: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    matchErrorText: {
        ...Typography.presets.caption,
        textTransform: 'none',
        color: '#EF4444',
        fontFamily: Typography.families.medium,
    },

    // Navigation Buttons
    navigationButtons: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    backButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 16,
        borderWidth: 1.5,
        gap: 8,
    },
    backButtonText: {
        ...Typography.presets.bodyBold,
    },
    nextButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 16,
        gap: 8,
        shadowColor: Colors.dark.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    nextButtonText: {
        ...Typography.presets.bodyBold,
    },
    submitButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 16,
        gap: 8,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        ...Typography.presets.bodyBold,
        color: '#FFFFFF',
    },

    // Footer
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
        marginBottom: 32,
    },
    footerText: {
        ...Typography.presets.bodySmall,
    },
    link: {
        ...Typography.presets.bodyBold,
        fontSize: 14,
    },
})
