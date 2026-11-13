export type Role = 'customer' | 'farmer' | 'admin'

// Cloudflare Worker bindings + secrets, wired up in wrangler.jsonc / `wrangler secret put`.
export type Bindings = {
  DATABASE_URL: string
  JWT_SECRET: string
  JWT_REFRESH_SECRET: string
  FIREBASE_PROJECT_ID: string
  RAZORPAY_KEY_ID: string
  RAZORPAY_KEY_SECRET: string
  RAZORPAY_WEBHOOK_SECRET: string
  NIMBUSPOST_EMAIL: string
  NIMBUSPOST_PASSWORD: string
  NIMBUSPOST_KEY: string
  NIMBUSPOST_SECRET: string
  NIMBUSPOST_WEBHOOK_SECRET: string
  OLA_MAPS_API_KEY: string
  SARVAM_API_KEY: string
  MEDIA_BUCKET: R2Bucket
  RATE_LIMIT_KV: KVNamespace
}

// Populated by the auth middleware after verifying a bearer token.
export type AuthContext = {
  id: string
  role: Role
  phone: string
}

export type AppEnv = {
  Bindings: Bindings
  Variables: {
    auth: AuthContext
  }
}
