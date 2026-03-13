import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import CustomerAddress from "@/models/CustomerAddress"

type P = { params: Promise<{ id: string }> }

function getEmail(req: NextRequest): string | null {
  const h = req.headers.get("x-customer-email")
  return h && h.includes("@") ? h.toLowerCase().trim() : null
}

const ADDRESS_ALLOWED_FIELDS = ["name", "address", "city", "state", "zip", "country", "phone", "isDefault"] as const

export async function PUT(req: NextRequest, { params }: P) {
  const email = getEmail(req)
  if (!email) return NextResponse.json({ success: false, error: "Auth required" }, { status: 401 })
  try {
    await connectDB()
    const { id } = await params
    const body = await req.json()

    // Only allow whitelisted fields — prevents mass assignment
    const update: Record<string, unknown> = {}
    for (const field of ADDRESS_ALLOWED_FIELDS) {
      if (field in body) update[field] = body[field]
    }

    if (update.isDefault) await CustomerAddress.updateMany({ customerEmail: email }, { isDefault: false })
    const addr = await CustomerAddress.findOneAndUpdate({ _id: id, customerEmail: email }, update, { returnDocument: "after" }).lean()
    if (!addr) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
    return NextResponse.json({ success: true, data: addr })
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to update address" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: P) {
  const email = getEmail(req)
  if (!email) return NextResponse.json({ success: false, error: "Auth required" }, { status: 401 })
  try {
    await connectDB()
    const { id } = await params
    await CustomerAddress.findOneAndDelete({ _id: id, customerEmail: email })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
