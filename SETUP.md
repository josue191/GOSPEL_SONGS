# AFRISENS - Setup Guide

## Prerequisites

- Node.js 18+ installed
- Expo CLI: `npm install -g expo-cli`
- EAS CLI (for builds): `npm install -g eas-cli`
- Supabase account: https://supabase.com
- CinetPay account: https://cinetpay.com

## Setup Steps

### 1. Supabase Setup

1. **Create a new Supabase project**:
   - Go to https://app.supabase.com
   - Create a new project
   - Note down your project URL and anon key

2. **Run database migrations**:
   ```bash
   # Navigate to your Supabase project dashboard
   # Go to SQL Editor
   # Run the following files in order:
   - supabase/migrations/01_schema.sql
   - supabase/migrations/02_rls_policies.sql
   - supabase/migrations/03_triggers.sql
   ```

3. **Deploy Edge Functions**:
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Login
   supabase login
   
   # Link your project
   supabase link --project-ref YOUR_PROJECT_REF
   
   # Deploy functions
   supabase functions deploy create-payment
   supabase functions deploy cinetpay-webhook
   
   # Set secrets
   supabase secrets set CINETPAY_API_KEY=your_api_key
   supabase secrets set CINETPAY_SITE_ID=your_site_id
   supabase secrets set CINETPAY_NOTIFY_URL=https://YOUR_PROJECT.supabase.co/functions/v1/cinetpay-webhook
   ```

### 2. CinetPay Setup

1. **Get API credentials**:
   - Login to your CinetPay dashboard
   - Get your API Key and Site ID
   - Configure webhook URL to: `https://YOUR_PROJECT.supabase.co/functions/v1/cinetpay-webhook`

2. **Test mode**:
   - Use sandbox credentials for testing
   - Switch to production when ready to launch

### 3. Mobile App Setup

1. **Install dependencies**:
   ```bash
   cd GOSPEL_SONGS
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env with your values:
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Start development server**:
   ```bash
   npx expo start
   ```

4. **Run on Android**:
   ```bash
   npx expo start --android
   ```

5. **Build APK for testing**:
   ```bash
   # Login to EAS
   eas login
   
   # Configure project
   eas build:configure
   
   # Build Android APK
   eas build --platform android --profile preview
   ```

### 4. Testing Flow

1. **Guest mode testing**:
   - Open app → "Je veux soutenir"
   - Browse artists (you'll need to add test artists first)
   - Make test donation with CinetPay sandbox

2. **Artist mode testing**:
   - Create test artist account
   - Upload verification video
   - Manually verify artist in Supabase Dashboard
   - Test dashboard, songs, payouts

### 5. Admin Tasks

**Initial Admin Setup** (via Supabase Dashboard):

1. **Verify artists**:
   ```sql
   UPDATE artists
   SET is_verified = TRUE
   WHERE id = 'artist-id';
   ```

2. **Approve payout requests**:
   ```sql
   UPDATE payout_requests
   SET status = 'paid'
   WHERE id = 'payout-id';
   
   -- Upload receipt
   INSERT INTO payout_receipts (payout_request_id, receipt_url)
   VALUES ('payout-id', 'https://storage-url/receipt.png');
   ```

3. **View transactions**:
   ```sql
   SELECT 
     t.*,
     a.stage_name,
     t.donor_name
   FROM transactions t
   JOIN artists a ON t.artist_id = a.id
   ORDER BY t.created_at DESC
   LIMIT 50;
   ```

## Project Structure

```
GOSPEL_SONGS/
├── app/                      # Expo Router screens
│   ├── (guest)/              # Guest mode screens
│   ├── (artist)/             # Artist mode screens
│   ├── _layout.tsx           # Root layout
│   └── index.tsx             # Mode selection
├── components/               # Reusable components
├── lib/                      # Utility libraries
│   ├── supabase.ts          # Supabase client
│   ├── deviceId.ts          # Device ID management
│   └── notifications.ts     # FCM setup
├── supabase/
│   ├── migrations/          # SQL migrations
│   └── functions/           # Edge Functions
├── types/                   # TypeScript types
├── app.json                 # Expo configuration
├── package.json            # Dependencies
└── .env                    # Environment variables
```

## Key Reminders

⚠️ **Security**:
- NEVER expose `SUPABASE_SERVICE_ROLE_KEY` to mobile app
- Only use `SUPABASE_ANON_KEY` in the app
- All financial operations go through Edge Functions with service_role

⚠️ **APK Size**:
- Target: < 30 MB
- Compress images before upload
- Use lazy loading for heavy screens

⚠️ **Payment Flow**:
- App creates `payment_attempt`
- Redirects to CinetPay via WebView
- Webhook confirms payment (source of truth)
- FCM notification sent even if app crashes

## Troubleshooting

**Issue**: RLS policies blocking queries
- Solution: Check that user is authenticated for artist routes
- For guest routes, ensure device_id is being passed

**Issue**: Webhook not receiving events
- Solution: Check CinetPay dashboard webhook configuration
- Verify URL is correct and accessible
- Check Supabase Function logs

**Issue**: APK too large
- Solution: Check `node_modules` size
- Remove unused dependencies
- Enable Hermes engine in `app.json`

## Next Steps

1. ✅ Create Supabase project and run migrations
2. ✅ Deploy Edge Functions
3. ✅ Configure CinetPay webhook
4. ⏳ Add test data (artists, songs)
5. ⏳ Test complete payment flow
6. ⏳ Build and deploy to internal testers
7. ⏳ Collect feedback and iterate
8. ⏳ Production launch
