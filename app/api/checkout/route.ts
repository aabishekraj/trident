import Stripe from "stripe"
import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Order from "@/models/Order"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { cart, customer, shippingAddress } = body

    if (!cart?.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }
    if (!customer?.email || !customer?.name) {
      return NextResponse.json({ error: "Customer info required" }, { status: 400 })
    }

    await connectDB()

    const items = cart.map((item: { _id: string; name: string; price: number; qty: number; selectedSize?: string }) => ({
      productId: item._id,
      name:      item.name,
      price:     item.price,
      qty:       item.qty,
      size:      item.selectedSize || "",
    }))

    const subtotal = items.reduce((s: number, i: { price: number; qty: number }) => s + i.price * i.qty, 0)
    const shipping = subtotal > 500 ? 0 : 49
    const tax      = +(subtotal * 0.18).toFixed(2)
    const total    = +(subtotal + shipping + tax).toFixed(2)

    // Pre-create order with pending payment status
    const order = await Order.create({
      customer: {
        name:    customer.name,
        email:   customer.email.toLowerCase(),
        phone:   customer.phone || "",
        address: shippingAddress || "",
      },
      items,
      totalAmount:   total,
      paymentMethod: "card",
      paymentStatus: "pending",
      status:        "pending",
    })

    // Build Stripe line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = cart.map((item: { name: string; price: number; qty: number; selectedSize?: string }) => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.name + (item.selectedSize ? ` (${item.selectedSize})` : "") },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.qty,
    }))

    if (shipping > 0) {
      lineItems.push({ price_data: { currency: "usd", product_data: { name: "Shipping" }, unit_amount: Math.round(shipping * 100) }, quantity: 1 })
    }
    lineItems.push({ price_data: { currency: "usd", product_data: { name: "Tax (18%)" }, unit_amount: Math.round(tax * 100) }, quantity: 1 })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      customer_email: customer.email,
      metadata: {
        orderId: order.orderId,
        mongoId: order._id.toString(),
      },
      success_url: `${SITE}/success?orderId=${order.orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${SITE}/checkout`,
    })

    await Order.findByIdAndUpdate(order._id, { stripeSessionId: session.id })

    return NextResponse.json({ url: session.url, orderId: order.orderId })
  } catch (e) {
    console.error("[POST /api/checkout]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
