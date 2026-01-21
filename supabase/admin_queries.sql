-- ============================================
-- AFRISENS - REQUÊTES SQL ADMIN
-- Workflows pour gérer la plateforme
-- ============================================

-- ============================================
-- 1. GESTION DES ARTISTES
-- ============================================

-- 1.1 Voir tous les artistes en attente de vérification
SELECT 
  a.id,
  a.stage_name,
  a.church_name,
  a.verification_video_url,
  a.created_at,
  u.email
FROM artists a
JOIN auth.users u ON u.id = a.id
WHERE a.is_verified = false
ORDER BY a.created_at DESC;

-- 1.2 Vérifier un artiste (REMPLACER 'ARTIST_ID')
UPDATE artists
SET is_verified = true
WHERE id = 'ARTIST_ID';

-- 1.3 Suspendre un artiste
UPDATE artists
SET is_verified = false
WHERE id = 'ARTIST_ID';

-- 1.4 Statistiques artistes
SELECT 
  COUNT(*) FILTER (WHERE is_verified = true) as artistes_verifies,
  COUNT(*) FILTER (WHERE is_verified = false) as en_attente,
  COUNT(*) as total
FROM artists;

-- ============================================
-- 2. GESTION DES TRANSACTIONS
-- ============================================

-- 2.1 Transactions du jour
SELECT 
  t.id,
  t.gross_amount,
  t.platform_fee,
  t.provider_fee,
  t.net_amount,
  t.currency,
  a.stage_name AS artiste,
  t.donor_name,
  t.created_at
FROM transactions t
JOIN artists a ON t.artist_id = a.id
WHERE DATE(t.created_at) = CURRENT_DATE
ORDER BY t.created_at DESC;

-- 2.2 Transactions des 7 derniers jours
SELECT 
  DATE(t.created_at) as date,
  COUNT(*) as nombre_transactions,
  SUM(t.gross_amount) as montant_total,
  SUM(t.platform_fee) as frais_plateforme,
  SUM(t.net_amount) as montant_artistes
FROM transactions t
WHERE t.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(t.created_at)
ORDER BY date DESC;

-- 2.3 Top 10 artistes par revenus
SELECT 
  a.stage_name,
  a.church_name,
  COUNT(t.id) as nombre_dons,
  SUM(t.gross_amount) as montant_brut,
  SUM(t.net_amount) as montant_net,
  ab.available_balance as solde_actuel
FROM artists a
LEFT JOIN transactions t ON t.artist_id = a.id
LEFT JOIN artist_balances ab ON ab.artist_id = a.id
WHERE a.is_verified = true
GROUP BY a.id, a.stage_name, a.church_name, ab.available_balance
ORDER BY SUM(t.net_amount) DESC NULLS LAST
LIMIT 10;

-- 2.4 Transactions suspectes (montants très élevés)
SELECT 
  t.id,
  t.gross_amount,
  a.stage_name,
  t.donor_name,
  t.provider_reference,
  t.created_at
FROM transactions t
JOIN artists a ON t.artist_id = a.id
WHERE t.gross_amount > 50000 -- Ajuster le seuil
ORDER BY t.gross_amount DESC;

-- ============================================
-- 3. GESTION DES RETRAITS (PAYOUTS)
-- ============================================

-- 3.1 Demandes de retrait en attente
SELECT 
  pr.id,
  a.stage_name,
  u.email,
  pr.amount,
  pr.mobile_money_number,
  ab.available_balance as solde_disponible,
  pr.requested_at
FROM payout_requests pr
JOIN artists a ON a.id = pr.artist_id
JOIN auth.users u ON u.id = pr.artist_id
LEFT JOIN artist_balances ab ON ab.artist_id = pr.artist_id
WHERE pr.status = 'pending'
ORDER BY pr.requested_at ASC;

-- 3.2 Approuver une demande de retrait (REMPLACER 'PAYOUT_ID')
UPDATE payout_requests
SET 
  status = 'approved',
  processed_at = NOW()
WHERE id = 'PAYOUT_ID';

-- 3.3 Marquer comme payé et uploader preuve (REMPLACER LES IDs ET URL)
-- Étape 1 : Marquer comme payé
UPDATE payout_requests
SET 
  status = 'paid',
  processed_at = NOW()
WHERE id = 'PAYOUT_ID';

-- Étape 2 : Uploader la preuve (screenshot Mobile Money)
INSERT INTO payout_receipts (
  payout_request_id,
  receipt_url,
  uploaded_by
)
VALUES (
  'PAYOUT_ID',
  'https://votre-storage-url.com/receipts/screenshot.png',
  auth.uid() -- ID de l'admin qui upload
);

-- 3.4 Rejeter une demande de retrait
UPDATE payout_requests
SET 
  status = 'rejected',
  rejection_reason = 'Solde insuffisant / Autre raison',
  processed_at = NOW()
WHERE id = 'PAYOUT_ID';

-- 3.5 Historique des retraits (tous statuts)
SELECT 
  pr.id,
  a.stage_name,
  pr.amount,
  pr.status,
  pr.requested_at,
  pr.processed_at,
  pr.rejection_reason,
  prec.receipt_url
FROM payout_requests pr
JOIN artists a ON a.id = pr.artist_id
LEFT JOIN payout_receipts prec ON prec.payout_request_id = pr.id
ORDER BY pr.requested_at DESC
LIMIT 50;

-- 3.6 Total des retraits par statut
SELECT 
  status,
  COUNT(*) as nombre,
  SUM(amount) as montant_total
FROM payout_requests
GROUP BY status
ORDER BY COUNT(*) DESC;

-- ============================================
-- 4. MONITORING & ANALYTICS
-- ============================================

-- 4.1 Dashboard général
SELECT 
  (SELECT COUNT(*) FROM artists WHERE is_verified = true) as artistes_actifs,
  (SELECT COUNT(*) FROM transactions WHERE DATE(created_at) = CURRENT_DATE) as dons_aujourdhui,
  (SELECT COALESCE(SUM(gross_amount), 0) FROM transactions WHERE DATE(created_at) = CURRENT_DATE) as montant_aujourdhui,
  (SELECT COUNT(*) FROM payment_attempts WHERE status = 'pending') as paiements_en_attente,
  (SELECT COUNT(*) FROM payout_requests WHERE status = 'pending') as retraits_en_attente;

-- 4.2 Taux de conversion (paiements réussis vs abandonnés)
SELECT 
  COUNT(*) FILTER (WHERE status = 'success') as reussis,
  COUNT(*) FILTER (WHERE status = 'failed') as echoues,
  COUNT(*) FILTER (WHERE status = 'pending') as en_attente,
  COUNT(*) as total,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE status = 'success') / NULLIF(COUNT(*), 0), 
    2
  ) as taux_reussite_pct
FROM payment_attempts
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

-- 4.3 Montant moyen des dons
SELECT 
  ROUND(AVG(amount), 2) as montant_moyen,
  ROUND(MIN(amount), 2) as montant_min,
  ROUND(MAX(amount), 2) as montant_max,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount), 2) as montant_median
FROM payment_attempts
WHERE status = 'success'
  AND created_at >= CURRENT_DATE - INTERVAL '30 days';

-- 4.4 Donateurs récurrents (même device_id avec multiple dons)
SELECT 
  pa.device_id,
  pa.donor_name,
  COUNT(*) as nombre_dons,
  SUM(pa.amount) as montant_total,
  MIN(pa.created_at) as premier_don,
  MAX(pa.created_at) as dernier_don
FROM payment_attempts pa
WHERE pa.status = 'success'
GROUP BY pa.device_id, pa.donor_name
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC, SUM(pa.amount) DESC
LIMIT 20;

-- 4.5 Événements critiques récents
SELECT 
  event_type,
  description,
  reference_id,
  created_at
FROM admin_events
ORDER BY created_at DESC
LIMIT 50;

-- ============================================
-- 5. DÉTECTION D'ANOMALIES
-- ============================================

-- 5.1 Artistes avec beaucoup de retraits mais peu de dons
SELECT 
  a.stage_name,
  u.email,
  ab.total_earned,
  ab.total_withdrawn,
  COUNT(DISTINCT t.id) as nombre_dons,
  COUNT(DISTINCT pr.id) as nombre_retraits
FROM artists a
JOIN auth.users u ON u.id = a.id
LEFT JOIN artist_balances ab ON ab.artist_id = a.id
LEFT JOIN transactions t ON t.artist_id = a.id
LEFT JOIN payout_requests pr ON pr.artist_id = a.id
WHERE a.is_verified = true
GROUP BY a.id, a.stage_name, u.email, ab.total_earned, ab.total_withdrawn
HAVING COUNT(DISTINCT pr.id) > COUNT(DISTINCT t.id) * 0.5 -- Plus de 50% de ratio
ORDER BY COUNT(DISTINCT pr.id) DESC;

-- 5.2 Webhooks en échec (tentatives sans transaction confirmée)
SELECT 
  pa.id,
  pa.artist_id,
  pa.amount,
  pa.status,
  pa.cinetpay_reference,
  pa.created_at,
  pa.updated_at
FROM payment_attempts pa
LEFT JOIN transactions t ON t.payment_attempt_id = pa.id
WHERE pa.status = 'pending'
  AND t.id IS NULL
  AND pa.created_at < NOW() - INTERVAL '1 hour' -- Plus d'1h sans confirmation
ORDER BY pa.created_at DESC;

-- 5.3 Soldes négatifs (ne devrait jamais arriver)
SELECT 
  a.stage_name,
  ab.available_balance,
  ab.total_earned,
  ab.total_withdrawn
FROM artist_balances ab
JOIN artists a ON a.id = ab.artist_id
WHERE ab.available_balance < 0
ORDER BY ab.available_balance ASC;

-- ============================================
-- 6. MAINTENANCE & NETTOYAGE
-- ============================================

-- 6.1 Supprimer les tentatives de paiement échouées > 30 jours
-- ⚠️ ATTENTION : Exécuter avec précaution
DELETE FROM payment_attempts
WHERE status = 'failed'
  AND created_at < NOW() - INTERVAL '30 days';

-- 6.2 Archiver les anciennes transactions (optionnel)
-- Créer d'abord une table d'archive
CREATE TABLE IF NOT EXISTS transactions_archive (LIKE transactions INCLUDING ALL);

-- Déplacer transactions > 1 an
INSERT INTO transactions_archive
SELECT * FROM transactions
WHERE created_at < NOW() - INTERVAL '1 year';

-- Puis supprimer (ATTENTION)
-- DELETE FROM transactions WHERE created_at < NOW() - INTERVAL '1 year';

-- ============================================
-- 7. SUPPORT CLIENT
-- ============================================

-- 7.1 Rechercher un don par référence CinetPay
SELECT 
  t.id as transaction_id,
  t.provider_reference,
  t.gross_amount,
  t.net_amount,
  t.donor_name,
  a.stage_name as artiste,
  t.created_at
FROM transactions t
JOIN artists a ON a.id = t.artist_id
WHERE t.provider_reference = 'CINETPAY_REFERENCE_ICI';

-- 7.2 Historique complet d'un donateur (par device_id)
SELECT 
  pa.id,
  pa.amount,
  pa.status,
  pa.donor_name,
  a.stage_name as artiste,
  pa.created_at,
  t.id as transaction_id
FROM payment_attempts pa
JOIN artists a ON a.id = pa.artist_id
LEFT JOIN transactions t ON t.payment_attempt_id = pa.id
WHERE pa.device_id = 'DEVICE_ID_ICI'
ORDER BY pa.created_at DESC;

-- 7.3 Historique d'un artiste (tout)
SELECT 
  'donation' as type,
  t.id,
  t.gross_amount as montant,
  t.donor_name as details,
  t.created_at
FROM transactions t
WHERE t.artist_id = 'ARTIST_ID'
UNION ALL
SELECT 
  'payout' as type,
  pr.id,
  pr.amount as montant,
  pr.status as details,
  pr.requested_at as created_at
FROM payout_requests pr
WHERE pr.artist_id = 'ARTIST_ID'
ORDER BY created_at DESC;

-- ============================================
-- 8. EXPORTS & RAPPORTS
-- ============================================

-- 8.1 Rapport mensuel (pour comptabilité)
SELECT 
  TO_CHAR(t.created_at, 'YYYY-MM') as mois,
  COUNT(*) as nombre_transactions,
  SUM(t.gross_amount) as revenu_brut,
  SUM(t.platform_fee) as frais_plateforme,
  SUM(t.provider_fee) as frais_cinetpay,
  SUM(t.net_amount) as revenu_artistes
FROM transactions t
GROUP BY TO_CHAR(t.created_at, 'YYYY-MM')
ORDER BY mois DESC;

-- 8.2 Rapport par artiste (pour paiements)
SELECT 
  a.stage_name,
  u.email,
  ab.available_balance as solde_disponible,
  ab.total_earned as total_gagne,
  ab.total_withdrawn as total_retire,
  COUNT(t.id) as nombre_transactions
FROM artists a
JOIN auth.users u ON u.id = a.id
LEFT JOIN artist_balances ab ON ab.artist_id = a.id
LEFT JOIN transactions t ON t.artist_id = a.id
WHERE a.is_verified = true
GROUP BY a.id, a.stage_name, u.email, ab.available_balance, ab.total_earned, ab.total_withdrawn
ORDER BY ab.available_balance DESC;

-- ============================================
-- NOTES D'UTILISATION
-- ============================================

-- 1. Sauvegarder ces requêtes comme "snippets" dans Supabase SQL Editor
-- 2. Remplacer les placeholders (ARTIST_ID, PAYOUT_ID, etc.) avant exécution
-- 3. Toujours tester sur une copie de données avant modifications de masse
-- 4. Les DELETE peuvent être irréversibles - faire un backup avant
-- 5. Pour automatiser : créer des vues ou des fonctions stockées
