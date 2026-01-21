// ============================================
// AFRISENS - CinetPay Helper Library
// Based on official cinetpay-nodejs SDK
// ============================================

/**
 * CinetPay API v1 Integration
 * Documentation: https://github.com/cinetpay/seamlessIntegration
 */

const CINETPAY_API_V1 = 'https://api.cinetpay.com/v1'
const CINETPAY_API_V2_CHECKOUT = 'https://api-checkout.cinetpay.com/v2'

interface CheckPayStatusParams {
    apiKey: string
    siteId: string
    transactionId: string
}

interface CheckPayStatusResponse {
    code: string
    message: string
    data?: {
        cpm_site_id: string
        cpm_trans_id: string
        cpm_trans_date: string
        cpm_amount: string
        cpm_currency: string
        signature: string
        payment_method: string
        cel_phone_num: string
        cpm_phone_prefixe: string
        cpm_language: string
        cpm_version: string
        cpm_payment_config: string
        cpm_page_action: string
        cpm_custom: string
        cpm_designation: string
        buyer_name: string
        cpm_payid: string
        cpm_payment_date: string
        cpm_payment_time: string
        cpm_error_message: string
        cpm_result: string // "00" = success
        cpm_trans_status: string // "ACCEPTED" = success
        cpm_ipn_ack: string
    }
}

/**
 * Check payment status using CinetPay API v1
 * Official endpoint: https://api.cinetpay.com/v1/?method=checkPayStatus
 */
export async function checkPaymentStatus(
    params: CheckPayStatusParams
): Promise<CheckPayStatusResponse> {
    const { apiKey, siteId, transactionId } = params

    // Prepare form-urlencoded body as per CinetPay docs
    const body = new URLSearchParams({
        username: apiKey,
        password: siteId,
        cpm_trans_id: transactionId,
    })

    const response = await fetch(`${CINETPAY_API_V1}/?method=checkPayStatus`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
    })

    return await response.json()
}

/**
 * Verify if payment is successful
 */
export function isPaymentSuccessful(
    statusResponse: CheckPayStatusResponse
): boolean {
    return (
        statusResponse.data?.cpm_result === '00' &&
        statusResponse.data?.cpm_trans_status === 'ACCEPTED'
    )
}

/**
 * Extract payment details from webhook or status check
 */
export function extractPaymentDetails(data: CheckPayStatusResponse['data']) {
    if (!data) return null

    return {
        transactionId: data.cpm_trans_id,
        amount: parseFloat(data.cpm_amount),
        currency: data.cpm_currency,
        paymentId: data.cpm_payid,
        paymentMethod: data.payment_method,
        phoneNumber: data.cel_phone_num,
        phonePrefix: data.cpm_phone_prefixe,
        paymentDate: data.cpm_payment_date,
        paymentTime: data.cpm_payment_time,
        custom: data.cpm_custom,
        designation: data.cpm_designation,
        buyerName: data.buyer_name,
    }
}

/**
 * CinetPay currency codes
 */
export const CINETPAY_CURRENCIES = {
    XOF: 'XOF', // CFA Franc (West African)
    XAF: 'XAF', // CFA Franc (Central African)
    USD: 'USD', // US Dollar
} as const

/**
 * CinetPay payment channels
 */
export const CINETPAY_CHANNELS = {
    ALL: 'ALL',
    MOBILE_MONEY: 'MOBILE_MONEY',
    CARD: 'CARD',
} as const

/**
 * CinetPay result codes
 */
export const CINETPAY_RESULT_CODES = {
    SUCCESS: '00',
    PENDING: '01',
    FAILED: '02',
} as const

/**
 * CinetPay transaction statuses
 */
export const CINETPAY_STATUSES = {
    ACCEPTED: 'ACCEPTED',
    PENDING: 'PENDING',
    REFUSED: 'REFUSED',
    CANCELLED: 'CANCELLED',
} as const
