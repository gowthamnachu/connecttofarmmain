const RAZORPAY_API_BASE = 'https://api.razorpay.com/v1'

function basicAuthHeader(keyId: string, keySecret: string) {
  const encoded = btoa(`${keyId}:${keySecret}`)
  return `Basic ${encoded}`
}

export async function createRazorpayOrder(params: {
  keyId: string
  keySecret: string
  amountPaise: number
  receipt: string
}) {
  const res = await fetch(`${RAZORPAY_API_BASE}/orders`, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(params.keyId, params.keySecret),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: params.amountPaise,
      currency: 'INR',
      receipt: params.receipt,
    }),
  })

  if (!res.ok) {
    throw new Error(`Razorpay order creation failed: ${res.status} ${await res.text()}`)
  }

  return res.json() as Promise<{ id: string; amount: number; currency: string }>
}

async function hmacSha256Hex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Verifies the checkout payment signature returned to the frontend after a successful payment.
export async function verifyRazorpayPaymentSignature(params: {
  keySecret: string
  orderId: string
  paymentId: string
  signature: string
}) {
  const expected = await hmacSha256Hex(params.keySecret, `${params.orderId}|${params.paymentId}`)
  return expected === params.signature
}

// Verifies the `X-Razorpay-Signature` header on async webhook events.
export async function verifyRazorpayWebhookSignature(params: {
  webhookSecret: string
  rawBody: string
  signature: string
}) {
  const expected = await hmacSha256Hex(params.webhookSecret, params.rawBody)
  return expected === params.signature
}
