import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import CartSession from "@/models/CartSession"
import nodemailer from "nodemailer"

// GET /api/crons/abandoned-cart
// Call this from a Vercel Cron Job or external scheduler every hour.
// Vercel cron.json: { "crons": [{ "path": "/api/crons/abandoned-cart", "schedule": "0 * * * *" }] }

function getTransporter() {
  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST || "smtp.gmail.com",
    port:   parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true",
    auth:   { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  })
}

export async function GET(req: NextRequest) {
  // Simple secret guard
  const secret = req.headers.get("x-cron-secret") || new URL(req.url).searchParams.get("secret")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await connectDB()

    // Find carts abandoned > 1 hour ago, not checked out, reminder not yet sent
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const abandoned = await CartSession.find({
      reminderSent: false,
      checkedOutAt: { $exists: false },
      updatedAt: { $lt: oneHourAgo },
    }).limit(50).lean()

    if (!abandoned.length) return NextResponse.json({ sent: 0 })

    let sent = 0

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = getTransporter()
      for (const cart of abandoned) {
        if (!cart.customerEmail || !cart.items?.length) continue
        try {
          const itemRows = (cart.items as Array<{ name: string; qty: number; price: number }>)
            .map(i => `<tr><td style="padding:8px 0;color:#888;">${i.name} × ${i.qty}</td><td style="padding:8px 0;text-align:right;color:#f5f5f5;">$${(i.price * i.qty).toFixed(2)}</td></tr>`)
            .join("")

          await transporter.sendMail({
            from: `"TRIDENT" <${process.env.EMAIL_USER}>`,
            to: cart.customerEmail,
            subject: "You left something behind — your cart is waiting",
            html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
              <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
                <div style="font-size:24px;font-weight:900;letter-spacing:6px;color:#f5f5f5;margin-bottom:4px;">TRI<span style="color:#e5202e;">DENT</span></div>
                <div style="height:2px;background:#e5202e;margin-bottom:32px;"></div>
                <p style="color:#aaa;font-size:14px;margin-bottom:8px;">Hi ${cart.customerName || "there"},</p>
                <p style="color:#f5f5f5;font-size:15px;line-height:1.65;margin-bottom:24px;">You left some items in your cart. They're still waiting for you.</p>
                <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">${itemRows}</table>
                <div style="border-top:1px solid #1e1e1e;padding-top:12px;margin-bottom:24px;">
                  <span style="color:#888;font-size:13px;">Total: </span>
                  <span style="color:#f5f5f5;font-weight:800;font-size:16px;">$${cart.total?.toFixed(2) ?? "—"}</span>
                </div>
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || ""}/checkout" style="display:inline-block;background:#e5202e;color:#fff;padding:14px 32px;font-weight:800;font-size:13px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;">COMPLETE YOUR ORDER →</a>
                <p style="color:#333;font-size:11px;margin-top:32px;">If you no longer wish to receive these emails, simply ignore this message.</p>
              </div>
            </body></html>`,
          })
          await CartSession.findByIdAndUpdate(cart._id, { reminderSent: true })
          sent++
        } catch { /* skip failed sends */ }
      }
    } else {
      // Dev mode: just mark them
      const ids = abandoned.map(c => c._id)
      await CartSession.updateMany({ _id: { $in: ids } }, { reminderSent: true })
      sent = abandoned.length
      console.log(`[AbandonedCart] Email not configured. Would have sent ${sent} reminders.`)
    }

    return NextResponse.json({ success: true, sent })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
