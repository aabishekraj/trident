import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import { sendStatusUpdate } from "@/lib/email";
import { getAdminSession } from "@/lib/adminAuth";

type Params = { params: Promise<{ id: string }> };

function getCustomerEmail(req: NextRequest): string | null {
  const h = req.headers.get("x-customer-email")
  return h && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(h) ? h.toLowerCase().trim() : null
}

// ─── GET /api/orders/[id] ─────────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: Params) {
  const adminSession = getAdminSession(req)
  const customerEmail = getCustomerEmail(req)

  // Must be either an admin or a signed-in customer
  if (!adminSession && !customerEmail) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const order = await Order.findById(id).lean();
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }
    // Customers can only see their own orders
    if (!adminSession) {
      const o = order as { customer?: { email?: string } }
      if (o.customer?.email?.toLowerCase() !== customerEmail) {
        return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
      }
    }
    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("[GET /api/orders/:id]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch order" }, { status: 500 });
  }
}

// ─── PUT /api/orders/[id] ─────────────────────────────────────────────────────
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    // Recalculate total if items changed
    if (body.items?.length) {
      body.totalAmount = body.items.reduce(
        (sum: number, item: { price: number; qty: number }) => sum + item.price * item.qty,
        0
      );
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    ).lean();

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // Send status update email when status changes
    if (body.status && body.status !== "pending") {
      const o = order as unknown as { orderId: string; customer: { name: string; email: string; address: string }; items: { name: string; qty: number; price: number; size?: string }[]; totalAmount: number; trackingNumber?: string }
      sendStatusUpdate({
        orderId: o.orderId,
        customerName: o.customer.name,
        customerEmail: o.customer.email,
        items: o.items,
        totalAmount: o.totalAmount,
        shippingAddress: o.customer.address || "",
        status: body.status,
        trackingNumber: body.trackingNumber || o.trackingNumber,
      }).catch(e => console.error("[EMAIL status]", e));
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error: unknown) {
    console.error("[PUT /api/orders/:id]", error);
    const msg = error instanceof Error ? error.message : "Failed to update order";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// ─── DELETE /api/orders/[id] ──────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const order = await Order.findByIdAndDelete(id).lean();
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { deleted: id } });
  } catch (error) {
    console.error("[DELETE /api/orders/:id]", error);
    return NextResponse.json({ success: false, error: "Failed to delete order" }, { status: 500 });
  }
}
