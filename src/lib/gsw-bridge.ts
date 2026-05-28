import { createHmac, timingSafeEqual } from 'crypto'

/** Vercel env 미설정 시 포털(api/lib/gswBridgeToken.js)과 동일 fallback */
export const GSW_BRIDGE_SECRET_FALLBACK =
  'evkmc_gsw_lms_bridge_v1_K8mN2pQ7xR4wL9jH3fT6bY1cN5dA0eZ'

export function resolveGswBridgeSecret(envSecret?: string): string {
  const s = envSecret?.trim()
  if (s && s.length >= 16) return s
  return GSW_BRIDGE_SECRET_FALLBACK
}

export type GswBridgePayload = {
  email: string
  name?: string
  gsw_user_id: string
  department?: string
  employee_no?: string
  employee_id?: string
  position?: string
  company?: string
  exp: number
}

function base64UrlDecode(input: string): Buffer {
  const pad = '='.repeat((4 - (input.length % 4)) % 4)
  const b64 = (input + pad).replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(b64, 'base64')
}

function base64UrlEncode(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/** GSW 포털이 발급한 HMAC 서명 토큰 검증 (payloadB64.signatureB64) */
export function verifyGswBridgeToken(
  token: string,
  secret: string
): { ok: true; payload: GswBridgePayload } | { ok: false; error: string } {
  if (!token || !secret) {
    return { ok: false, error: '토큰 또는 시크릿이 없습니다.' }
  }

  const parts = token.split('.')
  if (parts.length !== 2) {
    return { ok: false, error: '토큰 형식이 올바르지 않습니다.' }
  }

  const [payloadB64, sigB64] = parts
  const expected = createHmac('sha256', secret).update(payloadB64).digest()
  const actual = base64UrlDecode(sigB64)

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return { ok: false, error: '서명이 일치하지 않습니다.' }
  }

  let payload: GswBridgePayload
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64).toString('utf8')) as GswBridgePayload
  } catch {
    return { ok: false, error: '페이로드를 해석할 수 없습니다.' }
  }

  if (!payload.email || !payload.gsw_user_id || !payload.exp) {
    return { ok: false, error: '필수 필드(email, gsw_user_id, exp)가 없습니다.' }
  }

  if (Date.now() > payload.exp * 1000) {
    return { ok: false, error: '토큰이 만료되었습니다.' }
  }

  return { ok: true, payload }
}

/** 개발·데모용 토큰 생성 (GSW 연동 전 테스트) */
export function createDevGswBridgeToken(
  payload: Omit<GswBridgePayload, 'exp'> & { exp?: number },
  secret: string
): string {
  const full: GswBridgePayload = {
    ...payload,
    exp: payload.exp ?? Math.floor(Date.now() / 1000) + 300,
  }
  const payloadB64 = base64UrlEncode(Buffer.from(JSON.stringify(full), 'utf8'))
  const sig = createHmac('sha256', secret).update(payloadB64).digest()
  return `${payloadB64}.${base64UrlEncode(sig)}`
}
