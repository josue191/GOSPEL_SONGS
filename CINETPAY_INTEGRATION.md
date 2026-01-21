# CinetPay Integration Guide - AFRISENS

## Overview

AFRISENS utilise l'API officielle CinetPay pour traiter les paiements Mobile Money et cartes bancaires en RDC.

## Documentation Officielle

- SDK Node.js: `GOSPEL_SONGS/cinetpay-nodejs-master/`
- API v1: https://api.cinetpay.com/v1
- API v2 Checkout: https://api-checkout.cinetpay.com/v2
- Documentation: https://docs.cinetpay.com

## Configuration

### Variables d'Environnement Supabase

```bash
# À configurer via Supabase CLI
supabase secrets set CINETPAY_API_KEY="votre_api_key"
supabase secrets set CINETPAY_SITE_ID="votre_site_id"
supabase secrets set CINETPAY_NOTIFY_URL="https://votre-projet.supabase.co/functions/v1/cinetpay-webhook"
```

### Obtenir les Credentials

1. Créer un compte sur https://cinetpay.com
2. Aller dans Dashboard → Paramètres → API
3. Copier:
   - **API Key** (username pour l'API v1)
   - **Site ID** (password pour l'API v1)

## Architecture de Paiement

### 1. Initiation du Paiement

**Edge Function**: `create-payment`

**API utilisée**: CinetPay API v2 Checkout  
**Endpoint**: `https://api-checkout.cinetpay.com/v2/payment`

**Flux**:
1. Mobile app appelle `create-payment` avec montant + artist_id
2. Edge Function crée `payment_attempt` en DB
3. Appel API CinetPay pour générer URL de paiement
4. Retourne `payment_url` à l'app
5. App ouvre WebView avec l'URL

**Payload CinetPay**:
```javascript
{
  apikey: "votre_api_key",
  site_id: 123456, // Number, pas string
  transaction_id: "payment_attempt_id",
  amount: 1000,
  currency: "XOF", // CFA Franc obligatoire
  description: "Don pour [Artiste]",
  customer_name: "Jean Dupont",
  customer_surname: "Anonyme",
  notify_url: "https://xxx.supabase.co/functions/v1/cinetpay-webhook",
  return_url: "afrisens://payment-return/[id]",
  channels: "ALL"
}
```

**Réponse attendue**:
```javascript
{
  code: "201",
  message: "CREATED",
  data: {
    payment_url: "https://checkout.cinetpay.com/...",
    payment_token: "xxx",
    transaction_id: "payment_attempt_id"
  }
}
```

### 2. Vérification du Paiement

**Edge Function**: `cinetpay-webhook`

**API utilisée**: CinetPay API v1  
**Endpoint**: `https://api.cinetpay.com/v1/?method=checkPayStatus`  
**Content-Type**: `application/x-www-form-urlencoded`

**Authentification**:
- `username` = CINETPAY_API_KEY
- `password` = CINETPAY_SITE_ID

**Payload**:
```
username=votre_api_key&password=votre_site_id&cpm_trans_id=transaction_id
```

**Code d'exemple**:
```typescript
const checkPayStatusBody = new URLSearchParams({
  username: apiKey,
  password: siteId,
  cpm_trans_id: transactionId,
})

const response = await fetch(
  'https://api.cinetpay.com/v1/?method=checkPayStatus',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: checkPayStatusBody.toString(),
  }
)
```

**Réponse succès**:
```javascript
{
  code: "00",
  message: "SUCCES",
  data: {
    cpm_result: "00",           // "00" = succès
    cpm_trans_status: "ACCEPTED", // "ACCEPTED" = accepté
    cpm_amount: "1000",
    cpm_currency: "XOF",
    cpm_payid: "xxxxxx",        // ID unique CinetPay
    cpm_trans_id: "xxx",
    cpm_payment_date: "2024-01-17",
    cpm_payment_time: "14:30:00",
    payment_method: "MOBILE_MONEY",
    cel_phone_num: "0800000000",
    buyer_name: "Jean Dupont"
  }
}
```

### 3. Webhook Notification

**URL**: Configurée dans le dashboard CinetPay  
**Type**: POST avec données JSON

**Payload reçu**:
```javascript
{
  cpm_site_id: "123456",
  cpm_trans_id: "payment_attempt_id",
  cpm_trans_date: "20240117",
  cpm_amount: "1000",
  cpm_currency: "XOF",
  cpm_payid: "unique_payment_id",
  cpm_payment_config: "SINGLE",
  cpm_page_action: "PAYMENT_CONFIRMATION",
  cpm_custom: "{...}", // metadata JSON
  cpm_designation: "Don pour artiste",
  cpm_error_message: "",
  payment_method: "MOBILE_MONEY",
  cel_phone_num: "0800000000"
}
```

**Traitement**:
1. Vérifier `cpm_page_action === "PAYMENT_CONFIRMATION"`
2. Appeler `checkPayStatus` pour double vérification
3. Si `cpm_result === "00"` et `cpm_trans_status === "ACCEPTED"`
4. Créer transaction en DB avec `cpm_payid` (unique constraint)
5. Trigger auto-met à jour le solde artiste
6. Envoyer notifications FCM

## Codes de Statut CinetPay

### Résultats (cpm_result)
- `"00"` - Succès
- `"01"` - En attente
- `"02"` - Échoué

### Statuts de Transaction (cpm_trans_status)
- `"ACCEPTED"` - Accepté
- `"PENDING"` - En attente
- `"REFUSED"` - Refusé
- `"CANCELLED"` - Annulé

## Devises Supportées

- **XOF** - Franc CFA (Afrique de l'Ouest) - **OBLIGATOIRE pour RDC**
- **XAF** - Franc CFA (Afrique Centrale)
- **USD** - Dollar US (limité)

⚠️ **Important**: CinetPay utilise `XOF` comme devise standard. Même si l'utilisateur pense en USD, la transaction se fait en CFA.

## Canaux de Paiement

- `ALL` - Tous les moyens (recommandé)
- `MOBILE_MONEY` - Mobile Money uniquement
- `CARD` - Cartes bancaires uniquement

**Opérateurs Mobile Money supportés**:
- Orange Money
- MTN Mobile Money
- Airtel Money
- Vodacom M-Pesa

## Idempotence & Sécurité

### Prévention des Doublons

**Contrainte DB**:
```sql
CREATE UNIQUE INDEX idx_transactions_provider_ref 
ON transactions(provider_reference);
```

**Logique**:
- `provider_reference` = `cpm_payid` (identifiant unique CinetPay)
- Si webhook reçu 2x → 2ème INSERT échoue sur constraint
- Artist n'est jamais crédité 2 fois

### Double Vérification

Webhook CinetPay → `checkPayStatus` API → DB

**Pourquoi ?**
1. Webhook peut être falsifié
2. Problèmes réseau peuvent corrompre payload
3. Confirmation via API = source de vérité

## Testing

### Mode Sandbox

CinetPay fournit un environnement de test avec des credentials séparés.

**Numéros de test Mobile Money**:
- Vérifier avec CinetPay support pour les numéros valides

### Tester le Webhook Localement

```bash
# Utiliser ngrok pour exposer localhost
ngrok http 54321

# Configurer webhook URL:
https://xxxx.ngrok.io/functions/v1/cinetpay-webhook
```

### Simuler un Webhook

```bash
curl -X POST https://votre-projet.supabase.co/functions/v1/cinetpay-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "cpm_site_id": "123456",
    "cpm_trans_id": "test_payment_id",
    "cpm_amount": "1000",
    "cpm_currency": "XOF",
    "cpm_payid": "unique_test_id",
    "cpm_page_action": "PAYMENT_CONFIRMATION"
  }'
```

## Troubleshooting

### Erreur: "Payment initialization failed"

**Causes possibles**:
- API Key ou Site ID incorrects
- Site ID envoyé comme string au lieu de number
- Devise non supportée
- Montant < 100 CFA

**Solution**:
```typescript
// ✅ Correct
site_id: parseInt(siteId)

// ❌ Incorrect
site_id: siteId // string
```

### Erreur: "Payment not successful"

**Causes possibles**:
- `checkPayStatus` retourne status != ACCEPTED
- Paiement annulé par l'utilisateur
- Solde insuffisant

**Debug**:
```typescript
console.log('CinetPay checkPayStatus response:', verifyData)
// Vérifier: verifyData.data.cpm_result et cpm_trans_status
```

### Webhook Non Reçu

**Vérifications**:
1. URL webhook correctement configurée dans dashboard CinetPay
2. URL accessible publiquement (pas localhost)
3. HTTPS obligatoire
4. Supportsase Function déployée

**Logs**:
```bash
# Voir logs Edge Function
supabase functions logs cinetpay-webhook
```

## Montants Minimum

- **CinetPay**: 100 CFA minimum
- **AFRISENS**: Configurable (recommandé: 500 CFA = ~1 USD)

## Frais

**Structure par défaut** (à ajuster):
- Frais plateforme: 5% (AFRISENS)
- Frais fournisseur: ~2.5% (CinetPay)
- Net artiste: ~92.5%

**Exemple**:
- Don: 10,000 CFA
- Frais plateforme: 500 CFA
- Frais CinetPay: 250 CFA
- **Artiste reçoit**: 9,250 CFA

## Références

- SDK officiel: `GOSPEL_SONGS/cinetpay-nodejs-master/`
- Helper library: `supabase/functions/_shared/cinetpay.ts`
- Edge Functions:
  - `supabase/functions/create-payment/index.ts`
  - `supabase/functions/cinetpay-webhook/index.ts`

## Support CinetPay

- Email: support@cinetpay.com
- Documentation: https://docs.cinetpay.com
- Live Chat: https://cinetpay.com
