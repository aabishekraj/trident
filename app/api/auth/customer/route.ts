import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

// Simple in-memory OTP store (replace with Redis in production)
type OtpRecord = { otp: string; name: string; expires: number; attempts: number }
const otpStore = new Map<string, OtpRecord>()

// Rate-limit: max OTP send attempts per email per 10 min window
const sendRateStore = new Map<string, { count: number; windowStart: number }>()
const MAX_SEND_PER_WINDOW = 3          // max OTP requests per 10-min window
const WINDOW_MS           = 10 * 60 * 1000
const MAX_VERIFY_ATTEMPTS = 5          // max wrong OTP guesses before lockout

function getTransporter() {
  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST || "smtp.gmail.com",
    port:   parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true",
    auth:   { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  })
}

async function sendOtpEmail(to: string, otp: string, name: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[OTP] Email not configured. OTP for ${to}: ${otp}`)
    return
  }
  const transporter = getTransporter()
  await transporter.sendMail({
    from: `"TRIDENT" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your TRIDENT Sign-In Code",
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
        <div style="max-width:480px;margin:0 auto;padding:40px 24px;">
          <div style="font-size:28px;font-weight:900;letter-spacing:6px;color:#f5f5f5;margin-bottom:8px;">
            TRI<span style="color:#e5202e;">DENT</span>
          </div>
          <div style="height:2px;background:#e5202e;margin-bottom:32px;"></div>
          <p style="color:#aaa;font-size:14px;margin-bottom:8px;">Hello, ${name}</p>
          <p style="color:#f5f5f5;font-size:16px;line-height:1.6;margin-bottom:32px;">
            Use the code below to sign in to your TRIDENT account.
            This code expires in <strong>10 minutes</strong>.
          </p>
          <div style="background:#111;border:1px solid #1e1e1e;border-left:3px solid #e5202e;padding:24px;text-align:center;margin-bottom:32px;">
            <div style="font-size:42px;font-weight:900;letter-spacing:16px;color:#f5f5f5;">${otp}</div>
          </div>
          <p style="color:#444;font-size:12px;line-height:1.6;">
            If you did not request this code, please ignore this email.
            Never share this code with anyone.
          </p>
          <div style="border-top:1px solid #1a1a1a;margin-top:32px;padding-top:16px;">
            <p style="color:#333;font-size:11px;">© ${new Date().getFullYear()} TRIDENT. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}

export async function POST(req: NextRequest) {
  try {
    const { email, name, otp, action } = await req.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, error: "Email required" }, { status: 400 })
    }
    const normalizedEmail = email.toLowerCase().trim().slice(0, 254)

    // ── sendOtp ─────────────────────────────────────────────────────────────
    if (action === "sendOtp") {
      // Rate limit: max 3 OTP sends per 10-minute window
      const now  = Date.now()
      const rate = sendRateStore.get(normalizedEmail)
      if (rate && now - rate.windowStart < WINDOW_MS) {
        if (rate.count >= MAX_SEND_PER_WINDOW) {
          return NextResponse.json({ success: false, error: "Too many requests. Please wait a few minutes before requesting another code." }, { status: 429 })
        }
        rate.count++
      } else {
        sendRateStore.set(normalizedEmail, { count: 1, windowStart: now })
      }

      const generated    = Math.floor(100000 + Math.random() * 900000).toString()
      const customerName = (typeof name === "string" && name.trim()) ? name.trim().slice(0, 100) : normalizedEmail.split("@")[0]

      otpStore.set(normalizedEmail, {
        otp: generated,
        name: customerName,
        expires: now + WINDOW_MS,
        attempts: 0,
      })

      try {
        await sendOtpEmail(normalizedEmail, generated, customerName)
      } catch (emailErr) {
        console.error("[OTP] Email send failed:", emailErr)
      }

      return NextResponse.json({ success: true, message: "OTP sent to your email." })
    }

    // ── verifyOtp ────────────────────────────────────────────────────────────
    if (action === "verifyOtp") {
      const stored = otpStore.get(normalizedEmail)

      if (!stored) {
        return NextResponse.json({ success: false, error: "No OTP found. Please request a new one." }, { status: 401 })
      }

      if (Date.now() > stored.expires) {
        otpStore.delete(normalizedEmail)
        return NextResponse.json({ success: false, error: "OTP has expired. Please request a new one." }, { status: 401 })
      }

      // Brute-force guard: max 5 wrong attempts
      if (stored.attempts >= MAX_VERIFY_ATTEMPTS) {
        otpStore.delete(normalizedEmail)
        return NextResponse.json({ success: false, error: "Too many incorrect attempts. Please request a new OTP." }, { status: 429 })
      }

      if (stored.otp !== String(otp)) {
        stored.attempts++
        const remaining = MAX_VERIFY_ATTEMPTS - stored.attempts
        return NextResponse.json({ success: false, error: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.` }, { status: 401 })
      }

      // Valid — clear and return customer data
      otpStore.delete(normalizedEmail)

      return NextResponse.json({
        success: true,
        data: {
          name:  stored.name,
          email: normalizedEmail,
          token: Buffer.from(`${normalizedEmail}:${Date.now()}`).toString("base64"),
        },
      })
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
