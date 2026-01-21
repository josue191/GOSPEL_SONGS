// ============================================
// AFRISENS - Create Payment Edge Function
// Initiates payment with CinetPay
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-id',
}

interface PaymentRequest {
  artist_id: string
  amount: number
  currency?: string
  donor_name?: string
  device_id: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Supabase client with service role (bypass RLS)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const { artist_id, amount, currency = 'USD', donor_name, device_id }: PaymentRequest = await req.json()

    // Validate inputs
    if (!artist_id || !amount || !device_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: artist_id, amount, device_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Amount must be greater than 0' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify artist exists and is verified
    const { data: artist, error: artistError } = await supabaseClient
      .from('artists')
      .select('id, is_verified, stage_name')
      .eq('id', artist_id)
      .single()

    if (artistError || !artist) {
      return new Response(
        JSON.stringify({ error: 'Artist not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!artist.is_verified) {
      return new Response(
        JSON.stringify({ error: 'Artist is not verified yet' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create payment attempt record
    const { data: paymentAttempt, error: attemptError } = await supabaseClient
      .from('payment_attempts')
      .insert({
        artist_id,
        device_id,
        amount,
        currency,
        donor_name,
        status: 'initiated',
      })
      .select()
      .single()

    if (attemptError) {
      console.error('Error creating payment attempt:', attemptError)
      return new Response(
        JSON.stringify({ error: 'Failed to create payment attempt' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize CinetPay payment using API v1
    const cinetpayApiKey = Deno.env.get('CINETPAY_API_KEY')
    const cinetpaySiteId = Deno.env.get('CINETPAY_SITE_ID')
    const cinetpayNotifyUrl = Deno.env.get('CINETPAY_NOTIFY_URL') // Webhook URL

    if (!cinetpayApiKey || !cinetpaySiteId || !cinetpayNotifyUrl) {
      return new Response(
        JSON.stringify({ error: 'CinetPay configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare CinetPay request for seamless payment
    // Documentation: https://docs.cinetpay.com
    const cinetpayPayload = {
      apikey: cinetpayApiKey,
      site_id: parseInt(cinetpaySiteId),
      transaction_id: paymentAttempt.id, // Use our payment_attempt ID
      amount: amount,
      currency: 'XOF', // CFA Franc (CinetPay uses XOF)
      description: `Don pour ${artist.stage_name}`,
      customer_name: donor_name || 'Donateur',
      customer_surname: donor_name ? '' : 'Anonyme',
      notify_url: cinetpayNotifyUrl,
      return_url: `afrisens://payment-return/${paymentAttempt.id}`, // Deep link
      channels: 'ALL', // Accept all payment methods (Mobile Money, Card, etc.)
      metadata: JSON.stringify({
        artist_id,
        device_id,
        payment_attempt_id: paymentAttempt.id,
      }),
    }

    // Call CinetPay Checkout API (v2 for checkout URL generation)
    const cinetpayResponse = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cinetpayPayload),
    })

    const cinetpayData = await cinetpayResponse.json()

    if (cinetpayData.code !== '201') {
      console.error('CinetPay error:', cinetpayData)

      // Update payment attempt to failed
      await supabaseClient
        .from('payment_attempts')
        .update({ status: 'failed' })
        .eq('id', paymentAttempt.id)

      return new Response(
        JSON.stringify({
          error: 'Payment initialization failed',
          details: cinetpayData.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update payment attempt with CinetPay reference
    await supabaseClient
      .from('payment_attempts')
      .update({
        cinetpay_reference: cinetpayData.data.transaction_id,
        status: 'pending',
      })
      .eq('id', paymentAttempt.id)

    // Return payment URL to client
    return new Response(
      JSON.stringify({
        success: true,
        payment_url: cinetpayData.data.payment_url,
        payment_token: cinetpayData.data.payment_token,
        payment_attempt_id: paymentAttempt.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
