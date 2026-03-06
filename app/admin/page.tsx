"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IAnalyticsSummary, IOrder } from "@/types";

const S: React.CSSProperties = {
  fontFamily: "'Barlow', sans-serif",
};

function StatCard({
  label,
  value,
  change,
  up,
}: {
  label: string;
  value: string;
  change: string;
  up: boolean;
}) {
  return (
    <div
      style={{
        background: "#0d0d0d",
        border: "1px solid #222",
        padding: "1.5rem",
        flex: "1 1 180px",
      }}
    >
      <div
        style={{
          fontSize: ".72rem",
          fontWeight: 700,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: "#888",
          marginBottom: ".5rem",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "2.4rem",
          letterSpacing: 1,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{ fontSize: ".75rem", marginTop: ".4rem", color: up ? "#22c55e" : "#e5202e" }}
      >
        {change}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<IAnalyticsSummary | null>(null);
  const [recent, setRecent] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/analytics").then((r) => r.json()),
      fetch("/api/orders?limit=5").then((r) => r.json()),
    ]).then(([aRes, oRes]) => {
      if (aRes.success) setAnalytics(aRes.data);
      if (oRes.success) setRecent(oRes.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={{ ...S, color: "#888", paddingTop: "4rem", textAlign: "center" }}>
        Loading dashboard…
      </div>
    );
  }

  // Safe fallback if MongoDB isn't connected yet
  const a = analytics ?? {
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    pendingOrders: 0,
  };

  return (
    <div style={S}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "2rem",
        }}
      >
        <h1
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "2rem",
            letterSpacing: 2,
          }}
        >
          DASH<span style={{ color: "#e5202e" }}>BOARD</span>
        </h1>
        <span style={{ fontSize: ".78rem", color: "#888" }}>
          Last updated: {new Date().toLocaleTimeString()}
        </span>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: "1px", background: "#222", marginBottom: "2rem", flexWrap: "wrap" }}>
        <StatCard
          label="Total Revenue"
          value={`$${a.totalRevenue.toLocaleString()}`}
          change="↑ 12.4% vs last month"
          up
        />
        <StatCard
          label="Total Orders"
          value={String(a.totalOrders)}
          change="↑ 8.2% vs last month"
          up
        />
        <StatCard
          label="Avg Order Value"
          value={`$${a.avgOrderValue}`}
          change="↑ 5.1% vs last month"
          up
        />
        <StatCard
          label="Pending Orders"
          value={String(a.pendingOrders)}
          change={a.pendingOrders > 5 ? "↑ needs attention" : "↓ looking good"}
          up={a.pendingOrders <= 5}
        />
      </div>

      {/* Recent orders */}
      <div style={{ border: "1px solid #222" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.2rem 1.5rem",
            borderBottom: "1px solid #222",
          }}
        >
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Recent Orders
          </span>
          <Link
            href="/admin/orders"
            style={{
              fontSize: ".78rem",
              color: "#888",
              textDecoration: "none",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            View All →
          </Link>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Order ID", "Customer", "Amount", "Status", "Date"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: ".8rem 1.2rem",
                    textAlign: "left",
                    fontSize: ".72rem",
                    fontWeight: 700,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: "#888",
                    borderBottom: "1px solid #222",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.map((o) => (
              <tr
                key={o._id}
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                <td
                  style={{
                    padding: ".9rem 1.2rem",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    color: "#888",
                    fontSize: ".85rem",
                  }}
                >
                  {o.orderId}
                </td>
                <td style={{ padding: ".9rem 1.2rem", fontSize: ".85rem", fontWeight: 600 }}>
                  {o.customer.name}
                </td>
                <td style={{ padding: ".9rem 1.2rem", fontSize: ".85rem", fontWeight: 700 }}>
                  ${o.totalAmount}
                </td>
                <td style={{ padding: ".9rem 1.2rem" }}>
                  <StatusBadge status={o.status!} />
                </td>
                <td style={{ padding: ".9rem 1.2rem", fontSize: ".82rem", color: "#888" }}>
                  {new Date(o.createdAt as string).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    pending:    { bg: "rgba(234,179,8,.15)",   color: "#eab308" },
    processing: { bg: "rgba(59,130,246,.15)",  color: "#3b82f6" },
    shipped:    { bg: "rgba(168,85,247,.15)",  color: "#a855f7" },
    delivered:  { bg: "rgba(34,197,94,.15)",   color: "#22c55e" },
    cancelled:  { bg: "rgba(229,32,46,.15)",   color: "#e5202e" },
  };
  const c = colors[status] ?? { bg: "#333", color: "#888" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: ".25rem .75rem",
        fontSize: ".68rem",
        fontWeight: 700,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        background: c.bg,
        color: c.color,
      }}
    >
      {status}
    </span>
  );
}
