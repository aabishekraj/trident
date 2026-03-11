"use client"

import { useEffect, useState, useCallback } from "react"
import { IOrder, OrderStatus } from "@/types"
import { useCurrency } from "@/context/CurrencyContext"

// ── Types ─────────────────────────────────────────────────────────────────────
type Pagination = { page: number; pages: number; total: number; limit: number }

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUSES: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled"]

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:    { bg: "rgba(234,179,8,.15)",  color: "#eab308" },
  processing: { bg: "rgba(59,130,246,.15)", color: "#3b82f6" },
  shipped:    { bg: "rgba(168,85,247,.15)", color: "#a855f7" },
  delivered:  { bg: "rgba(34,197,94,.15)",  color: "#22c55e" },
  cancelled:  { bg: "rgba(229,32,46,.15)",  color: "#e5202e" },
}

const INP: React.CSSProperties = {
  background: "#0a0a0a", border: "1px solid #1e1e1e", color: "#f5f5f5",
  padding: ".55rem 1rem", fontFamily: "'Barlow', sans-serif", fontSize: ".85rem", outline: "none",
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function Badge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { bg: "#1e1e1e", color: "#888" }
  return (
    <span style={{ display: "inline-block", padding: ".25rem .7rem", fontSize: ".65rem", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", background: s.bg, color: s.color }}>
      {status}
    </span>
  )
}

// ── Order Detail Modal ─────────────────────────────────────────────────────────
function OrderModal({ order, onClose, onStatusChange, fmt }: {
  order: IOrder
  onClose: () => void
  onStatusChange: (id: string, status: OrderStatus) => void
  fmt: (n: number) => string
}) {
  const [status, setStatus] = useState<OrderStatus>(order.status ?? "pending")
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await onStatusChange(order._id!, status)
    setSaving(false)
    onClose()
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.88)", zIndex: 2000 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        background: "#0d0d0d", border: "1px solid #1e1e1e",
        width: 580, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", zIndex: 2001,
        fontFamily: "'Barlow', sans-serif",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.5rem", borderBottom: "1px solid #1e1e1e" }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", letterSpacing: 2 }}>{order.orderId}</div>
            <div style={{ color: "#555", fontSize: ".75rem", marginTop: ".2rem" }}>
              {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#888", fontSize: "1.4rem", cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Customer */}
          <div style={{ background: "#0a0a0a", border: "1px solid #1e1e1e", padding: "1.2rem" }}>
            <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: ".8rem" }}>Customer</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
              {[
                ["Name",    order.customer?.name    ?? "—"],
                ["Email",   order.customer?.email   ?? "—"],
                ["Phone",   order.customer?.phone   ?? "—"],
                ["Address", order.customer?.address ?? "—"],
              ].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize: ".65rem", color: "#555", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: ".2rem" }}>{l}</div>
                  <div style={{ fontSize: ".85rem", fontWeight: 600, color: "#f5f5f5" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Items */}
          <div>
            <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: ".75rem" }}>Items</div>
            <div style={{ border: "1px solid #1e1e1e" }}>
              {(order.items ?? []).map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: ".75rem 1rem", borderBottom: i < (order.items?.length ?? 1) - 1 ? "1px solid #0f0f0f" : "none" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: ".88rem" }}>{item.name}</div>
                    <div style={{ color: "#555", fontSize: ".75rem", marginTop: ".1rem" }}>Qty: {item.qty} × {fmt(item.price)}</div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: ".9rem" }}>{fmt(item.qty * item.price)}</div>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: ".85rem 1rem", background: "#0a0a0a", borderTop: "1px solid #1e1e1e" }}>
                <span style={{ fontWeight: 800, fontSize: ".88rem" }}>TOTAL</span>
                <span style={{ fontWeight: 800, fontSize: ".95rem", color: "#22c55e" }}>{fmt(Number(order.totalAmount))}</span>
              </div>
            </div>
          </div>

          {/* Status update */}
          <div>
            <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: ".75rem" }}>Update Status</div>
            <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
              {STATUSES.map(s => {
                const st = STATUS_STYLE[s]
                const active = status === s
                return (
                  <button key={s} onClick={() => setStatus(s)} style={{
                    padding: ".45rem 1rem", border: `1px solid ${active ? st.color : "#1e1e1e"}`,
                    background: active ? st.bg : "transparent",
                    color: active ? st.color : "#555",
                    fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".72rem",
                    letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", transition: "all .15s",
                  }}>
                    {s}
                  </button>
                )
              })}
            </div>
          </div>

          {order.notes && (
            <div>
              <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: ".5rem" }}>Notes</div>
              <div style={{ background: "#0a0a0a", border: "1px solid #1e1e1e", padding: ".85rem 1rem", fontSize: ".85rem", color: "#888", lineHeight: 1.55 }}>{order.notes}</div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: ".75rem", justifyContent: "flex-end", padding: "1.5rem", borderTop: "1px solid #1e1e1e" }}>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid #1e1e1e", color: "#888", padding: ".65rem 1.5rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".78rem", letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }}>
            CLOSE
          </button>
          <button onClick={save} disabled={saving || status === order.status} style={{
            background: (saving || status === order.status) ? "#222" : "#e5202e", color: (saving || status === order.status) ? "#555" : "#fff", border: "none",
            padding: ".65rem 1.5rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".78rem",
            letterSpacing: 1.5, textTransform: "uppercase", cursor: (saving || status === order.status) ? "not-allowed" : "pointer",
          }}>
            {saving ? "SAVING…" : "UPDATE STATUS"}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Orders Page ───────────────────────────────────────────────────────────────
export default function AdminOrdersPage() {
  const { fmt } = useCurrency()
  const [orders,     setOrders]     = useState<IOrder[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pages: 1, total: 0, limit: 12 })
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState("")
  const [statusFilt, setStatusFilt] = useState("")
  const [selected,   setSelected]   = useState<IOrder | null>(null)
  const [toast,      setToast]      = useState<{ msg: string; ok: boolean } | null>(null)
  const [purgeDays,  setPurgeDays]  = useState("")
  const [purging,    setPurging]    = useState(false)

  const load = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "12" })
      if (search)     params.set("search", search)
      if (statusFilt) params.set("status", statusFilt)
      const r = await fetch(`/api/orders?${params}`)
      const j = await r.json()
      if (j.success) {
        setOrders(j.data ?? [])
        setPagination(j.pagination ?? { page: 1, pages: 1, total: 0, limit: 12 })
      }
    } catch { setOrders([]) }
    setLoading(false)
  }, [search, statusFilt])

  useEffect(() => { load(1) }, [load])

  async function updateStatus(id: string, status: OrderStatus) {
    try {
      const r = await fetch(`/api/orders/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
      const j = await r.json()
      if (j.success) {
        showToast("Order status updated!")
        load(pagination.page)
      } else {
        showToast(j.error ?? "Update failed.", false)
      }
    } catch {
      showToast("Failed to update.", false)
    }
  }

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function purgeOrders(olderThanDays?: number) {
    const label = olderThanDays ? `orders older than ${olderThanDays} days` : "ALL orders"
    if (!confirm(`This will permanently delete ${label}. This cannot be undone. Continue?`)) return
    setPurging(true)
    try {
      const url = olderThanDays ? `/api/orders?olderThanDays=${olderThanDays}` : "/api/orders"
      const r = await fetch(url, { method: "DELETE" })
      const j = await r.json()
      if (j.success) {
        showToast(`Purged ${j.deleted} order${j.deleted !== 1 ? "s" : ""}.`)
        load(1)
      } else {
        showToast(j.error || "Purge failed.", false)
      }
    } catch {
      showToast("Network error.", false)
    }
    setPurging(false)
  }

  const statusCounts = STATUSES.reduce((acc, s) => {
    acc[s] = orders.filter(o => o.status === s).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div style={{ fontFamily: "'Barlow', sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", letterSpacing: 2 }}>
            ORD<span style={{ color: "#e5202e" }}>ERS</span>
          </h1>
          {!loading && <p style={{ color: "#555", fontSize: ".8rem", marginTop: ".2rem" }}>{pagination.total} total orders</p>}
        </div>
        <a href={`/api/orders/export${statusFilt ? `?status=${statusFilt}` : ""}`} download
          style={{ background: "transparent", border: "1px solid #1e1e1e", color: "#555", padding: ".5rem 1rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".72rem", letterSpacing: 1.5, textTransform: "uppercase", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: ".4rem" }}>
          ↓ EXPORT CSV
        </a>
      </div>

      {/* Status filter chips */}
      <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <button onClick={() => setStatusFilt("")}
          style={{ padding: ".4rem 1rem", border: `1px solid ${!statusFilt ? "#f5f5f5" : "#1e1e1e"}`, background: !statusFilt ? "rgba(255,255,255,.06)" : "transparent", color: !statusFilt ? "#f5f5f5" : "#555", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".72rem", letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", transition: "all .15s" }}>
          All ({pagination.total})
        </button>
        {STATUSES.map(s => {
          const st = STATUS_STYLE[s]
          const active = statusFilt === s
          return (
            <button key={s} onClick={() => setStatusFilt(active ? "" : s)}
              style={{ padding: ".4rem 1rem", border: `1px solid ${active ? st.color : "#1e1e1e"}`, background: active ? st.bg : "transparent", color: active ? st.color : "#555", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".72rem", letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", transition: "all .15s" }}>
              {s} ({statusCounts[s] ?? 0})
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div style={{ display: "flex", gap: ".75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <input
          placeholder="Search by Order ID, name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && load(1)}
          style={{ ...INP, flex: 1, minWidth: 260 }}
        />
        <button onClick={() => load(1)}
          style={{ background: "#e5202e", color: "#fff", border: "none", padding: ".55rem 1.3rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".78rem", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer" }}>
          SEARCH
        </button>
        {(search || statusFilt) && (
          <button onClick={() => { setSearch(""); setStatusFilt("") }}
            style={{ background: "transparent", border: "1px solid #1e1e1e", color: "#555", padding: ".55rem 1rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".78rem", letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }}>
            CLEAR
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#555" }}>Loading orders…</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#555", border: "1px solid #1e1e1e" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📦</div>
          <div style={{ fontWeight: 700, fontSize: ".95rem" }}>No orders found</div>
          <div style={{ fontSize: ".8rem", color: "#444", marginTop: ".4rem" }}>
            {search || statusFilt ? "Try adjusting your filters" : "Orders will appear here once customers purchase"}
          </div>
        </div>
      ) : (
        <div style={{ border: "1px solid #1e1e1e" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1e1e1e" }}>
                {["Order ID", "Customer", "Items", "Total", "Status", "Date", "Actions"].map(h => (
                  <th key={h} style={{ padding: ".85rem 1rem", textAlign: "left", fontSize: ".62rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={o._id} style={{ borderBottom: i < orders.length - 1 ? "1px solid #0f0f0f" : "none", transition: "background .1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.015)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: ".9rem 1rem" }}>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: ".95rem", letterSpacing: 1 }}>{o.orderId}</div>
                  </td>
                  <td style={{ padding: ".9rem 1rem" }}>
                    <div style={{ fontWeight: 700, fontSize: ".82rem" }}>{o.customer?.name}</div>
                    <div style={{ color: "#555", fontSize: ".72rem", marginTop: ".15rem" }}>{o.customer?.email}</div>
                  </td>
                  <td style={{ padding: ".9rem 1rem", color: "#888", fontSize: ".82rem" }}>
                    {o.items?.length ?? 0} item{(o.items?.length ?? 0) !== 1 ? "s" : ""}
                  </td>
                  <td style={{ padding: ".9rem 1rem", fontWeight: 800, fontSize: ".9rem" }}>{fmt(Number(o.totalAmount))}</td>
                  <td style={{ padding: ".9rem 1rem" }}><Badge status={o.status ?? "pending"} /></td>
                  <td style={{ padding: ".9rem 1rem", color: "#555", fontSize: ".75rem" }}>
                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </td>
                  <td style={{ padding: ".9rem 1rem" }}>
                    <div style={{ display: "flex", gap: ".4rem" }}>
                      <button onClick={() => setSelected(o)}
                        style={{ background: "rgba(59,130,246,.15)", color: "#3b82f6", border: "none", padding: ".3rem .75rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".68rem", letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>
                        VIEW
                      </button>
                      {/* Quick status cycling */}
                      {o.status === "pending" && (
                        <button onClick={() => updateStatus(o._id!, "processing")}
                          style={{ background: "rgba(59,130,246,.15)", color: "#3b82f6", border: "none", padding: ".3rem .75rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".68rem", letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>
                          PROCESS
                        </button>
                      )}
                      {o.status === "processing" && (
                        <button onClick={() => updateStatus(o._id!, "shipped")}
                          style={{ background: "rgba(168,85,247,.15)", color: "#a855f7", border: "none", padding: ".3rem .75rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".68rem", letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>
                          SHIP
                        </button>
                      )}
                      {o.status === "shipped" && (
                        <button onClick={() => updateStatus(o._id!, "delivered")}
                          style={{ background: "rgba(34,197,94,.15)", color: "#22c55e", border: "none", padding: ".3rem .75rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".68rem", letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>
                          DELIVER
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1.5rem" }}>
          <span style={{ color: "#555", fontSize: ".78rem" }}>
            Page {pagination.page} of {pagination.pages} — {pagination.total} orders
          </span>
          <div style={{ display: "flex", gap: ".5rem" }}>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).slice(
              Math.max(0, pagination.page - 3),
              Math.min(pagination.pages, pagination.page + 2)
            ).map(p => (
              <button key={p} onClick={() => load(p)}
                style={{ width: 36, height: 36, border: `1px solid ${p === pagination.page ? "#e5202e" : "#1e1e1e"}`, background: p === pagination.page ? "#e5202e" : "transparent", color: p === pagination.page ? "#fff" : "#555", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".8rem", cursor: "pointer" }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Order detail modal */}
      {selected && (
        <OrderModal order={selected} onClose={() => setSelected(null)} onStatusChange={updateStatus} fmt={fmt} />
      )}

      {/* Purge / Danger Zone */}
      <div style={{ marginTop: "3rem", border: "1px solid rgba(229,32,46,.25)", padding: "1.5rem" }}>
        <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: "#e5202e", marginBottom: "1rem" }}>⚠ DANGER ZONE — ORDER PURGE</div>
        <p style={{ color: "#555", fontSize: ".8rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
          Permanently delete orders from the database. This action cannot be undone.
        </p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          {/* Purge by age */}
          <div>
            <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#555", marginBottom: ".4rem" }}>Purge orders older than</div>
            <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
              <input
                type="number" min={1} placeholder="days"
                value={purgeDays} onChange={e => setPurgeDays(e.target.value)}
                style={{ ...INP, width: 90 }}
              />
              <span style={{ color: "#444", fontSize: ".8rem" }}>days</span>
              <button onClick={() => purgeDays && purgeOrders(parseInt(purgeDays))} disabled={purging || !purgeDays}
                style={{ background: "rgba(234,179,8,.12)", border: "1px solid rgba(234,179,8,.3)", color: "#eab308", padding: ".5rem 1rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".72rem", letterSpacing: 1, textTransform: "uppercase", cursor: purging || !purgeDays ? "not-allowed" : "pointer", opacity: purging || !purgeDays ? .5 : 1 }}>
                PURGE OLD
              </button>
            </div>
          </div>
          {/* Purge all */}
          <button onClick={() => purgeOrders()} disabled={purging}
            style={{ background: "rgba(229,32,46,.1)", border: "1px solid rgba(229,32,46,.4)", color: "#e5202e", padding: ".6rem 1.3rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".72rem", letterSpacing: 1.5, textTransform: "uppercase", cursor: purging ? "not-allowed" : "pointer", opacity: purging ? .5 : 1 }}>
            {purging ? "PURGING…" : "PURGE ALL ORDERS"}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: "2rem", right: "2rem", background: "#111", borderLeft: `3px solid ${toast.ok ? "#22c55e" : "#e5202e"}`, border: "1px solid #1e1e1e", padding: "1rem 1.5rem", fontFamily: "'Barlow', sans-serif", fontSize: ".85rem", fontWeight: 700, zIndex: 3000, color: "#f5f5f5" }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
