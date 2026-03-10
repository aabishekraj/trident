import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Message from "@/models/Message"
import { getAdminSession } from "@/lib/adminAuth"

type P = { params: Promise<{ id: string }> }

function adminOnly(req: NextRequest) {
  const s = getAdminSession(req)
  return s ? null : { error: "Unauthorized", status: 401 }
}

export async function GET(req: NextRequest, { params }: P) {
  const denied = adminOnly(req)
  if (denied) return NextResponse.json({ success: false, error: denied.error }, { status: denied.status })
  try {
    await connectDB()
    const { id } = await params
    const msg = await Message.findById(id).lean()
    if (!msg) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
    return NextResponse.json({ success: true, data: msg })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: P) {
  const denied = adminOnly(req)
  if (denied) return NextResponse.json({ success: false, error: denied.error }, { status: denied.status })
  try {
    await connectDB()
    const { id } = await params
    const body = await req.json()
    const update: Record<string, unknown> = {}
    if (body.status)     update.status     = body.status
    if (body.adminReply) { update.adminReply = body.adminReply; update.repliedAt = new Date(); update.status = body.status || "in_progress" }
    const msg = await Message.findByIdAndUpdate(id, { $set: update }, { new: true }).lean()
    if (!msg) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
    return NextResponse.json({ success: true, data: msg })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: P) {
  const denied = adminOnly(req)
  if (denied) return NextResponse.json({ success: false, error: denied.error }, { status: denied.status })
  try {
    await connectDB()
    const { id } = await params
    await Message.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
