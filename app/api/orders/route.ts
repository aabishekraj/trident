import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import { sendOrderConfirmation } from "@/lib/email";

// ─── GET /api/orders ──────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status  = searchParams.get("status")  || "";
    const search  = searchParams.get("search")  || "";
    const email   = searchParams.get("email")   || "";
    const page    = parseInt(searchParams.get("page")  || "1");
    const limit   = parseInt(searchParams.get("limit") || "20");

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (email)  filter["customer.email"] = email.toLowerCase();
    if (search) {
      filter.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { "customer.name":  { $regex: search, $options: "i" } },
        { "customer.email": { $regex: search, $options: "i" } },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/orders]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch orders" }, { status: 500 });
  }
}

// ─── POST /api/orders ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    // Basic validation
    if (!body.customer?.name || !body.customer?.email || !body.items?.length) {
      return NextResponse.json(
        { success: false, error: "customer.name, customer.email and items are required" },
        { status: 400 }
      );
    }

    // Auto-calculate total if not provided
    if (!body.totalAmount) {
      body.totalAmount = body.items.reduce(
        (sum: number, item: { price: number; qty: number }) => sum + item.price * item.qty,
        0
      );
    }

    const order = await Order.create(body);

    // Send confirmation email (non-blocking)
    sendOrderConfirmation({
      orderId: order.orderId,
      customerName: order.customer.name,
      customerEmail: order.customer.email,
      items: order.items,
      totalAmount: order.totalAmount,
      shippingAddress: order.customer.address || "",
    }).catch(e => console.error("[EMAIL confirm]", e));

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error: unknown) {
    console.error("[POST /api/orders]", error);
    const msg = error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
