import { createRemoteJWKSet, jwtVerify } from 'jose'

// Firebase ID tokens are RS256-signed; verify against Google's published JWKS
// instead of trusting any claims sent by the client.
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
)

export type FirebaseTokenClaims = {
  uid: string
  phone_number?: string
}

export async function verifyFirebaseIdToken(idToken: string, projectId: string): Promise<FirebaseTokenClaims> {
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  })

  if (!payload.sub) {
    throw new Error('Invalid Firebase token: missing subject')
  }

  return {
    uid: payload.sub,
    phone_number: payload.phone_number as string | undefined,
  }
}
