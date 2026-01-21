# 🚀 QUICK START - AFRISENS

## Ce qu'il faut faire MAINTENANT (30 minutes)

### 1️⃣ Créer les Comptes (15 min)

#### Supabase
1. Aller sur https://supabase.com
2. Cliquer "Start your project"
3. S'inscrire et créer un projet nommé "afrisens"
4. **Noter** : Project URL + anon key + service_role key

#### CinetPay
1. Aller sur https://cinetpay.com
2. S'inscrire (compte Marchand - RDC)
3. **Noter** : API Key + Site ID
4. Activer le mode Sandbox (contacter support si besoin)

---

### 2️⃣ Configurer le Backend (15 min)

#### Dans Supabase Dashboard

**A. Exécuter les migrations SQL**
1. Dashboard → SQL Editor → New query
2. Copier/coller le contenu de : `supabase/migrations/01_schema.sql`
3. Cliquer "Run" → Vérifier "Success"
4. Répéter pour `02_rls_policies.sql`
5. Répéter pour `03_triggers.sql`

✅ Vérifier : Table Editor → Vous devez voir 9 tables

**B. Créer des données test**
1. SQL Editor → New query
2. Aller dans Authentication → Users → Add user :
   - Email: `artiste.test@afrisens.com`
   - Password: `Test123456!`
   - **Copier l'UUID généré**
3. Ouvrir `supabase/seed_data.sql`
4. Remplacer `UUID_DE_L_UTILISATEUR_ICI` par l'UUID copié
5. Copier/coller dans SQL Editor et Run

✅ Vérifier : Table Editor → `artists` → Vous devez voir "Père Molière Tonic"

---

### 3️⃣ Configurer l'App Mobile (En cours...)

**Fichier `.env` créé** ✅

**Prochaines étapes** :
```bash
# 1. Ouvrir le fichier .env qui vient d'être créé
# 2. Remplir avec vos vraies valeurs de Supabase
# 3. Installer les dépendances
npm install

# 4. Démarrer l'app
npx expo start
```

---

## 📁 Fichiers Créés pour Vous

- ✅ `.env` - Configuration de l'app (REMPLIR avec vos clés)
- ✅ `supabase/seed_data.sql` - Script de données test
- ✅ `supabase/admin_queries.sql` - Requêtes admin utiles
- ✅ `ACTION_PLAN.md` - Plan détaillé complet

---

## 🆘 Besoin d'Aide ?

📖 **Documentation complète** : `ACTION_PLAN.md`

🔧 **Configuration détaillée** : `SETUP.md`

💳 **CinetPay** : `CINETPAY_INTEGRATION.md`

---

## ✅ Checklist Rapide

- [ ] Compte Supabase créé
- [ ] Compte CinetPay créé  
- [ ] 3 migrations SQL exécutées
- [ ] Artiste de test créé
- [ ] Fichier `.env` rempli
- [ ] `npm install` complété
- [ ] App démarre avec `npx expo start`

**Une fois ces étapes faites, vous pourrez tester le premier don ! 🎉**
