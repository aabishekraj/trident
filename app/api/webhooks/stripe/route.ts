import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { connectDB } from "@/lib/mongodb"
import Order from "@/models/Order"
import { sendOrderConfirmation } from "@/lib/email"

// Disable Next.js body parsing — Stripe needs the raw body for signature verification
export const config = { api: { bodyParser: false } }

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 })
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const body = await req.text()
  const sig  = req.headers.get("stripe-signature") || ""

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (e) {
    console.error("[Stripe Webhook] signature failed:", e)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const mongoId  = session.metadata?.mongoId
    const orderId  = session.metadata?.orderId

    if (!mongoId) {
      console.error("[Stripe Webhook] No mongoId in metadata")
      return NextResponse.json({ received: true })
    }

    try {
      await connectDB()
      const order = await Order.findByIdAndUpdate(
        mongoId,
        { paymentStatus: "paid", status: "processing" },
        { returnDocument: "after" }
      )

      if (order) {
        sendOrderConfirmation({
          orderId:         orderId || order.orderId,
          customerName:    order.customer.name,
          customerEmail:   order.customer.email,
          items:           order.items,
          totalAmount:     order.totalAmount,
          shippingAddress: order.customer.address || "",
        }).catch(e => console.error("[EMAIL confirm via webhook]", e))
      }
    } catch (e) {
      console.error("[Stripe Webhook] DB update failed:", e)
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session
    const mongoId = session.metadata?.mongoId
    if (mongoId) {
      try {
        await connectDB()
        await Order.findByIdAndUpdate(mongoId, { paymentStatus: "failed", status: "cancelled" })
      } catch { /* ignore */ }
    }
  }

  return NextResponse.json({ received: true })
}
