import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import CartSession from "@/models/CartSession"

function getEmail(req: NextRequest): string | null {
  const h = req.headers.get("x-customer-email")
  return h && h.includes("@") ? h.toLowerCase().trim() : null
}

// POST /api/cart-session — save/update cart
export async function POST(req: NextRequest) {
  const email = getEmail(req)
  if (!email) return NextResponse.json({ success: true }) // silent for guests
  try {
    await connectDB()
    const { items, total, customerName } = await req.json()
    await CartSession.findOneAndUpdate(
      { customerEmail: email },
      { customerEmail: email, customerName: customerName || "", items: items || [], total: total || 0, reminderSent: false, checkedOutAt: undefined },
      { upsert: true, returnDocument: "after" }
    )
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true }) // non-critical
  }
}

// DELETE /api/cart-session — mark as checked out
export async function DELETE(req: NextRequest) {
  const email = getEmail(req)
  if (!email) return NextResponse.json({ success: true })
  try {
    await connectDB()
    await CartSession.findOneAndUpdate({ customerEmail: email }, { checkedOutAt: new Date() })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}
