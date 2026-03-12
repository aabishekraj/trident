"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { IAnalyticsSummary, IOrder } from "@/types"
import { useCurrency } from "@/context/CurrencyContext"

// ── Shared StatusBadge (used here + orders page) ──────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const MAP: Record<string, { bg: string; color: string }> = {
    pending:    { bg: "rgba(234,179,8,.15)",  color: "#eab308" },
    processing: { bg: "rgba(59,130,246,.15)", color: "#3b82f6" },
    shipped:    { bg: "rgba(168,85,247,.15)", color: "#a855f7" },
    delivered:  { bg: "rgba(34,197,94,.15)",  color: "#22c55e" },
    cancelled:  { bg: "rgba(229,32,46,.15)",  color: "#e5202e" },
  }
  const c = MAP[status] ?? { bg: "#1e1e1e", color: "#888" }
  return (
    <span style={{
      display: "inline-block", padding: ".25rem .75rem",
      fontSize: ".65rem", fontWeight: 700, letterSpacing: 1.5,
      textTransform: "uppercase", background: c.bg, color: c.color,
    }}>
      {status}
    </span>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon, loading }: {
  label: string; value: string; sub: string
  color: string; icon: string; loading: boolean
}) {
  return (
    <div style={{ background: "#0d0d0d", padding: "1.5rem", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "1rem", right: "1rem", fontSize: "1.6rem", opacity: .1, userSelect: "none" }}>{icon}</div>
      <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: "#555", marginBottom: ".55rem" }}>{label}</div>
      {loading
        ? <div style={{ height: 38, background: "#1a1a1a", width: "55%" }} />
        : <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.4rem", color, lineHeight: 1 }}>{value}</div>}
      <div style={{ color: "#444", fontSize: ".72rem", fontWeight: 600, marginTop: ".4rem" }}>{sub}</div>
    </div>
  )
}

// ── Quick Actions ─────────────────────────────────────────────────────────────
const QUICK = [
  { href: "/admin/products",  icon: "👟", label: "Products",  desc: "Add / edit listings"   },
  { href: "/admin/orders",    icon: "📦", label: "Orders",    desc: "Update order statuses" },
  { href: "/admin/coupons",   icon: "🏷️", label: "Coupons",   desc: "Create promotions"     },
  { href: "/admin/analytics", icon: "📈", label: "Analytics", desc: "Revenue & insights"    },
]

// ── Dashboard Page ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { fmt } = useCurrency()
  const [analytics, setAnalytics] = useState<IAnalyticsSummary | null>(null)
  const [recent,    setRecent]    = useState<IOrder[]>([])
  const [prodCount, setProdCount] = useState(0)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [aRes, oRes, pRes] = await Promise.allSettled([
        fetch("/api/analytics").then(r => r.json()),
        fetch("/api/orders?limit=6").then(r => r.json()),
        fetch("/api/products").then(r => r.json()),
      ])
      if (aRes.status === "fulfilled" && aRes.value.success) setAnalytics(aRes.value.data)
      if (oRes.status === "fulfilled" && oRes.value.success)  setRecent(oRes.value.data ?? [])
      if (pRes.status === "fulfilled") {
        const list = Array.isArray(pRes.value) ? pRes.value : (pRes.value.data ?? [])
        setProdCount(list.length)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  const a: IAnalyticsSummary & { deliveredOrders?: number; cancelledOrders?: number } = analytics ?? {
    totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, pendingOrders: 0,
    revenueByDay: [], revenueByMonth: [], ordersByStatus: [], topProducts: [],
  }

  const greet = () => {
    const h = new Date().getHours()
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"
  }

  return (
    <div style={{ fontFamily: "'Barlow', sans-serif" }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "2.5rem" }}>
        <p style={{ fontSize: ".72rem", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "#e5202e", marginBottom: ".3rem" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.5rem", letterSpacing: 2, lineHeight: 1 }}>
          {greet()}, <span style={{ color: "#e5202e" }}>Admin</span>
        </h1>
        <p style={{ color: "#555", fontSize: ".85rem", marginTop: ".3rem" }}>Here&apos;s your store snapshot.</p>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: "1px", background: "#1e1e1e", marginBottom: "2.5rem" }}>
        <StatCard label="Total Revenue"   value={fmt(a.totalRevenue)}                                  sub="All time"                     color="#22c55e" icon="💰" loading={loading} />
        <StatCard label="Total Orders"    value={String(a.totalOrders)}                               sub={`${a.pendingOrders} pending`} color="#3b82f6" icon="📦" loading={loading} />
        <StatCard label="Avg Order Value" value={fmt(Number(a.avgOrderValue))}                        sub="Per transaction"             color="#a855f7" icon="📊" loading={loading} />
        <StatCard label="Products"        value={String(prodCount)}                                   sub="Listed in store"             color="#e5202e" icon="👟" loading={loading} />
      </div>

      {/* ── Order Status Strip ──────────────────────────────────────────────── */}
      {!loading && a.totalOrders > 0 && (
        <div style={{ display: "flex", gap: "1px", background: "#1e1e1e", marginBottom: "2.5rem" }}>
          {[
            { label: "Pending",   value: a.pendingOrders,              color: "#eab308" },
            { label: "Delivered", value: a.deliveredOrders ?? 0,        color: "#22c55e" },
            { label: "Cancelled", value: a.cancelledOrders ?? 0,        color: "#e5202e" },
          ].map(s => {
            const pct = a.totalOrders ? Math.round((s.value / a.totalOrders) * 100) : 0
            return (
              <div key={s.label} style={{ flex: 1, background: "#0a0a0a", padding: "1.2rem 1.5rem" }}>
                <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: ".4rem" }}>{s.label}</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", color: s.color }}>{s.value}</div>
                <div style={{ height: 2, background: "#1e1e1e", marginTop: ".5rem" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: s.color, transition: "width .8s ease" }} />
                </div>
                <div style={{ color: "#444", fontSize: ".65rem", marginTop: ".25rem" }}>{pct}% of orders</div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Two-column layout ───────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "2rem", alignItems: "start" }}>

        {/* Recent orders */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.3rem", letterSpacing: 2 }}>RECENT ORDERS</h2>
            <Link href="/admin/orders" style={{ fontSize: ".72rem", fontWeight: 700, color: "#555", textDecoration: "none", letterSpacing: 1, textTransform: "uppercase", transition: "color .2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#f5f5f5")}
              onMouseLeave={e => (e.currentTarget.style.color = "#555")}
            >
              View All →
            </Link>
          </div>

          <div style={{ border: "1px solid #1e1e1e" }}>
            {loading ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "#555", fontSize: ".88rem" }}>Loading orders…</div>
            ) : recent.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "#555" }}>
                <div style={{ fontSize: "2rem", marginBottom: ".5rem" }}>📦</div>
                <div style={{ fontSize: ".85rem", fontWeight: 700 }}>No orders yet</div>
                <div style={{ fontSize: ".75rem", color: "#333", marginTop: ".3rem" }}>Orders appear here after customers purchase</div>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1e1e1e" }}>
                    {["Order", "Customer", "Amount", "Status", "Date"].map(h => (
                      <th key={h} style={{ padding: ".75rem 1rem", textAlign: "left", fontSize: ".62rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((o, i) => (
                    <tr key={o._id} style={{ borderBottom: i < recent.length - 1 ? "1px solid #0f0f0f" : "none" }}>
                      <td style={{ padding: ".8rem 1rem", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: ".9rem" }}>{o.orderId}</td>
                      <td style={{ padding: ".8rem 1rem" }}>
                        <div style={{ fontWeight: 700, fontSize: ".82rem" }}>{o.customer?.name}</div>
                        <div style={{ color: "#555", fontSize: ".72rem" }}>{o.customer?.email}</div>
                      </td>
                      <td style={{ padding: ".8rem 1rem", fontWeight: 800, fontSize: ".88rem" }}>{fmt(Number(o.totalAmount))}</td>
                      <td style={{ padding: ".8rem 1rem" }}><StatusBadge status={o.status ?? "pending"} /></td>
                      <td style={{ padding: ".8rem 1rem", color: "#555", fontSize: ".72rem" }}>
                        {o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right sidebar: Quick actions + store health */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          <div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.3rem", letterSpacing: 2, marginBottom: "1rem" }}>QUICK ACTIONS</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#1e1e1e" }}>
              {QUICK.map(q => (
                <Link key={q.href} href={q.href} style={{ display: "flex", alignItems: "center", gap: "1rem", background: "#0d0d0d", padding: ".9rem 1.1rem", textDecoration: "none", transition: "background .15s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#111")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#0d0d0d")}
                >
                  <span style={{ fontSize: "1.1rem", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a", border: "1px solid #1e1e1e", flexShrink: 0 }}>{q.icon}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: ".8rem", color: "#f5f5f5" }}>{q.label}</div>
                    <div style={{ color: "#555", fontSize: ".7rem", marginTop: ".15rem" }}>{q.desc}</div>
                  </div>
                  <span style={{ marginLeft: "auto", color: "#333" }}>→</span>
                </Link>
              ))}
            </div>
          </div>

          <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", padding: "1.2rem" }}>
            <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: "1rem" }}>Store Health</div>
            {[
              { label: "Products listed",  ok: prodCount > 0,          ok_v: `${prodCount} active`,    bad_v: "No products"         },
              { label: "Pending backlog",  ok: a.pendingOrders < 50,  ok_v: "Within range",           bad_v: `${a.pendingOrders} queued` },
              { label: "Revenue tracking", ok: a.totalRevenue >= 0,   ok_v: "Connected",              bad_v: "Check API"           },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: ".5rem 0", borderBottom: "1px solid #0f0f0f" }}>
                <span style={{ fontSize: ".75rem", color: "#666" }}>{row.label}</span>
                <span style={{ fontSize: ".7rem", fontWeight: 700, color: row.ok ? "#22c55e" : "#eab308" }}>
                  {row.ok ? `✓ ${row.ok_v}` : `⚠ ${row.bad_v}`}
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
