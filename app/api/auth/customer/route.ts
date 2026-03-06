import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"

// Simple in-memory OTP store (replace with Redis in production)
const otpStore = new Map<string, { otp: string; name: string; expires: number }>()

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const { email, name, otp, expectedOtp, action } = await req.json()

    if (!email) return NextResponse.json({ success: false, error: "Email required" }, { status: 400 })

    if (action === "sendOtp") {
      // Generate 6-digit OTP
      const generated = Math.floor(100000 + Math.random() * 900000).toString()
      otpStore.set(email.toLowerCase(), {
        otp: generated,
        name: name || email.split("@")[0],
        expires: Date.now() + 10 * 60 * 1000, // 10 min
      })

      // In production: send email via Nodemailer/Resend/SendGrid
      // await sendEmail({ to: email, subject: "Your TRIDENT OTP", body: `Your OTP is ${generated}` })

      console.log(`[OTP] ${email} → ${generated}`) // Dev only

      return NextResponse.json({
        success: true,
        message: "OTP sent.",
        devOtp: process.env.NODE_ENV === "development" ? generated : undefined,
      })
    }

    if (action === "verifyOtp") {
      const stored = otpStore.get(email.toLowerCase())

      // Also allow the expectedOtp passed from client (demo fallback)
      const isValid =
        (stored && stored.otp === otp && Date.now() < stored.expires) ||
        (expectedOtp && otp === expectedOtp)

      if (!isValid) {
        return NextResponse.json({ success: false, error: "Invalid or expired OTP." }, { status: 401 })
      }

      // Clear OTP
      otpStore.delete(email.toLowerCase())

      const customerName = stored?.name || name || email.split("@")[0]

      return NextResponse.json({
        success: true,
        data: {
          name: customerName,
          email: email.toLowerCase(),
          token: Buffer.from(`${email}:${Date.now()}`).toString("base64"),
        }
      })
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
