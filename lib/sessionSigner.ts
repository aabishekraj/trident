/**
 * HMAC-signed session tokens — replaces plain base64 encoding.
 * Each token is: base64url(payload).base64url(HMAC-SHA256 signature)
 * Verifying the signature prevents forgery.
 */
import crypto from "crypto"

function getSecret(): string {
  const s = process.env.NEXTAUTH_SECRET
  if (!s) throw new Error("NEXTAUTH_SECRET is not set — cannot sign sessions")
  return s
}

export function signSession(payload: object): string {
  const secret = getSecret()
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const sig = crypto.createHmac("sha256", secret).update(data).digest("base64url")
  return `${data}.${sig}`
}

export function verifySession(token: string): Record<string, unknown> | null {
  try {
    const secret = getSecret()
    const dot = token.lastIndexOf(".")
    if (dot < 1) return null
    const data = token.slice(0, dot)
    const sig  = token.slice(dot + 1)
    const expectedSig = crypto.createHmac("sha256", secret).update(data).digest("base64url")
    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null
    return JSON.parse(Buffer.from(data, "base64url").toString("utf8"))
  } catch {
    return null
  }
}
