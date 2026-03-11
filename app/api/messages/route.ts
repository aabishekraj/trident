import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Message from "@/models/Message"
import { getAdminSession } from "@/lib/adminAuth"
import { sendTicketRaised } from "@/lib/email"

// POST — customer submits a support request (public)
export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const { type, subject, message, customerName, customerEmail, orderId } = body

    if (!type || !subject || !message || !customerName || !customerEmail) {
      return NextResponse.json({ success: false, error: "type, subject, message, customerName and customerEmail are required" }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(customerEmail))) {
      return NextResponse.json({ success: false, error: "Invalid email format" }, { status: 400 })
    }
    if (String(message).length > 5000) {
      return NextResponse.json({ success: false, error: "Message exceeds 5000 characters" }, { status: 400 })
    }

    const safeMessage     = String(message).slice(0, 5000)
    const safeCustomerName = String(customerName).slice(0, 100)

    const msg = await Message.create({
      type:          String(type).slice(0, 50),
      subject:       String(subject).slice(0, 200),
      message:       safeMessage,
      customerName:  safeCustomerName,
      customerEmail: String(customerEmail).toLowerCase().slice(0, 100),
      orderId:       orderId ? String(orderId).slice(0, 50) : "",
      comments: [{ from: "customer", authorName: safeCustomerName, text: safeMessage }],
    })

    // Notify customer by email (fire-and-forget)
    sendTicketRaised({
      ticketId:      msg.ticketId,
      customerName,
      customerEmail: customerEmail.toLowerCase(),
      subject,
      message,
      type,
      orderId,
    }).catch(() => {})

    return NextResponse.json({ success: true, data: { ticketId: msg.ticketId } }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// GET — admin lists all messages, OR customer looks up their own by email
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const session   = getAdminSession(req)
  const custEmail = req.headers.get("x-customer-email")?.toLowerCase().trim()

  // Customer: fetch their own tickets
  if (!session && custEmail) {
    if (!EMAIL_RE.test(custEmail)) {
      return NextResponse.json({ success: false, error: "Invalid email" }, { status: 400 })
    }
    try {
      await connectDB()
      const msgs = await Message.find({ customerEmail: custEmail }).sort({ createdAt: -1 }).limit(50).lean()
      return NextResponse.json({ success: true, data: msgs })
    } catch {
      return NextResponse.json({ success: false, error: "Failed to fetch tickets" }, { status: 500 })
    }
  }

  // Admin only beyond this point
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    await connectDB()
    const status = searchParams.get("status") || ""
    const type   = searchParams.get("type")   || ""
    const email  = searchParams.get("email")  || ""
    const page   = parseInt(searchParams.get("page")  || "1")
    const limit  = parseInt(searchParams.get("limit") || "50")

    const filter: Record<string, unknown> = {}
    if (status) filter.status = status
    if (type)   filter.type   = type
    if (email)  filter.customerEmail = email.toLowerCase()

    const [messages, total] = await Promise.all([
      Message.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Message.countDocuments(filter),
    ])
    return NextResponse.json({ success: true, data: messages, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
