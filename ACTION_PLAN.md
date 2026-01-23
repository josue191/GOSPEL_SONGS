# 📋 PLAN D'ACTION AFRISENS - Guide Étape par Étape

## ✅ TÂCHES DÉJÀ ACCOMPLIES (Automatisées)

Les tâches suivantes ont été **automatiquement exécutées** pour vous :

- ✅ **Fichier `.env` créé** - Copié depuis `.env.example` (À REMPLIR avec vos clés)
- ✅ **Script de données test** - `supabase/seed_data.sql` créé
- ✅ **Requêtes SQL admin** - `supabase/admin_queries.sql` créé (50+ requêtes prêtes)
- ✅ **Guide Quick Start** - `QUICKSTART.md` créé

**Fichiers de code** :
- ✅ Backend complet (migrations SQL, Edge Functions, RLS policies, triggers)
- ✅ Mobile app foundation (navigation, écrans guest, intégration Supabase)
- ✅ Configuration files (package.json, app.json, tsconfig.json, etc.)

---

## Vue d'Ensemble

Ce document liste **TOUTES** les tâches que vous devez accomplir pour lancer AFRISENS, dans l'ordre chronologique. Chaque tâche est détaillée avec les commandes exactes à exécuter.

---

## 🎯 PHASE 1 : CONFIGURATION INITIALE (Urgent - À faire en premier)

### ✅ Tâche 1.1 : Installer les Outils Nécessaires

**Durée estimée** : 30 minutes

**À installer** :

1. **Node.js 18+**
   - Télécharger : https://nodejs.org
   - Vérifier : `node --version` (doit afficher v18+)

2. **Git** (si pas déjà installé)
   - Télécharger : https://git-scm.com
   - Vérifier : `git --version`

3. **Supabase CLI**
   ```bash
   npm install -g supabase
   ```
   - Vérifier : `supabase --version`

4. **Expo CLI**
   ```bash
   npm install -g expo-cli
   ```
   - Vérifier : `expo --version`

5. **EAS CLI** (pour builds)
   ```bash
   npm install -g eas-cli
   ```
   - Vérifier : `eas --version`

---

### ✅ Tâche 1.2 : Créer un Compte Supabase

**Durée estimée** : 10 minutes

1. Aller sur https://supabase.com
2. Cliquer "Start your project"
3. S'inscrire avec GitHub ou email
4. Confirmer l'email
5. **Ne pas encore créer de projet** (on le fait à la tâche suivante)

---

### ✅ Tâche 1.3 : Créer un Compte CinetPay

**Durée estimée** : 15 minutes

1. Aller sur https://cinetpay.com
2. Cliquer "S'inscrire" ou "Créer un compte"
3. Remplir le formulaire d'inscription
4. **Type de compte** : Marchand / Business
5. **Pays** : République Démocratique du Congo
6. Valider l'email et le téléphone
7. Compléter la vérification d'identité si demandée

**⚠️ Important** : Contactez le support CinetPay pour :
- Activer le mode **Sandbox** (test)
- Obtenir les credentials de test
- Demander les numéros de téléphone de test Mobile Money

---

## 🗄️ PHASE 2 : CONFIGURATION SUPABASE (Backend)

### ✅ Tâche 2.1 : Créer le Projet Supabase

**Durée estimée** : 5 minutes

1. Connexion : https://app.supabase.com
2. Cliquer "New project"
3. **Organization** : Créer nouvelle ou utiliser existante
4. **Project name** : `afrisens` ou `gospel-songs`
5. **Database Password** : Générer un mot de passe fort (⚠️ **LE NOTER QUELQUE PART**)
6. **Region** : Europe (West) - le plus proche de la RDC
7. **Pricing Plan** : Free (pour commencer)
8. Cliquer "Create new project"
9. **Attendre 2-3 minutes** que le projet se crée

---

### ✅ Tâche 2.2 : Récupérer les Clés Supabase

**Durée estimée** : 2 minutes

1. Dans le dashboard Supabase, aller dans **Settings** (menu gauche)
2. Cliquer **API**
3. **Copier et noter** :
   - **Project URL** (ex: `https://xxxx.supabase.co`)
   - **anon public key** (commence par `eyJ...`)
   - **service_role key** (⚠️ **SECRET - Ne jamais exposer**)

**Où noter ?** Créez un fichier `CREDENTIALS.txt` sur votre bureau (À SUPPRIMER après configuration)

---

### ✅ Tâche 2.3 : Exécuter les Migrations SQL

**Durée estimée** : 10 minutes

1. Dans Supabase Dashboard → **SQL Editor** (menu gauche)
2. Cliquer "New query"

**Migration 1 - Schema** :
```sql
-- DÉPLOYÉ
```

3. Cliquer "New query" à nouveau

**Migration 2 - RLS Policies** :
```sql
-- DÉPLOYÉ
```

4. Cliquer "New query" à nouveau

**Migration 3 - Triggers** :
```sql
-- DÉPLOYÉ
```

**Vérification** :
- Aller dans **Table Editor** (menu gauche)
- Vous devez voir 9 tables : `profiles`, `artists`, `songs`, `payment_attempts`, `transactions`, `artist_balances`, `payout_requests`, `payout_receipts`, `admin_events`

---

### ✅ Tâche 2.4 : Lier Supabase CLI au Projet

**Durée estimée** : 5 minutes

1. Ouvrir un terminal dans `GOSPEL_SONGS`
   ```bash
   cd C:\Users\josue\Desktop\GOSPEL_SONGS
   ```

2. Se connecter à Supabase
   ```bash
   supabase login
   ```
   - Une page web s'ouvre
   - Autoriser l'accès
   - Revenir au terminal

3. Lier le projet
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   - **Où trouver PROJECT_REF ?** 
     - Dans l'URL Supabase : `https://app.supabase.com/project/[PROJECT_REF]`
     - Ou Settings → General → Reference ID

4. Entrer le mot de passe de la base de données (créé à la Tâche 2.1)

✅ **Vérification** : `supabase status` doit afficher les infos du projet

---

### ✅ Tâche 2.5 : Déployer les Edge Functions

**Durée estimée** : 10 minutes

1. **Déployer create-payment** : (PRÊT À DÉPLOYER)
2. **Déployer cinetpay-webhook** : (PRÊT À DÉPLOYER)

**Vérification** :
- Dashboard Supabase → **Edge Functions** (menu gauche)
- Vous devez voir 2 fonctions : `create-payment` et `cinetpay-webhook`
- ✅ **Statut** : Structure de données prête.

---

### ✅ Tâche 2.6 : Configurer les Secrets Supabase

**Durée estimée** : 5 minutes

**⚠️ Important** : Ces secrets ne sont PAS dans le fichier .env. Ils sont stockés côté Supabase.

1. **Récupérer les credentials CinetPay** :
   - Connexion : https://cinetpay.com
   - Dashboard → Paramètres → API
   - Noter : **API Key** et **Site ID**

2. **Configurer les secrets** :
   ```bash
   # Remplacer YOUR_API_KEY par votre vraie clé
   supabase secrets set CINETPAY_API_KEY="YOUR_API_KEY"
   
   # Remplacer YOUR_SITE_ID par votre vrai site ID
   supabase secrets set CINETPAY_SITE_ID="YOUR_SITE_ID"
   
   # URL de webhook (remplacer xxxx par votre project ref)
   supabase secrets set CINETPAY_NOTIFY_URL="https://xxxx.supabase.co/functions/v1/cinetpay-webhook"
   ```

**Vérification** :
```bash
supabase secrets list
```
- Doit afficher les 3 secrets (valeurs masquées)

---

## 📱 PHASE 3 : CONFIGURATION MOBILE APP

### ✅ Tâche 3.1 : Installer les Dépendances NPM

**Durée estimée** : 10 minutes

1. Ouvrir terminal dans le projet
   ```bash
   cd C:\Users\josue\Desktop\GOSPEL_SONGS
   ```

2. Installer les dépendances
   ```bash
   npm install
   ```
   - ✅ **Statut** : TERMINÉ (node_modules installé et configuré)

---

### ✅ Tâche 3.2 : Créer le Fichier .env ✔️ **FAIT**

**Durée estimée** : 3 minutes

**Statut** : ✅ Le fichier `.env` a été créé automatiquement

**RESTE À FAIRE** :

1. Ouvrir `.env` avec un éditeur de texte
   ```bash
   notepad C:\Users\josue\Desktop\GOSPEL_SONGS\.env
   ```

2. **Remplir avec vos vraies valeurs** :
   ```bash
   # Supabase (de la Tâche 2.2)
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   
   # Ces lignes sont pour info (pas utilisées dans l'app mobile)
   CINETPAY_API_KEY=xxx
   CINETPAY_SITE_ID=xxx
   CINETPAY_NOTIFY_URL=https://xxxx.supabase.co/functions/v1/cinetpay-webhook
   SUPABASE_SERVICE_ROLE_KEY=xxx
   ```

4. **Sauvegarder** et fermer

⚠️ **TRÈS IMPORTANT** : Ne jamais commit le fichier `.env` sur Git !

---

### ✅ Tâche 3.3 : Créer un Compte Expo

**Durée estimée** : 5 minutes

1. Aller sur https://expo.dev
2. Cliquer "Sign up"
3. S'inscrire avec GitHub ou email
4. Confirmer l'email

5. Se connecter via terminal
   ```bash
   npx expo login
   ```
   - Entrer email et mot de passe

---

### ✅ Tâche 3.4 : Configurer EAS (Build Service)

**Durée estimée** : 5 minutes

1. Se connecter à EAS
   ```bash
   eas login
   ```

2. Configurer le projet
   ```bash
   eas build:configure
   ```
   - Répondre aux questions :
     - "Would you like to automatically create an EAS project?" → **Yes**
     - Sélectionner "All" platforms

3. **Mettre à jour app.json** :
   - Ouvrir `app.json`
   - Trouver `"owner": "afrisens"`
   - Remplacer par votre username Expo : `"owner": "votre_username"`
   - Sauvegarder

---

## 🧪 PHASE 4 : CONFIGURATION CINETPAY WEBHOOK

### ✅ Tâche 4.1 : Configurer l'URL de Notification dans CinetPay

**Durée estimée** : 5 minutes

1. Connexion : https://cinetpay.com
2. Dashboard → **Paramètres** → **Notifications**
3. **URL de notification (IPN)** :
   ```
   https://xxxx.supabase.co/functions/v1/cinetpay-webhook
   ```
   (Remplacer `xxxx` par votre project ref Supabase)

4. **Sauvegarder**

**Vérification** :
- CinetPay envoie un test de webhook
- Vérifier dans Supabase → Edge Functions → Logs

---

## 🎨 PHASE 5 : DONNÉES DE TEST

### ✅ Tâche 5.1 : Créer un Artiste de Test ✔️ **SCRIPT PRÊT**

**Durée estimée** : 5 minutes

**Statut** : ✅ **DÉPLOYÉ** sur le serveur Supabase.

1. **Artiste créé** : "Père Molière Tonic"
2. **UUID** : `a1b2c3d4-e5f6-4a5b-bc6d-7e8f9a0b1c2d` (pour tests)
3. **Chansons** : 3 chansons de test actives.

---

### ✅ Tâche 5.2 : Uploader une Image de Profil (Optionnel)

**Durée estimée** : 5 minutes

1. Supabase Dashboard → **Storage**
2. Créer un bucket "artist-profiles" (public)
3. Upload une image
4. Copier l'URL publique
5. Mettre à jour l'artiste :
   ```sql
   UPDATE artists
   SET profile_image_url = 'URL_DE_L_IMAGE'
   WHERE id = 'USER_ID_FROM_AUTH';
   ```

---

## 🚀 PHASE 6 : PREMIER TEST DE L'APPLICATION

### ✅ Tâche 6.1 : Lancer l'App en Mode Développement

**Durée estimée** : 10 minutes

1. Ouvrir terminal dans le projet
   ```bash
   cd C:\Users\josue\Desktop\GOSPEL_SONGS
   ```

2. Démarrer Expo
   ```bash
   npx expo start
   ```

3. **Choisir une méthode** :
   - **Option A** : Scanner QR code avec l'app Expo Go (Android/iOS)
   - **Option B** : Presser `a` pour Android Emulator
   - **Option C** : Presser `i` pour iOS Simulator (Mac uniquement)

**Télécharger Expo Go** :
- Android : https://play.google.com/store/apps/details?id=host.exp.exponent
- iOS : https://apps.apple.com/app/expo-go/id982107779

---

### ✅ Tâche 6.2 : Tester le Flow Guest (Donateur)

**Durée estimée** : 10 minutes

**Tests à effectuer** :

1. ✅ **Mode Selection**
   - Ouvrir l'app
   - Vérifier que l'écran d'accueil s'affiche
   - Taper "Je veux soutenir"

2. ✅ **Liste Artistes**
   - Vérifier que l'artiste de test s'affiche
   - Tester la recherche
   - Taper sur l'artiste

3. ✅ **Page Artiste**
   - Vérifier nom, église, bio
   - Vérifier liste des chansons
   - Taper "Faire un Don"

4. ✅ **Formulaire de Don**
   - Entrer montant (ex: 1000)
   - Entrer nom (optionnel)
   - Taper "Continuer"

5. ✅ **WebView CinetPay**
   - Vérifier que la page de paiement s'ouvre
   - **Mode Sandbox** : Utiliser les credentials de test CinetPay
   - Compléter le paiement test

6. ✅ **Historique**
   - Retourner à la liste artistes
   - Taper "Mes Dons"
   - Vérifier que le don apparaît avec statut

---

### ✅ Tâche 6.3 : Vérifier le Backend

**Durée estimée** : 5 minutes

1. Supabase Dashboard → **Table Editor**

2. **Vérifier payment_attempts** :
   - Doit contenir votre tentative de paiement
   - Vérifier `device_id`, `amount`, `status`

3. **Vérifier transactions** (si paiement complété) :
   - Doit contenir la transaction confirmée
   - Vérifier `gross_amount`, `platform_fee`, `net_amount`

4. **Vérifier artist_balances** :
   - L'artiste doit avoir un solde mis à jour
   - `available_balance` = `net_amount` de la transaction

5. **Vérifier les logs Edge Functions** :
   - Supabase → Edge Functions → `cinetpay-webhook` → Logs
   - Vérifier qu'il n'y a pas d'erreurs

---

## 📦 PHASE 7 : BUILD APK DE TEST

### ✅ Tâche 7.1 : Build Android APK

**Durée estimée** : 30-60 minutes (build cloud)

1. **Lancer le build** :
   ```bash
   eas build --platform android --profile preview
   ```

2. **Répondre aux questions** :
   - "Generate a new keystore?" → **Yes** (première fois)
   - Confirmer

3. **Attendre le build** :
   - ⏳ 30-60 minutes
   - Vous recevrez un email quand c'est prêt
   - Ou suivre la progression : https://expo.dev

4. **Télécharger l'APK** :
   - Cliquer sur le lien dans l'email
   - Ou aller sur https://expo.dev → Builds
   - Télécharger le fichier `.apk`

5. **Vérifier la taille** :
   - ✅ Objectif : < 30 MB
   - Si > 30 MB, optimiser (voir troubleshooting)

---

### ✅ Tâche 7.2 : Installer l'APK sur un Téléphone Test

**Durée estimée** : 10 minutes

1. **Transférer l'APK** :
   - Via USB ou Google Drive vers téléphone Android

2. **Activer "Sources inconnues"** :
   - Paramètres → Sécurité → Autoriser installation d'apps tierces

3. **Installer l'APK** :
   - Taper sur le fichier
   - Installer

4. **Tester sur téléphone réel** :
   - Ouvrir AFRISENS
   - Refaire tous les tests de la Tâche 6.2
   - **Vérifier sur connexion 2G/3G** (pas juste WiFi)

---

## 👨‍💼 PHASE 8 : MODE ARTISTE (À DÉVELOPPER)

### ⏸️ Tâche 8.1 : Écrans d'Authentification

**Statut** : **NON COMMENCÉ**

**À créer** :
- `app/(artist)/auth/login.tsx` - Connexion email/password
- `app/(artist)/auth/register.tsx` - Inscription avec vidéo

**Durée estimée** : 1 jour

---

### ⏸️ Tâche 8.2 : Dashboard Artiste

**Statut** : **NON COMMENCÉ**

**À créer** :
- `app/(artist)/dashboard.tsx` - Solde, statistiques
- `app/(artist)/transactions.tsx` - Historique dons
- `app/(artist)/songs.tsx` - Upload chansons
- `app/(artist)/payouts.tsx` - Demandes de retrait

**Durée estimée** : 2-3 jours

---

## 🛡️ PHASE 9 : ADMIN PANEL (Optionnel)

### ⏸️ Tâche 9.1 : Choisir l'Approche

**Option A** : Utiliser directement Supabase Dashboard
- ✅ Rapide
- ✅ Gratuit
- ❌ Moins user-friendly

**Option B** : Créer un panel web Next.js
- ✅ Interface custom
- ✅ Workflows automatisés
- ❌ 3-4 jours de dev

**Recommandation** : Commencer avec Option A, migrer vers B si besoin.

---

### ✅ Tâche 9.2 : Workflows Admin via SQL (Option A) ✔️ **PRÊT**

**Durée estimée** : 1 heure

**Statut** : ✅ Toutes les requêtes SQL sont déjà créées dans `supabase/admin_queries.sql`

Le fichier contient **50+ requêtes** organisées en 8 catégories :
1. Gestion des artistes (vérification, suspension, stats)
2. Gestion des transactions (rapports, top artistes)
3. Gestion des retraits (approval, upload receipts)
4. Monitoring & Analytics (dashboard, taux de conversion)
5. Détection d'anomalies (fraudes potentielles)
6. Maintenance & Nettoyage
7. Support client (recherche par référence)
8. Exports & Rapports (comptabilité)

**Comment utiliser** :

1. Ouvrir `supabase/admin_queries.sql`
2. Copier la requête dont vous avez besoin
3. Remplacer les placeholders (ARTIST_ID, PAYOUT_ID, etc.)
4. Exécuter dans Supabase SQL Editor

**Exemples de requêtes disponibles** :

- Vérifier un artiste
- Approuver/rejeter un retrait
- Voir transactions du jour
- Top 10 artistes par revenus
- Donateurs récurrents
- Détection de fraudes
- Exports pour comptabilité

📖 **Voir le fichier complet** : [`supabase/admin_queries.sql`](file:///C:/Users/josue/Desktop/GOSPEL_SONGS/supabase/admin_queries.sql)

---

## 🔔 PHASE 10 : NOTIFICATIONS FCM

### ⏸️ Tâche 10.1 : Configurer Firebase Cloud Messaging

**Statut** : **NON COMMENCÉ**

**Durée estimée** : 3-4 heures

**Étapes** :
1. Créer projet Firebase
2. Ajouter app Android
3. Télécharger `google-services.json`
4. Configurer dans Expo
5. Créer table `device_tokens` dans Supabase
6. Intégrer dans Edge Functions

**Référence** : `lib/notifications.ts` déjà créé

---

## 🎉 PHASE 11 : LANCEMENT

### ✅ Tâche 11.1 : Checklist Pré-Lancement

**À vérifier** :

- [ ] Tous les tests passent (guest + artist)
- [ ] Webhook CinetPay fonctionne
- [ ] Idempotence testée (webhook dupliqué)
- [ ] RLS policies testées (tentative d'accès non autorisé)
- [ ] APK < 30 MB
- [ ] App fonctionne sur téléphone 2GB RAM
- [ ] Connexion 2G/3G testée
- [ ] Paiement test CinetPay sandbox réussi
- [ ] Balance artiste mise à jour automatiquement
- [ ] Screenshots de l'app prêts (pour Play Store)
- [ ] Politique de confidentialité rédigée
- [ ] Conditions d'utilisation rédigées

---

### ✅ Tâche 11.2 : Publier sur Google Play Store

**Durée estimée** : 1-2 jours (review Google)

1. **Créer compte Google Play Developer** (25 USD une fois)
2. **Build de production** :
   ```bash
   eas build --platform android --profile production
   ```
3. **Créer l'application** dans Play Console
4. **Upload l'APK/AAB**
5. **Remplir les métadonnées** (description, screenshots, etc.)
6. **Soumettre pour review**

**Référence** : https://docs.expo.dev/submit/android/

---

## 📊 MÉTRIQUES DE SUCCÈS

### KPIs à Suivre

1. **Nombre de téléchargements**
2. **Nombre de dons complétés** (vs abandonnés)
3. **Montant total collecté**
4. **Nombre d'artistes vérifiés**
5. **Taux de rétention** (dons répétés)
6. **Temps moyen de paiement**
7. **Taux d'erreur webhook**

**Tableau de bord** : Créer des requêtes SQL dans Supabase ou utiliser un outil comme Metabase.

---

## 🆘 SUPPORT & RESSOURCES

### Documentation
- `README.md` - Vue d'ensemble du projet
- `SETUP.md` - Guide de configuration
- `CINETPAY_INTEGRATION.md` - Intégration CinetPay
- `walkthrough.md` - Ce qui a été construit

### Commandes Utiles

```bash
# Démarrer l'app
npx expo start

# Voir logs Supabase Functions
supabase functions logs cinetpay-webhook --follow

# Build APK test
eas build --platform android --profile preview

# Vérifier RLS policies
supabase db diff
```

### En Cas de Problème

1. **Problèmes Supabase** → https://supabase.com/docs
2. **Problèmes Expo** → https://docs.expo.dev
3. **Problèmes CinetPay** → support@cinetpay.com
4. **Erreurs de build** → Vérifier logs EAS : https://expo.dev

---

## ✅ CHECKLIST RAPIDE

Cochez au fur et à mesure :

### ✅ Tâches Automatisées (Déjà Faites)
- [x] Code backend complet créé
- [x] Code mobile app créé  
- [x] Scripts SQL préparés
- [x] Fichier `.env` créé
- [x] Documentation complète

### Configuration Initiale
- [ ] Node.js installé
- [ ] Supabase CLI installé
- [ ] Expo CLI installé
- [ ] Compte Supabase créé
- [ ] Compte CinetPay créé

### Backend Supabase
- [ ] Projet Supabase créé
- [ ] Migrations SQL exécutées (3/3)
- [ ] Artiste de test créé (seed_data.sql)
- [ ] Edge Functions déployées (2/2)
- [ ] Secrets configurés (3/3)
- [ ] Webhook CinetPay configuré

### Mobile App
- [ ] `npm install` complété
- [ ] Fichier `.env` rempli avec vraies clés
- [ ] Compte Expo créé
- [ ] EAS configuré
- [ ] App démarre sans erreur

### Tests
- [ ] Flow guest testé (liste artistes → don)
- [ ] WebView CinetPay fonctionne
- [ ] Webhook reçu et traité
- [ ] Balance artiste mise à jour
- [ ] APK généré et testé

### Lancement
- [ ] Mode artiste développé
- [ ] Notifications FCM implémentées
- [ ] Tests complets réalisés
- [ ] Publication Google Play

---

## 📅 PLANNING SUGGÉRÉ

**Sprint 1 (Semaine 1)** : Configuration + Tests
- Jour 1-2 : Phases 1-3 (Config)
- Jour 3-4 : Phases 4-6 (Tests)
- Jour 5 : Phase 7 (Build APK)

**Sprint 2 (Semaine 2)** : Mode Artiste
- Jour 1-3 : Phase 8 (Développement)
- Jour 4-5 : Tests mode artiste

**Sprint 3 (Semaine 3)** : Finalisation
- Jour 1-2 : Phase 10 (Notifications)
- Jour 3-4 : Phase 9 (Admin)
- Jour 5 : QA final

**Sprint 4 (Semaine 4)** : Lancement
- Jour 1-2 : Préparation Play Store
- Jour 3 : Soumission
- Jour 4-5 : Marketing / Communication

---

## 🎯 PRIORITÉS

**P0 (Critique - Bloquer)** :
- Tâches 1.1 à 2.6 (Backend setup)
- Tâche 3.1 à 3.4 (App setup)
- Tâche 4.1 (Webhook)
- Tâche 6.1 à 6.3 (Tests)

**P1 (Important - Cette semaine)** :
- Tâche 5.1 à 5.2 (Données test)
- Tâche 7.1 à 7.2 (APK)
- Tâche 8.1 à 8.2 (Mode Artiste)

**P2 (Peut attendre - Dans 2 semaines)** :
- Tâche 9.1 à 9.2 (Admin)
- Tâche 10.1 (FCM)

**P3 (Nice-to-have)** :
- Optimisations
- Analytics avancées
- Version iOS

---

**BON COURAGE ! 🚀**

Pour toute question, référez-vous aux fichiers de documentation dans le projet.
