# 🎵 AFRISENS - Gospel Songs Donation Platform

🔒 **Plateforme de dons sécurisée pour les artistes gospel en République Démocratique du Congo.**

## 🌟 Vue d'ensemble

AFRISENS est une application mobile conçue pour connecter les fans de musique gospel avec leurs artistes préférés. L'architecture est optimisée pour la connectivité en RDC et les appareils à ressources limitées.

### ✨ Fonctionnalités Clés
- **Mode Donateur (Guest)** : Soutien sans compte, suivi par Device ID.
- **Mode Artiste** : Inscription multi-étapes, upload de documents (Goma/Nord-Kivu), gestion des royalties et retraits.
- **Paiements Intégrés** : CinetPay (Mobile Money: M-Pesa, Orange Money, Airtel Money).
- **Optimisé pour la RDC** : APK < 30MB, fonctionne sur 2GB RAM.
- **Notifications Push** : Confirmations de dons via FCM.

---

## 🚀 Guide de Démarrage Rapide

### 1. Prérequis
- **Node.js 18+**
- **Supabase CLI** : `npm install -g supabase`
- **Expo & EAS CLI** : `npm install -g expo-cli eas-cli`
- **Comptes** : [Supabase](https://supabase.com), [CinetPay](https://cinetpay.com), [Expo](https://expo.dev)

### 2. Installation
```bash
git clone https://github.com/josue191/GOSPEL_SONGS.git
cd GOSPEL_SONGS
npm install
cp .env.example .env # Remplir avec vos clés
```

### 3. Configuration Backend (Supabase)
1. **Migrations** : Exécuter `supabase/migrations/01` à `06` via SQL Editor ou `supabase db push`.
2. **Edge Functions** :
   ```bash
   supabase link --project-ref votre-ref
   supabase functions deploy create-payment
   supabase functions deploy cinetpay-webhook
   ```
3. **Secrets** : Configurer `CINETPAY_API_KEY`, `CINETPAY_SITE_ID`, et `CINETPAY_NOTIFY_URL`.
4. **Storage** : Vérifier l'existence du bucket `verification-documents`.

---

## 🛠️ Détails Techniques

### Architecture
- **Frontend** : React Native + Expo (Expo Router)
- **Backend** : Supabase (PostgreSQL + RLS + Triggers)
- **Functions** : Deno (Edge Functions)
- **Notifications** : Firebase Cloud Messaging

### Flux de Paiement
1. L'app crée un `payment_attempt`.
2. Appel à `create-payment` (Edge Function) pour générer l'URL CinetPay.
3. Paiement via WebView.
4. Webhook CinetPay confirme la transaction (Source de vérité).
5. Trigger SQL met à jour le solde de l'artiste.
6. Notification FCM envoyée.

### Modèle de Sécurité (RLS)
- **Donateurs** : Lecture publique, insertion de tentatives de paiement.
- **Artistes** : Accès à leur propre solde et historique de transactions.
- **Service Role** : Seul autorisé à finaliser les transactions via Edge Functions.

---

## 📱 Développement et Build

### Lancer en local
```bash
npx expo start
```

### Construire l'APK de test
```bash
eas build --platform android --profile preview
```

---

## 📖 Documentation Administrative
Toutes les requêtes de gestion (vérification d'artistes, approbation de retraits, statistiques) sont disponibles dans `supabase/admin_queries.sql`.

---

**Propriété de AFRISENS Platform. Construit avec ❤️ pour la communauté gospel.**
