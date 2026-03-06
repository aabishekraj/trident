import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

export async function GET() {
  try {
    await connectDB();

    // Run all aggregations in parallel
    const [summary, byStatus, revenueByDay, revenueByMonth, topProducts] =
      await Promise.all([
        // ── 1. Overall summary ──────────────────────────────────────────────
        Order.aggregate([
          {
            $group: {
              _id: null,
              totalRevenue: {
                $sum: { $cond: [{ $ne: ["$status", "cancelled"] }, "$totalAmount", 0] },
              },
              totalOrders: { $sum: 1 },
              pendingOrders: {
                $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
              },
            },
          },
        ]),

        // ── 2. Orders by status ─────────────────────────────────────────────
        Order.aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } },
          { $project: { _id: 0, status: "$_id", count: 1 } },
        ]),

        // ── 3. Revenue last 7 days ──────────────────────────────────────────
        Order.aggregate([
          {
            $match: {
              createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
              status: { $ne: "cancelled" },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              value: { $sum: "$totalAmount" },
            },
          },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, label: "$_id", value: 1 } },
        ]),

        // ── 4. Monthly revenue (last 6 months) ──────────────────────────────
        Order.aggregate([
          {
            $match: {
              createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
              status: { $ne: "cancelled" },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
              value: { $sum: "$totalAmount" },
            },
          },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, label: "$_id", value: 1 } },
        ]),

        // ── 5. Top 6 products by units sold ─────────────────────────────────
        Order.aggregate([
          { $match: { status: { $ne: "cancelled" } } },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.name",
              units: { $sum: "$items.qty" },
            },
          },
          { $sort: { units: -1 } },
          { $limit: 6 },
          { $project: { _id: 0, name: "$_id", units: 1 } },
        ]),
      ]);

    const s = summary[0] ?? { totalRevenue: 0, totalOrders: 0, pendingOrders: 0 };

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue: s.totalRevenue,
        totalOrders: s.totalOrders,
        avgOrderValue:
          s.totalOrders > 0 ? parseFloat((s.totalRevenue / s.totalOrders).toFixed(2)) : 0,
        pendingOrders: s.pendingOrders,
        revenueByDay,
        revenueByMonth,
        ordersByStatus: byStatus,
        topProducts,
      },
    });
  } catch (error) {
    console.error("[GET /api/analytics]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
