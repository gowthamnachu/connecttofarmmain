import { sign, verify } from 'hono/jwt'
import type { Role } from '../types/bindings'

export type TokenPayload = {
  sub: string
  role: Role
  phone: string
  exp: number
}

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60 // 15 minutes
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60 // 30 days

export async function signAccessToken(secret: string, payload: { sub: string; role: Role; phone: string }) {
  const exp = Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL_SECONDS
  return sign({ ...payload, exp }, secret, 'HS256')
}

export async function signRefreshToken(secret: string, payload: { sub: string; role: Role; phone: string }) {
  const exp = Math.floor(Date.now() / 1000) + REFRESH_TOKEN_TTL_SECONDS
  return sign({ ...payload, exp }, secret, 'HS256')
}

export async function verifyToken(secret: string, token: string): Promise<TokenPayload> {
  return (await verify(token, secret, 'HS256')) as unknown as TokenPayload
}
