import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Order from "@/models/Order"

// GET /api/track?orderId=TRD-20260306-A7K2X9
// GET /api/track?orderId=TRD-20260306-A7K2X9&email=customer@example.com
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get("orderId")?.trim().toUpperCase()
    const email   = searchParams.get("email")?.trim().toLowerCase()

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 })
    }

    await connectDB()

    const order = await Order.findOne({ orderId }).lean()

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found. Check the order ID and try again." }, { status: 404 })
    }

    // If an email was provided, it must match (security check for guest users)
    if (email) {
      const orderEmail = (order as { customer?: { email?: string } }).customer?.email?.toLowerCase() ?? ""
      if (orderEmail !== email) {
        return NextResponse.json({ success: false, error: "Order not found. Check the order ID and try again." }, { status: 404 })
      }
    }

    // Return only the fields needed for tracking (never expose raw DB data)
    const o = order as {
      orderId: string
      status: string
      paymentStatus?: string
      paymentMethod?: string
      totalAmount: number
      createdAt: Date | string
      updatedAt?: Date | string
      trackingNumber?: string
      customer?: { name?: string; email?: string; address?: string }
      items?: Array<{ name: string; qty: number; price: number; size?: string }>
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId:       o.orderId,
        status:        o.status,
        paymentStatus: o.paymentStatus ?? "paid",
        paymentMethod: o.paymentMethod ?? "card",
        totalAmount:   o.totalAmount,
        trackingNumber: o.trackingNumber ?? null,
        createdAt:     o.createdAt,
        updatedAt:     o.updatedAt ?? o.createdAt,
        customer: {
          name:    o.customer?.name ?? "Customer",
          // Mask email for privacy: j***@gmail.com
          email:   maskEmail(o.customer?.email ?? ""),
          address: o.customer?.address ?? "",
        },
        items: (o.items ?? []).map(i => ({
          name:  i.name,
          qty:   i.qty,
          price: i.price,
          size:  i.size ?? "",
        })),
      },
    })
  } catch (e) {
    console.error("[GET /api/track]", e)
    return NextResponse.json({ success: false, error: "Failed to fetch order" }, { status: 500 })
  }
}

function maskEmail(email: string): string {
  if (!email.includes("@")) return email
  const [local, domain] = email.split("@")
  if (local.length <= 2) return `${local[0]}***@${domain}`
  return `${local[0]}${local[1]}***@${domain}`
}
