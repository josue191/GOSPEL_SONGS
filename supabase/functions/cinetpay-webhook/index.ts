// ============================================
// AFRISENS - CinetPay Webhook Handler
// CRITICAL: This is the ONLY way transactions are created
// ============================================

import { serve } from 'std/http/server.ts'
import { createClient } from 'supabase'

interface CinetPayWebhook {
    cpm_site_id: string
    cpm_trans_id: string
    cpm_trans_date: string
    cpm_amount: string
    cpm_currency: string
    cpm_payid: string
    cpm_payment_config: string
    cpm_page_action: string
    cpm_custom: string
    cpm_designation: string
    cpm_error_message: string
    signature?: string
    payment_method?: string
    cel_phone_num?: string
    cpm_phone_prefixe?: string
}

serve(async (req: Request) => {
    try {
        // Get Supabase client with service role
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Parse webhook payload
        const webhookData: CinetPayWebhook = await req.json()
        console.log('Received CinetPay webhook:', JSON.stringify(webhookData, null, 2))

        // Extract transaction details
        const {
            cpm_trans_id,
            cpm_amount,
            cpm_currency,
            cpm_payid,
            cpm_page_action,
            cpm_custom,
            payment_method,
        } = webhookData

        // Only process successful payments
        if (cpm_page_action !== 'PAYMENT_CONFIRMATION') {
            console.log('Webhook action not PAYMENT_CONFIRMATION:', cpm_page_action)
            return new Response('Not a confirmation', { status: 200 })
        }

        // Verify payment with CinetPay API v1 (double-check status)
        const cinetpayApiKey = Deno.env.get('CINETPAY_API_KEY')
        const cinetpaySiteId = Deno.env.get('CINETPAY_SITE_ID')

        // Prepare form-urlencoded body for CinetPay API v1
        const checkPayStatusBody = new URLSearchParams({
            username: cinetpayApiKey!,
            password: cinetpaySiteId!,
            cpm_trans_id: cpm_trans_id,
        })

        const verifyResponse = await fetch('https://api.cinetpay.com/v1/?method=checkPayStatus', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: checkPayStatusBody.toString(),
        })

        const verifyData = await verifyResponse.json()
        console.log('CinetPay checkPayStatus response:', JSON.stringify(verifyData, null, 2))

        // Check if payment is successful
        if (!verifyData.data || verifyData.data.cpm_result !== '00' || verifyData.data.cpm_trans_status !== 'ACCEPTED') {
            console.log('Payment not accepted:', verifyData)
            return new Response('Payment not successful', { status: 200 })
        }

        // Find payment attempt using transaction_id
        const { data: paymentAttempt, error: attemptError } = await supabaseClient
            .from('payment_attempts')
            .select('*')
            .eq('id', cpm_trans_id)
            .single()

        if (attemptError || !paymentAttempt) {
            console.error('Payment attempt not found:', attemptError)
            return new Response('Payment attempt not found', { status: 404 })
        }

        // Check if transaction already exists (idempotence)
        const { data: existingTransaction } = await supabaseClient
            .from('transactions')
            .select('id')
            .eq('provider_reference', cpm_payid)
            .maybeSingle()

        if (existingTransaction) {
            console.log('Transaction already processed (idempotent):', cpm_payid)
            return new Response('Already processed', { status: 200 })
        }

        // Calculate fees
        const grossAmount = parseFloat(cpm_amount)
        const platformFeePercent = 0.05 // 5% platform fee
        const providerFeePercent = 0.025 // 2.5% CinetPay fee
        const platformFee = grossAmount * platformFeePercent
        const providerFee = grossAmount * providerFeePercent
        const netAmount = grossAmount - platformFee - providerFee

        // Create transaction
        const { data: transaction, error: transactionError } = await supabaseClient
            .from('transactions')
            .insert({
                payment_attempt_id: paymentAttempt.id,
                artist_id: paymentAttempt.artist_id,
                gross_amount: grossAmount,
                platform_fee: platformFee,
                provider_fee: providerFee,
                net_amount: netAmount,
                currency: cpm_currency,
                donor_name: paymentAttempt.donor_name,
                provider_reference: cpm_payid,
            })
            .select()
            .single()

        if (transactionError) {
            console.error('Failed to create transaction:', transactionError)
            return new Response('Transaction creation failed', { status: 500 })
        }

        console.log('Transaction created successfully:', transaction.id)

        // Update payment attempt status
        await supabaseClient
            .from('payment_attempts')
            .update({
                status: 'success',
                cinetpay_reference: cpm_payid,
            })
            .eq('id', paymentAttempt.id)

        // Log admin event
        await supabaseClient
            .from('admin_events')
            .insert({
                event_type: 'payment_confirmed',
                reference_id: transaction.id,
                description: `Payment confirmed: ${grossAmount} ${cpm_currency} to artist ${paymentAttempt.artist_id}`,
                metadata: {
                    payment_method,
                    provider_reference: cpm_payid,
                    gross_amount: grossAmount,
                    net_amount: netAmount,
                },
            })

        return new Response(
            JSON.stringify({ success: true, transaction_id: transaction.id }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('Webhook processing error:', error)
        return new Response(
            JSON.stringify({ error: 'Internal error', message: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
})

// Helper function to verify webhook signature
function verifySignature(_webhookData: CinetPayWebhook): boolean {
    return true // Temporarily accept all
}
