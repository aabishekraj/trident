import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Message from "@/models/Message"
import { getAdminSession } from "@/lib/adminAuth"
import { sendAdminReply } from "@/lib/email"

type P = { params: Promise<{ id: string }> }

// GET /api/messages/[id] — admin OR the ticket owner (by ticketId)
export async function GET(req: NextRequest, { params }: P) {
  try {
    await connectDB()
    const { id } = await params
    const session   = getAdminSession(req)
    const custEmail = req.headers.get("x-customer-email")?.toLowerCase().trim()

    // Try find by MongoDB _id (admin) or ticketId (customer)
    const msg = await Message.findById(id).lean().catch(() => null)
           ?? await Message.findOne({ ticketId: id }).lean()

    if (!msg) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })

    // Customers can only view their own ticket
    if (!session) {
      if (!custEmail || msg.customerEmail !== custEmail) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
      }
    }
    return NextResponse.json({ success: true, data: msg })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

// PUT /api/messages/[id] — admin updates status/reply, or customer adds a follow-up comment
export async function PUT(req: NextRequest, { params }: P) {
  try {
    await connectDB()
    const { id } = await params
    const session   = getAdminSession(req)
    const custEmail = req.headers.get("x-customer-email")?.toLowerCase().trim()
    const body      = await req.json()

    const msg = await Message.findById(id) ?? await Message.findOne({ ticketId: id })
    if (!msg) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })

    // ── Admin path ────────────────────────────────────────────────────────────
    if (session) {
      const adminName = (session as { username?: string }).username || "Support Team"
      if (body.status) msg.status = body.status

      if (body.adminReply || body.comment) {
        const replyText = body.adminReply || body.comment
        msg.adminReply = replyText
        msg.repliedAt  = new Date()
        if (!msg.status || msg.status === "new") msg.status = "in_progress"
        // Append to thread
        msg.comments.push({ from: "admin", authorName: adminName, text: replyText, createdAt: new Date() })
        // Email the customer
        sendAdminReply({
          ticketId:      msg.ticketId,
          customerName:  msg.customerName,
          customerEmail: msg.customerEmail,
          subject:       msg.subject,
          adminMessage:  replyText,
          status:        msg.status,
        }).catch(() => {})
      }

      await msg.save()
      return NextResponse.json({ success: true, data: msg.toObject() })
    }

    // ── Customer path: add follow-up comment ──────────────────────────────────
    if (custEmail && msg.customerEmail === custEmail) {
      const text = (body.comment || "").trim()
      if (!text) return NextResponse.json({ success: false, error: "comment required" }, { status: 400 })

      // Re-open if it was closed/resolved
      if (msg.status === "closed" || msg.status === "resolved") msg.status = "in_progress"
      msg.comments.push({ from: "customer", authorName: msg.customerName, text, createdAt: new Date() })
      await msg.save()
      return NextResponse.json({ success: true, data: msg.toObject() })
    }

    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

// DELETE /api/messages/[id] — admin only
export async function DELETE(req: NextRequest, { params }: P) {
  if (!getAdminSession(req)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  try {
    await connectDB()
    const { id } = await params
    await Message.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
