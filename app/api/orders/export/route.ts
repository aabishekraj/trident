import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Order from "@/models/Order"
import SiteSettings from "@/models/SiteSettings"
import { getAdminSession } from "@/lib/adminAuth"

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£", SGD: "S$", AED: "AED ",
}

function escape(val: unknown): string {
  const s = String(val ?? "").replace(/"/g, '""')
  return `"${s}"`
}

export async function GET(req: NextRequest) {
  if (!getAdminSession(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") || ""
    const filter: Record<string, unknown> = {}
    if (status) filter.status = status

    const [orders, rawSettings] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).limit(5000).lean(),
      SiteSettings.findOne().lean(),
    ])

    const settings = rawSettings as null | {
      currency?: string; shippingFreeThreshold?: number; shippingFlatRate?: number; taxRate?: number
    }
    const currency = settings?.currency || "INR"
    const sym = CURRENCY_SYMBOLS[currency] ?? currency + " "
    const freeThreshold = settings?.shippingFreeThreshold ?? 500
    const flatRate = settings?.shippingFlatRate ?? 49
    const taxRate = (settings?.taxRate ?? 18) / 100

    const header = ["Order ID","Date","Customer Name","Customer Email","Phone","Address","City","State","Zip","Country","Items","Subtotal","Shipping","Tax","Total","Currency","Payment Method","Payment Status","Status","Tracking"]
    const rows = orders.map(o => {
      const items = (o.items as Array<{ name: string; qty: number; price: number; size?: string }>)
        .map(i => `${i.name} x${i.qty}${i.size ? ` (${i.size})` : ""} @${sym}${i.price}`).join("; ")
      const sub = (o.items as Array<{ price: number; qty: number }>).reduce((s, i) => s + i.price * i.qty, 0)
      const ship = sub >= freeThreshold ? 0 : flatRate
      const tax = +(sub * taxRate).toFixed(2)
      return [
        o.orderId, new Date(o.createdAt as Date).toISOString().slice(0,10),
        o.customer?.name, o.customer?.email, o.customer?.phone,
        o.customer?.address, o.customer?.city, o.customer?.state, o.customer?.zip, o.customer?.country || "India",
        items, sub.toFixed(2), ship.toFixed(2), tax.toFixed(2), o.totalAmount?.toFixed(2),
        currency, o.paymentMethod, o.paymentStatus, o.status, o.trackingNumber || "",
      ].map(escape).join(",")
    })

    const csv = [header.map(escape).join(","), ...rows].join("\n")
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="trident-orders-${new Date().toISOString().slice(0,10)}.csv"`,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
