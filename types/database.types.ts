// ============================================
// Database Type Definitions
// Generated from Supabase schema
// ============================================

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    role: 'guest' | 'artist'
                    device_id: string | null
                    created_at: string
                }
                Insert: {
                    id: string
                    role: 'guest' | 'artist'
                    device_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    role?: 'guest' | 'artist'
                    device_id?: string | null
                    created_at?: string
                }
            }
            artists: {
                Row: {
                    id: string
                    stage_name: string
                    church_name: string | null
                    bio: string | null
                    profile_image_url: string | null
                    verification_video_url: string
                    is_verified: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    stage_name: string
                    church_name?: string | null
                    bio?: string | null
                    profile_image_url?: string | null
                    verification_video_url: string
                    is_verified?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    stage_name?: string
                    church_name?: string | null
                    bio?: string | null
                    profile_image_url?: string | null
                    verification_video_url?: string
                    is_verified?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            songs: {
                Row: {
                    id: string
                    artist_id: string
                    title: string
                    audio_url: string
                    cover_image_url: string | null
                    duration_seconds: number | null
                    is_public: boolean
                    play_count: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    artist_id: string
                    title: string
                    audio_url: string
                    cover_image_url?: string | null
                    duration_seconds?: number | null
                    is_public?: boolean
                    play_count?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    artist_id?: string
                    title?: string
                    audio_url?: string
                    cover_image_url?: string | null
                    duration_seconds?: number | null
                    is_public?: boolean
                    play_count?: number
                    created_at?: string
                }
            }
            payment_attempts: {
                Row: {
                    id: string
                    artist_id: string
                    device_id: string
                    amount: number
                    currency: string
                    status: 'initiated' | 'pending' | 'success' | 'failed'
                    cinetpay_reference: string | null
                    donor_name: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    artist_id: string
                    device_id: string
                    amount: number
                    currency?: string
                    status: 'initiated' | 'pending' | 'success' | 'failed'
                    cinetpay_reference?: string | null
                    donor_name?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    artist_id?: string
                    device_id?: string
                    amount?: number
                    currency?: string
                    status?: 'initiated' | 'pending' | 'success' | 'failed'
                    cinetpay_reference?: string | null
                    donor_name?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            transactions: {
                Row: {
                    id: string
                    payment_attempt_id: string | null
                    artist_id: string
                    gross_amount: number
                    platform_fee: number
                    provider_fee: number
                    net_amount: number
                    currency: string
                    donor_name: string | null
                    provider_reference: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    payment_attempt_id?: string | null
                    artist_id: string
                    gross_amount: number
                    platform_fee: number
                    provider_fee: number
                    net_amount: number
                    currency?: string
                    donor_name?: string | null
                    provider_reference: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    payment_attempt_id?: string | null
                    artist_id?: string
                    gross_amount?: number
                    platform_fee?: number
                    provider_fee?: number
                    net_amount?: number
                    currency?: string
                    donor_name?: string | null
                    provider_reference?: string
                    created_at?: string
                }
            }
            artist_balances: {
                Row: {
                    artist_id: string
                    available_balance: number
                    total_earned: number
                    total_withdrawn: number
                    updated_at: string
                }
                Insert: {
                    artist_id: string
                    available_balance?: number
                    total_earned?: number
                    total_withdrawn?: number
                    updated_at?: string
                }
                Update: {
                    artist_id?: string
                    available_balance?: number
                    total_earned?: number
                    total_withdrawn?: number
                    updated_at?: string
                }
            }
            payout_requests: {
                Row: {
                    id: string
                    artist_id: string
                    amount: number
                    status: 'pending' | 'approved' | 'rejected' | 'paid'
                    mobile_money_number: string | null
                    rejection_reason: string | null
                    requested_at: string
                    processed_at: string | null
                }
                Insert: {
                    id?: string
                    artist_id: string
                    amount: number
                    status: 'pending' | 'approved' | 'rejected' | 'paid'
                    mobile_money_number?: string | null
                    rejection_reason?: string | null
                    requested_at?: string
                    processed_at?: string | null
                }
                Update: {
                    id?: string
                    artist_id?: string
                    amount?: number
                    status?: 'pending' | 'approved' | 'rejected' | 'paid'
                    mobile_money_number?: string | null
                    rejection_reason?: string | null
                    requested_at?: string
                    processed_at?: string | null
                }
            }
            payout_receipts: {
                Row: {
                    id: string
                    payout_request_id: string
                    receipt_url: string
                    uploaded_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    payout_request_id: string
                    receipt_url: string
                    uploaded_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    payout_request_id?: string
                    receipt_url?: string
                    uploaded_by?: string | null
                    created_at?: string
                }
            }
            admin_events: {
                Row: {
                    id: string
                    event_type: string
                    reference_id: string | null
                    actor_id: string | null
                    description: string | null
                    metadata: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    event_type: string
                    reference_id?: string | null
                    actor_id?: string | null
                    description?: string | null
                    metadata?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    event_type?: string
                    reference_id?: string | null
                    actor_id?: string | null
                    description?: string | null
                    metadata?: Json | null
                    created_at?: string
                }
            }
        }
    }
}
