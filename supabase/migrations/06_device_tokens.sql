-- Migration 06 - Device Tokens for Notifications
-- Stores FCM tokens for artists and users

CREATE TABLE IF NOT EXISTS public.device_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    fcm_token TEXT NOT NULL,
    device_type TEXT, -- 'ios', 'android'
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, fcm_token)
);

-- Enable RLS
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'device_tokens' AND policyname = 'Users can manage their own tokens'
    ) THEN
        CREATE POLICY "Users can manage their own tokens" ON public.device_tokens
            FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'device_tokens' AND policyname = 'Service role can see all tokens'
    ) THEN
        CREATE POLICY "Service role can see all tokens" ON public.device_tokens
            FOR SELECT TO service_role USING (true);
    END IF;
END $$;

-- Help with cleanup and monitoring
COMMENT ON TABLE public.device_tokens IS 'Stores Firebase Cloud Messaging tokens for push notifications.';
