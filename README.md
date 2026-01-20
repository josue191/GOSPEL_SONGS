# AFRISENS - Gospel Songs Donation Platform

🔒 **Secure donation platform for gospel artists in the Democratic Republic of Congo**

## Overview

AFRISENS is a mobile-first donation platform that connects gospel music fans with their favorite artists. Built with a unique dual-mode architecture:

- **Guest Mode**: Donors can support artists without creating an account
- **Artist Mode**: Gospel singers receive donations, manage content, and request payouts

### Key Features

✅ **Zero Friction for Donors**
- No account required
- Device ID-based donation tracking
- CinetPay Mobile Money integration
- Push notifications for confirmation

✅ **Secure Financial Operations**
- PostgreSQL with ACID transactions
- Row-Level Security (RLS) policies
- Automatic balance calculations via triggers
- Idempotent webhook processing

✅ **Optimized for DRC**
- APK target: <30MB
- Works on 2GB RAM devices
- Offline-aware architecture
- FCM notifications survive app crashes

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Mobile App | React Native + Expo (Managed) |
| Backend | Supabase (PostgreSQL) |
| Payments | CinetPay |
| Auth | Supabase Auth (artists only) |
| Notifications | Firebase Cloud Messaging |
| Storage | Supabase Storage |

## Project Structure

```
GOSPEL_SONGS/
├── app/                          # Expo Router screens
│   ├── (guest)/                  # Guest mode (donors)
│   │   ├── artists.tsx           # Artists listing
│   │   ├── artist/[id].tsx       # Artist detail + donation
│   │   └── history.tsx           # Donation history
│   ├── (artist)/                 # Artist mode (singers)
│   │   └── auth/
│   ├── _layout.tsx               # Root layout
│   └── index.tsx                 # Mode selection
├── components/                   # Reusable UI components
├── lib/
│   ├── supabase.ts              # Supabase client
│   ├── deviceId.ts              # Device ID management
│   └── notifications.ts         # FCM setup
├── supabase/
│   ├── migrations/              # Database schema
│   │   ├── 01_schema.sql        # 9 tables
│   │   ├── 02_rls_policies.sql  # Security policies
│   │   └── 03_triggers.sql      # Balance automation
│   └── functions/               # Edge Functions
│       ├── create-payment/      # Payment initiation
│       └── cinetpay-webhook/    # Payment confirmation
├── types/
│   └── database.types.ts        # TypeScript types
├── app.json                     # Expo configuration
├── package.json                 # Dependencies
└── .env.example                 # Environment template
```

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- CinetPay account
- Android Studio (for Android builds)

### Installation

1. **Clone and install dependencies**:
   ```bash
   cd GOSPEL_SONGS
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase and CinetPay credentials
   ```

3. **Set up Supabase**:
   - Create a Supabase project
   - Run migrations in SQL Editor (01, 02, 03)
   - Deploy Edge Functions
   - Configure secrets

4. **Start development**:
   ```bash
   npx expo start
   ```

For detailed setup instructions, see **[SETUP.md](SETUP.md)**.

## Database Schema

### Core Tables

1. **`profiles`** - User identity and roles (guest/artist)
2. **`artists`** - Gospel artist profiles with verification
3. **`songs`** - Audio content
4. **`payment_attempts`** - ALL payment clicks tracked
5. **`transactions`** - CONFIRMED money only (webhook-only writes)
6. **`artist_balances`** - Auto-calculated via triggers
7. **`payout_requests`** - Withdrawal requests
8. **`payout_receipts`** - Mobile Money transfer proofs
9. **`admin_events`** - Audit trail

### Security Model

- **Guest users**: Read artists/songs, insert payment_attempts, read own history via device_id
- **Artists**: Read own transactions/balance, create payouts (if verified)
- **Service role only**: Insert transactions, update balances
- **Admin events**: Service role only

## Payment Flow

```
[Donor selects artist]
    ↓
[Enter amount + optional name]
    ↓
[App creates payment_attempt]
    ↓
[Edge Function → CinetPay checkout URL]
    ↓
[WebView opens Mobile Money payment]
    ↓
[User completes payment]
    ↓
[CinetPay webhook → Edge Function]
    ↓
[Verify signature + double-check status]
    ↓
[Create transaction (idempotent via provider_reference)]
    ↓
[PostgreSQL trigger updates artist_balance]
    ↓
[FCM notifications sent]
    ↓
[Done: Money safe, artist credited]
```

## Key Design Decisions

### Why Device ID Instead of Accounts?

- **Zero friction**: Donors don't want to create accounts
- **Privacy**: No personal data stored for guests
- **Local history**: AsyncStorage + device_id = simple, effective
- **Trust**: Users see their past donations immediately

### Why PostgreSQL Over Firebase Firestore?

- **ACID transactions**: Money requires guarantees
- **SQL auditable**: Financial regulations need clear logs
- **RLS = security**: Database enforces rules, not app code
- **Triggers**: Automatic balance updates prevent bugs

### Why Supabase Edge Functions?

- **Service role access**: Bypass RLS for webhook processing
- **Serverless**: Auto-scaling with zero ops
- **Deno runtime**: Type-safe, modern
- **Close to DB**: Low latency for financial operations

## Fee Structure

Default configuration (customize in Edge Function):

- **Platform fee**: 5% (AFRISENS)
- **Provider fee**: 2.5% (CinetPay estimate - verify actual)
- **Net to artist**: 92.5% of gross amount

Example: $10 donation → $0.50 platform + $0.25 provider = **$9.25 to artist**

## Building for Production

### Android APK

```bash
# Login to EAS
eas login

# Build production APK
eas build --platform android --profile production

# Result: APK ready for Google Play or direct distribution
```

### iOS (Future)

```bash
eas build --platform ios --profile production
```

## Testing Checklist

- [ ] Guest can view artists without account
- [ ] Device ID persists across app restarts
- [ ] Payment WebView opens correctly
- [ ] Webhook processes duplicate events idempotently
- [ ] Artist balance updates automatically after payment
- [ ] FCM notification received even if app backgrounded
- [ ] Donation history shows correct status
- [ ] RLS prevents unauthorized data access
- [ ] APK size < 30MB
- [ ] App runs smoothly on 2GB RAM device

## Environment Variables

```bash
# Required for mobile app
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxx

# Required for Edge Functions (set via Supabase CLI)
CINETPAY_API_KEY=xxx
CINETPAY_SITE_ID=xxx
CINETPAY_NOTIFY_URL=https://xxx.supabase.co/functions/v1/cinetpay-webhook
SUPABASE_SERVICE_ROLE_KEY=xxx
```

## Common Issues

**Q: Payment successful but balance not updated?**  
A: Check webhook logs in Supabase Functions. Ensure CinetPay webhook is configured correctly.

**Q: Guest can't see donation history?**  
A: Verify device_id is being generated and stored. Check RLS policy on `payment_attempts`.

**Q: Artist mode login fails?**  
A: Ensure artist profile exists and is linked to auth.users. Check Supabase Auth logs.

**Q: APK too large?**  
A: Remove unused assets, enable Hermes, check for duplicate dependencies.

## Next Steps

1. **Complete Artist Mode**:
   - Authentication screens
   - Dashboard with earnings
   - Song upload
   - Payout requests

2. **Admin Panel** (Web):
   - Artist verification interface
   - Payout approval workflow
   - Receipt upload

3. **Notifications**:
   - Integrate FCM token storage
   - Send notifications from Edge Functions

4. **Testing**:
   - End-to-end payment flow
   - Security audit
   - Performance testing on low-end devices

## License

Proprietary - AFRISENS Platform

## Support

For questions or issues, contact the development team.

---

**Built with ❤️ for the gospel music community in DRC**
"# GOSPEL_SONGS" 
