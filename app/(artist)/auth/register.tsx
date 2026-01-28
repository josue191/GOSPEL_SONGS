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
} from 'react-native'
import { Link, useRouter } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'

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
                        currentStep >= step && styles.stepCircleActive,
                        currentStep > step && styles.stepCircleCompleted
                    ]}>
                        {currentStep > step ? (
                            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                        ) : (
                            <Text style={[
                                styles.stepNumber,
                                currentStep >= step && styles.stepNumberActive
                            ]}>{step}</Text>
                        )}
                    </View>
                    {step < 3 && (
                        <View style={[
                            styles.stepLine,
                            currentStep > step && styles.stepLineActive
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
        <View style={styles.card}>
            <Text style={styles.cardTitle}>📋 Informations Personnelles</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Prénom *</Text>
                <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={20} color="#06B6D4" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Votre prénom"
                        placeholderTextColor="#94A3B8"
                        value={firstName}
                        onChangeText={setFirstName}
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Nom *</Text>
                <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={20} color="#06B6D4" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Votre nom"
                        placeholderTextColor="#94A3B8"
                        value={lastName}
                        onChangeText={setLastName}
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Nom de scène *</Text>
                <View style={styles.inputWrapper}>
                    <Ionicons name="musical-notes-outline" size={20} color="#06B6D4" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: Frère Moïse"
                        placeholderTextColor="#94A3B8"
                        value={stageName}
                        onChangeText={setStageName}
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Sexe *</Text>
                <View style={styles.genderContainer}>
                    <TouchableOpacity
                        style={[styles.genderButton, gender === 'M' && styles.genderButtonActive]}
                        onPress={() => setGender('M')}
                    >
                        <Ionicons
                            name="male"
                            size={24}
                            color={gender === 'M' ? '#FFFFFF' : '#06B6D4'}
                        />
                        <Text style={[styles.genderText, gender === 'M' && styles.genderTextActive]}>
                            Masculin
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.genderButton, gender === 'F' && styles.genderButtonActive]}
                        onPress={() => setGender('F')}
                    >
                        <Ionicons
                            name="female"
                            size={24}
                            color={gender === 'F' ? '#FFFFFF' : '#06B6D4'}
                        />
                        <Text style={[styles.genderText, gender === 'F' && styles.genderTextActive]}>
                            Féminin
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Date de naissance *</Text>
                <View style={styles.inputWrapper}>
                    <Ionicons name="calendar-outline" size={20} color="#06B6D4" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="JJ/MM/AAAA"
                        placeholderTextColor="#94A3B8"
                        value={birthDate}
                        onChangeText={setBirthDate}
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Téléphone *</Text>
                <View style={styles.inputWrapper}>
                    <Ionicons name="call-outline" size={20} color="#06B6D4" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="+243 XXX XXX XXX"
                        placeholderTextColor="#94A3B8"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                    />
                </View>
            </View>

            <View style={styles.addressSection}>
                <Text style={styles.sectionTitle}>📍 Adresse (Nord-Kivu, Goma)</Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Commune *</Text>
                    <View style={styles.inputWrapper}>
                        <Ionicons name="location-outline" size={20} color="#06B6D4" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Goma"
                            placeholderTextColor="#94A3B8"
                            value={commune}
                            onChangeText={setCommune}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Avenue *</Text>
                    <View style={styles.inputWrapper}>
                        <Ionicons name="map-outline" size={20} color="#06B6D4" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Avenue de la Paix"
                            placeholderTextColor="#94A3B8"
                            value={avenue}
                            onChangeText={setAvenue}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Numéro (Optionnel)</Text>
                    <View style={styles.inputWrapper}>
                        <Ionicons name="home-outline" size={20} color="#06B6D4" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: 123"
                            placeholderTextColor="#94A3B8"
                            value={number}
                            onChangeText={setNumber}
                        />
                    </View>
                </View>
            </View>
        </View>
    )

    const renderStep2 = () => (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>📸 Documents de Vérification</Text>
            <Text style={styles.cardSubtitle}>
                Pour vérifier votre identité, nous avons besoin de votre carte d'électeur et d'un selfie
            </Text>

            <View style={styles.uploadSection}>
                <Text style={styles.label}>Carte d'électeur *</Text>
                <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => pickImage('voterCard')}
                >
                    {voterCardImage ? (
                        <View style={styles.imagePreviewContainer}>
                            <Image source={{ uri: voterCardImage }} style={styles.imagePreview} />
                            <View style={styles.checkmarkOverlay}>
                                <Ionicons name="checkmark-circle" size={32} color="#10B981" />
                            </View>
                        </View>
                    ) : (
                        <View style={styles.uploadPlaceholder}>
                            <Ionicons name="card-outline" size={48} color="#06B6D4" />
                            <Text style={styles.uploadText}>Télécharger la carte d'électeur</Text>
                            <Text style={styles.uploadHint}>Format: JPG, PNG</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.uploadSection}>
                <Text style={styles.label}>Selfie (Photo de vous) *</Text>
                <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => pickImage('selfie')}
                >
                    {selfieImage ? (
                        <View style={styles.imagePreviewContainer}>
                            <Image source={{ uri: selfieImage }} style={styles.imagePreview} />
                            <View style={styles.checkmarkOverlay}>
                                <Ionicons name="checkmark-circle" size={32} color="#10B981" />
                            </View>
                        </View>
                    ) : (
                        <View style={styles.uploadPlaceholder}>
                            <Ionicons name="camera-outline" size={48} color="#06B6D4" />
                            <Text style={styles.uploadText}>Prendre un selfie</Text>
                            <Text style={styles.uploadHint}>Photo claire de votre visage</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    )

    const renderStep3 = () => (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>🔒 Sécurité du Compte</Text>
            <Text style={styles.cardSubtitle}>
                Créez un mot de passe sécurisé pour protéger votre compte
            </Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Email *</Text>
                <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color="#06B6D4" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="votre@email.com"
                        placeholderTextColor="#94A3B8"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Mot de passe *</Text>
                <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#06B6D4" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Créer un mot de passe"
                        placeholderTextColor="#94A3B8"
                        value={password}
                        onChangeText={validatePassword}
                        secureTextEntry
                    />
                </View>
            </View>

            {password.length > 0 && renderPasswordCriteria()}

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirmer le mot de passe *</Text>
                <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#06B6D4" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Confirmer le mot de passe"
                        placeholderTextColor="#94A3B8"
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
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Créer un compte artiste</Text>
                    <Text style={styles.subtitle}>Rejoignez la communauté AFRISENS</Text>
                </View>

                {renderStepper()}

                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}

                <View style={styles.navigationButtons}>
                    {currentStep > 1 && (
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={handleBack}
                        >
                            <Ionicons name="arrow-back" size={20} color="#06B6D4" />
                            <Text style={styles.backButtonText}>Précédent</Text>
                        </TouchableOpacity>
                    )}

                    {currentStep < 3 ? (
                        <TouchableOpacity
                            style={styles.nextButton}
                            onPress={handleNext}
                        >
                            <Text style={styles.nextButtonText}>Suivant</Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
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
                    <Text style={styles.footerText}>Déjà un compte ?</Text>
                    <Link href="/(artist)/auth/login" asChild>
                        <TouchableOpacity>
                            <Text style={styles.link}>Se connecter</Text>
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
        backgroundColor: '#F1F5F9',
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
        fontSize: 26,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#64748B',
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
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#CBD5E1',
    },
    stepCircleActive: {
        backgroundColor: '#06B6D4',
        borderColor: '#06B6D4',
    },
    stepCircleCompleted: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    stepNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#94A3B8',
    },
    stepNumberActive: {
        color: '#FFFFFF',
    },
    stepLine: {
        width: 60,
        height: 3,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 8,
    },
    stepLineActive: {
        backgroundColor: '#10B981',
    },

    // Card Styles
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 8,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 20,
        lineHeight: 20,
    },

    // Input Styles
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        padding: 14,
        color: '#0F172A',
        fontSize: 15,
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
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#06B6D4',
        backgroundColor: '#F8FAFC',
        gap: 8,
    },
    genderButtonActive: {
        backgroundColor: '#06B6D4',
        borderColor: '#06B6D4',
    },
    genderText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#06B6D4',
    },
    genderTextActive: {
        color: '#FFFFFF',
    },

    // Address Section
    addressSection: {
        marginTop: 12,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 16,
    },

    // Upload Styles
    uploadSection: {
        marginBottom: 24,
    },
    uploadButton: {
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        overflow: 'hidden',
    },
    uploadPlaceholder: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
    },
    uploadText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#06B6D4',
        marginTop: 12,
    },
    uploadHint: {
        fontSize: 13,
        color: '#94A3B8',
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
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 4,
    },

    // Password Criteria
    criteriaContainer: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
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
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    criteriaCircleMet: {
        backgroundColor: '#10B981',
    },
    criteriaText: {
        fontSize: 13,
        color: '#64748B',
    },
    criteriaTextMet: {
        color: '#10B981',
        fontWeight: '500',
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
        fontSize: 13,
        color: '#10B981',
        fontWeight: '500',
    },
    matchError: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    matchErrorText: {
        fontSize: 13,
        color: '#EF4444',
        fontWeight: '500',
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
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#06B6D4',
        backgroundColor: '#FFFFFF',
        gap: 8,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#06B6D4',
    },
    nextButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#06B6D4',
        gap: 8,
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    submitButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#10B981',
        gap: 8,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
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
        color: '#64748B',
        fontSize: 14,
    },
    link: {
        color: '#06B6D4',
        fontSize: 14,
        fontWeight: 'bold',
    },
})
