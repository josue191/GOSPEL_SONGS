-- ============================================
-- AFRISENS - SCRIPT DE CRÉATION DE DONNÉES TEST
-- Exécuter dans Supabase SQL Editor
-- ============================================

-- ============================================
-- IMPORTANT : Instructions d'utilisation
-- ============================================
-- 1. D'abord, créer un utilisateur dans Supabase Auth :
--    Dashboard → Authentication → Users → Add user
--    Email: artiste.test@afrisens.com
--    Password: Test123456!
-- 
-- 2. Copier l'ID utilisateur généré (UUID)
-- 
-- 3. Remplacer 'UUID_DE_L_UTILISATEUR_ICI' ci-dessous par cet ID
-- 
-- 4. Exécuter ce script dans SQL Editor
-- ============================================

-- ============================================
-- ARTISTE 1 : Père Molière Tonic
-- ============================================

-- Créer le profil
INSERT INTO profiles (id, role)
VALUES ('UUID_DE_L_UTILISATEUR_ICI', 'artist');

-- Créer l'artiste
INSERT INTO artists (
  id, 
  stage_name, 
  church_name, 
  bio, 
  verification_video_url, 
  is_verified
)
VALUES (
  'UUID_DE_L_UTILISATEUR_ICI',
  'Père Molière Tonic',
  'Église Évangélique du Congo - Kinshasa',
  'Chanteur gospel congolais passionné par la louange et l''adoration. Serviteur de Dieu depuis 2010, je mets mon talent au service de l''Évangile pour toucher les cœurs et glorifier le Seigneur.',
  'https://example.com/verification-video.mp4', -- À remplacer par vraie URL
  true  -- Vérifié pour les tests
);

-- Créer des chansons
INSERT INTO songs (artist_id, title, audio_url, is_public)
VALUES 
  ('UUID_DE_L_UTILISATEUR_ICI', 'Alléluia - Gloire à Dieu', 'https://example.com/alleluia.mp3', true),
  ('UUID_DE_L_UTILISATEUR_ICI', 'Jésus est Vivant', 'https://example.com/jesus-vivant.mp3', true),
  ('UUID_DE_L_UTILISATEUR_ICI', 'Merci Seigneur', 'https://example.com/merci.mp3', true),
  ('UUID_DE_L_UTILISATEUR_ICI', 'Dans Ta Présence', 'https://example.com/presence.mp3', true),
  ('UUID_DE_L_UTILISATEUR_ICI', 'Mon Rocher', 'https://example.com/rocher.mp3', true);

-- ============================================
-- ARTISTE 2 : Sœur Grâce Lumière
-- ============================================

-- Instructions : Répéter l'étape 1-2 pour créer un autre utilisateur
-- Email: grace.lumiere@afrisens.com
-- Remplacer 'UUID_UTILISATEUR_2_ICI' ci-dessous

/*
INSERT INTO profiles (id, role)
VALUES ('UUID_UTILISATEUR_2_ICI', 'artist');

INSERT INTO artists (
  id, 
  stage_name, 
  church_name, 
  bio, 
  verification_video_url, 
  is_verified
)
VALUES (
  'UUID_UTILISATEUR_2_ICI',
  'Sœur Grâce Lumière',
  'Armée du Salut - Lubumbashi',
  'Chanteuse gospel congolaise. Ma mission est de répandre la Bonne Nouvelle à travers la musique et d''encourager les âmes à s''approcher de Dieu.',
  'https://example.com/verification-grace.mp4',
  true
);

INSERT INTO songs (artist_id, title, audio_url, is_public)
VALUES 
  ('UUID_UTILISATEUR_2_ICI', 'Éternel est Ton Amour', 'https://example.com/eternel-amour.mp3', true),
  ('UUID_UTILISATEUR_2_ICI', 'Je Te Loue', 'https://example.com/je-te-loue.mp3', true),
  ('UUID_UTILISATEUR_2_ICI', 'Hosanna au Plus Haut', 'https://example.com/hosanna.mp3', true);
*/

-- ============================================
-- ARTISTE 3 : Frère David Espoir
-- ============================================

/*
INSERT INTO profiles (id, role)
VALUES ('UUID_UTILISATEUR_3_ICI', 'artist');

INSERT INTO artists (
  id, 
  stage_name, 
  church_name, 
  bio, 
  verification_video_url, 
  is_verified
)
VALUES (
  'UUID_UTILISATEUR_3_ICI',
  'Frère David Espoir',
  'Église Catholique - Goma',
  'Musicien et compositeur gospel. J''utilise la musique comme pont entre le ciel et la terre pour toucher les cœurs brisés.',
  'https://example.com/verification-david.mp4',
  false  -- Non vérifié pour tester le workflow de vérification
);

INSERT INTO songs (artist_id, title, audio_url, is_public)
VALUES 
  ('UUID_UTILISATEUR_3_ICI', 'Sauveur du Monde', 'https://example.com/sauveur.mp3', true),
  ('UUID_UTILISATEUR_3_ICI', 'Cantique Nouveau', 'https://example.com/cantique.mp3', true);
*/

-- ============================================
-- DONNÉES DE TEST : Transactions Simulées
-- ============================================

-- Créer quelques tentatives de paiement pour tester l'historique
-- Note : Utiliser un device_id fictif pour les tests

INSERT INTO payment_attempts (
  artist_id,
  device_id,
  amount,
  currency,
  status,
  donor_name
)
VALUES 
  ('UUID_DE_L_UTILISATEUR_ICI', 'test_device_001', 500, 'XOF', 'success', 'Jean Kabila'),
  ('UUID_DE_L_UTILISATEUR_ICI', 'test_device_002', 1000, 'XOF', 'success', 'Marie Tshisekedi'),
  ('UUID_DE_L_UTILISATEUR_ICI', 'test_device_003', 2000, 'XOF', 'pending', 'Pierre Lumumba'),
  ('UUID_DE_L_UTILISATEUR_ICI', 'test_device_001', 1500, 'XOF', 'success', 'Jean Kabila'); -- Donateur récurrent

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Vérifier que tout a été créé correctement
SELECT 
  a.stage_name,
  a.church_name,
  a.is_verified,
  COUNT(s.id) as nombre_chansons
FROM artists a
LEFT JOIN songs s ON s.artist_id = a.id
GROUP BY a.id, a.stage_name, a.church_name, a.is_verified;

-- Voir les tentatives de paiement
SELECT * FROM payment_attempts ORDER BY created_at DESC LIMIT 10;

-- ============================================
-- NOTES IMPORTANTES
-- ============================================

-- 1. Les URLs audio (https://example.com/...) sont des placeholders
--    Pour de vrais tests, uploader des fichiers sur Supabase Storage
--    
-- 2. Pour upload audio/images sur Supabase Storage :
--    - Dashboard → Storage → Create bucket "songs" (public)
--    - Upload fichiers
--    - Copier URL publique
--    - UPDATE songs SET audio_url = 'vraie_url' WHERE id = '...'
--
-- 3. Les transactions réelles sont créées uniquement via webhook CinetPay
--    Ne PAS insérer manuellement dans la table transactions
--
-- 4. Pour tester le flow complet :
--    - Utiliser l'app mobile
--    - Faire un vrai paiement test CinetPay (mode sandbox)
--    - Le webhook créera automatiquement la transaction

-- ============================================
-- BONUS : Créer un Invité (Guest) pour Tests
-- ============================================

-- Créer un profil guest (pour analytics/futur)
-- Note : En réalité, les guests n'ont pas de profil, juste un device_id

INSERT INTO profiles (id, role, device_id)
VALUES (gen_random_uuid(), 'guest', 'test_guest_device_123');
