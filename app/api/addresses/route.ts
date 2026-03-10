import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import CustomerAddress from "@/models/CustomerAddress"

function getEmail(req: NextRequest): string | null {
  const h = req.headers.get("x-customer-email")
  return h && h.includes("@") ? h.toLowerCase().trim() : null
}

export async function GET(req: NextRequest) {
  const email = getEmail(req)
  if (!email) return NextResponse.json({ success: false, error: "Auth required" }, { status: 401 })
  try {
    await connectDB()
    const addrs = await CustomerAddress.find({ customerEmail: email }).sort({ isDefault: -1, createdAt: -1 }).lean()
    return NextResponse.json({ success: true, data: addrs })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const email = getEmail(req)
  if (!email) return NextResponse.json({ success: false, error: "Auth required" }, { status: 401 })
  try {
    await connectDB()
    const body = await req.json()
    if (!body.name || !body.address || !body.city || !body.state || !body.zip) {
      return NextResponse.json({ success: false, error: "name, address, city, state, zip required" }, { status: 400 })
    }
    const count = await CustomerAddress.countDocuments({ customerEmail: email })
    if (count >= 5) return NextResponse.json({ success: false, error: "Maximum 5 addresses allowed" }, { status: 400 })

    // If isDefault, unset others
    if (body.isDefault) await CustomerAddress.updateMany({ customerEmail: email }, { isDefault: false })

    const addr = await CustomerAddress.create({ ...body, customerEmail: email, isDefault: body.isDefault ?? (count === 0) })
    return NextResponse.json({ success: true, data: addr }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
