"use client"

import { useEffect, useState } from "react"
import { IAnalyticsSummary } from "@/types"

// ── Mini bar chart ────────────────────────────────────────────────────────────
function BarChart({ data, color = "#e5202e" }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: 80 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ width: "100%", background: color, opacity: .8, height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 3 : 0, transition: "height .5s ease" }} title={`${d.label}: $${d.value}`} />
          <span style={{ fontSize: ".55rem", color: "#444", transform: "rotate(-35deg)", transformOrigin: "top left", whiteSpace: "nowrap", marginTop: 6 }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Stat tile ─────────────────────────────────────────────────────────────────
function Tile({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: "#0d0d0d", padding: "1.5rem" }}>
      <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: "#555", marginBottom: ".5rem" }}>{label}</div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.2rem", color: color ?? "#f5f5f5", lineHeight: 1 }}>{value}</div>
    </div>
  )
}

// ── Analytics Page ────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [data,    setData]    = useState<IAnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState("")

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const r = await fetch("/api/analytics")
      const j = await r.json()
      if (j.success) setData(j.data)
      else setError(j.error ?? "Failed to load analytics.")
    } catch {
      setError("Could not connect to analytics API.")
    }
    setLoading(false)
  }

  if (loading) return <div style={{ padding: "4rem", textAlign: "center", color: "#555", fontFamily: "'Barlow', sans-serif" }}>Loading analytics…</div>
  if (error)   return <div style={{ padding: "4rem", textAlign: "center", color: "#e5202e", fontFamily: "'Barlow', sans-serif" }}>{error}</div>

  const d = data!

  const statusColors: Record<string, string> = {
    pending:    "#eab308",
    processing: "#3b82f6",
    shipped:    "#a855f7",
    delivered:  "#22c55e",
    cancelled:  "#e5202e",
  }

  const totalStatusCount = d.ordersByStatus.reduce((s, x) => s + x.count, 0) || 1

  return (
    <div style={{ fontFamily: "'Barlow', sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", letterSpacing: 2 }}>
          ANA<span style={{ color: "#e5202e" }}>LYTICS</span>
        </h1>
        <p style={{ color: "#555", fontSize: ".82rem", marginTop: ".3rem" }}>Sales performance & store insights</p>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "1px", background: "#1e1e1e", marginBottom: "2.5rem" }}>
        <Tile label="Total Revenue"    value={`$${d.totalRevenue.toLocaleString()}`}           color="#22c55e" />
        <Tile label="Total Orders"     value={String(d.totalOrders)}                            color="#3b82f6" />
        <Tile label="Avg Order Value"  value={`$${Number(d.avgOrderValue).toFixed(2)}`}         color="#a855f7" />
        <Tile label="Pending Orders"   value={String(d.pendingOrders)}                          color="#eab308" />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2.5rem" }}>

        {/* Revenue by day */}
        <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", padding: "1.5rem" }}>
          <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: "1.2rem" }}>Revenue — Last 7 Days</div>
          {d.revenueByDay?.length > 0 ? (
            <BarChart data={d.revenueByDay.slice(-7)} color="#e5202e" />
          ) : (
            <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: "#333", fontSize: ".82rem" }}>No data yet</div>
          )}
        </div>

        {/* Revenue by month */}
        <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", padding: "1.5rem" }}>
          <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: "1.2rem" }}>Revenue — By Month</div>
          {d.revenueByMonth?.length > 0 ? (
            <BarChart data={d.revenueByMonth} color="#3b82f6" />
          ) : (
            <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: "#333", fontSize: ".82rem" }}>No data yet</div>
          )}
        </div>
      </div>

      {/* Orders by status + Top products */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>

        {/* Order status breakdown */}
        <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", padding: "1.5rem" }}>
          <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: "1.2rem" }}>Orders by Status</div>
          {d.ordersByStatus.length === 0 ? (
            <div style={{ color: "#333", fontSize: ".82rem", padding: "1rem 0" }}>No orders yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
              {d.ordersByStatus.map(({ status, count }) => {
                const pct = Math.round((count / totalStatusCount) * 100)
                const col = statusColors[status] ?? "#888"
                return (
                  <div key={status}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".3rem" }}>
                      <span style={{ fontSize: ".75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: col }}>{status}</span>
                      <span style={{ fontSize: ".75rem", fontWeight: 700, color: "#888" }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ height: 4, background: "#1e1e1e" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: col, transition: "width .7s ease" }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top products */}
        <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", padding: "1.5rem" }}>
          <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: "1.2rem" }}>Top Products by Units Sold</div>
          {!d.topProducts?.length ? (
            <div style={{ color: "#333", fontSize: ".82rem", padding: "1rem 0" }}>No sales data yet</div>
          ) : (
            <div>
              {d.topProducts.slice(0, 8).map(({ name, units }, i) => {
                const maxUnits = d.topProducts[0].units || 1
                return (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: ".55rem 0", borderBottom: i < Math.min(d.topProducts.length, 8) - 1 ? "1px solid #0f0f0f" : "none" }}>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem", color: "#333", width: 20, textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: ".8rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
                      <div style={{ height: 3, background: "#1e1e1e", marginTop: ".3rem" }}>
                        <div style={{ height: "100%", width: `${(units / maxUnits) * 100}%`, background: "#e5202e", transition: "width .6s ease" }} />
                      </div>
                    </div>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem", color: "#e5202e", flexShrink: 0 }}>{units}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
