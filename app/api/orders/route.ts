import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import { sendOrderConfirmation } from "@/lib/email";
import { getAdminSession } from "@/lib/adminAuth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ESC = (s: string) => s.replace(/[$()*+?.\\^{}|[\]]/g, "\\$&")

// ─── GET /api/orders ──────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session    = getAdminSession(req);
  const custHeader = req.headers.get("x-customer-email")?.toLowerCase().trim();

  if (!session && !custHeader) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!session && custHeader && !EMAIL_RE.test(custHeader)) {
    return NextResponse.json({ success: false, error: "Invalid email" }, { status: 400 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status") || "";
    const search      = (searchParams.get("search") || "").trim().slice(0, 100);
    const page        = Math.max(1, parseInt(searchParams.get("page")  || "1"));
    const limit       = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));

    const VALID_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
    const filter: Record<string, unknown> = {};

    if (session) {
      const emailParam = (searchParams.get("email") || "").toLowerCase().trim();
      if (emailParam && EMAIL_RE.test(emailParam)) {
        filter["customer.email"] = emailParam;
      }
      if (statusParam && VALID_STATUSES.includes(statusParam)) {
        filter.status = statusParam;
      }
      if (search) {
        const safe = ESC(search);
        filter.$or = [
          { orderId:          { $regex: safe, $options: "i" } },
          { "customer.name":  { $regex: safe, $options: "i" } },
          { "customer.email": { $regex: safe, $options: "i" } },
        ];
      }
    } else {
      filter["customer.email"] = custHeader;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch orders" }, { status: 500 });
  }
}

// ─── POST /api/orders ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    // Validate required fields
    if (!body.customer?.name || !body.customer?.email || !body.items?.length) {
      return NextResponse.json(
        { success: false, error: "customer.name, customer.email and items are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const email = String(body.customer.email).toLowerCase().trim();
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ success: false, error: "Invalid customer email" }, { status: 400 });
    }

    // Allowlist payment method
    const VALID_METHODS = ["card", "upi", "cod"];
    const paymentMethod = VALID_METHODS.includes(body.paymentMethod) ? body.paymentMethod : "card";

    // Allowlist payment status
    const VALID_PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];
    const paymentStatus = VALID_PAYMENT_STATUSES.includes(body.paymentStatus) ? body.paymentStatus : "pending";

    // Allowlist order status
    const VALID_ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
    const status = VALID_ORDER_STATUSES.includes(body.status) ? body.status : "pending";

    // Sanitize items — only allow known fields, reject injected fields
    const items = (Array.isArray(body.items) ? body.items as Record<string, unknown>[] : [])
      .slice(0, 100)
      .map(item => ({
        productId: typeof item.productId === "string" ? item.productId.slice(0, 100) : "",
        name:      typeof item.name === "string"      ? item.name.trim().slice(0, 200) : "",
        price:     typeof item.price === "number"     ? Math.max(0, item.price) : 0,
        qty:       typeof item.qty === "number"       ? Math.max(1, Math.floor(item.qty)) : 1,
        size:      typeof item.size === "string"      ? item.size.trim().slice(0, 20) : "",
      }))
      .filter(i => i.name && i.price > 0);

    if (!items.length) {
      return NextResponse.json({ success: false, error: "No valid items in order" }, { status: 400 });
    }

    // Accept client total (includes shipping+tax) but round it
    const totalAmount = typeof body.totalAmount === "number" && body.totalAmount > 0
      ? Math.round(body.totalAmount * 100) / 100
      : Math.round(items.reduce((s, i) => s + i.price * i.qty, 0) * 100) / 100;

    const order = await Order.create({
      customer: {
        name:    String(body.customer.name).trim().slice(0, 100),
        email,
        phone:   typeof body.customer.phone === "string"   ? body.customer.phone.trim().slice(0, 20) : "",
        address: typeof body.customer.address === "string" ? body.customer.address.trim().slice(0, 500) : "",
      },
      items,
      totalAmount,
      currency:    typeof body.currency === "string" && ["USD","INR","EUR"].includes(body.currency)
                     ? body.currency : "USD",
      paymentMethod,
      paymentStatus,
      status,
      notes: typeof body.notes === "string" ? body.notes.trim().slice(0, 1000) : undefined,
    });

    // Send confirmation email (non-blocking)
    sendOrderConfirmation({
      orderId:         order.orderId,
      customerName:    order.customer.name,
      customerEmail:   order.customer.email,
      items:           order.items,
      totalAmount:     order.totalAmount,
      shippingAddress: order.customer.address || "",
    }).catch(e => console.error("[EMAIL confirm]", e));

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error: unknown) {
    console.error("[POST /api/orders]", error);
    const msg = error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
