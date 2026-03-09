"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

type TrackOrder = {
  orderId: string
  status: string
  paymentStatus: string
  paymentMethod: string
  totalAmount: number
  trackingNumber: string | null
  createdAt: string
  updatedAt: string
  customer: { name: string; email: string; address: string }
  items: { name: string; qty: number; price: number; size: string }[]
}

const STEPS = [
  { key: "pending",    label: "Order Placed",  icon: "📋", desc: "Your order has been received" },
  { key: "processing", label: "Processing",    icon: "⚙️", desc: "We're preparing your items"  },
  { key: "shipped",    label: "Shipped",       icon: "🚚", desc: "On the way to you"            },
  { key: "delivered",  label: "Delivered",     icon: "🎉", desc: "Delivered to your address"   },
]

const STATUS_COLOR: Record<string, string> = {
  pending:    "#eab308",
  processing: "#3b82f6",
  shipped:    "#8b5cf6",
  delivered:  "#22c55e",
  cancelled:  "#e5202e",
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

function TrackContent() {
  const params = useSearchParams()
  const [orderId,  setOrderId]  = useState(params.get("id") ?? "")
  const [email,    setEmail]    = useState("")
  const [order,    setOrder]    = useState<TrackOrder | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")
  const [searched, setSearched] = useState(false)

  // Auto-search if ?id= param is in URL
  useEffect(() => {
    const id = params.get("id")
    if (id) { setOrderId(id); doSearch(id, "") }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function doSearch(id = orderId, em = email) {
    const trimmed = id.trim().toUpperCase()
    if (!trimmed) { setError("Please enter an order ID."); return }
    setLoading(true); setError(""); setSearched(true)
    try {
      const qs = new URLSearchParams({ orderId: trimmed })
      if (em.trim()) qs.set("email", em.trim())
      const res = await fetch(`/api/track?${qs}`)
      const j   = await res.json()
      if (j.success) { setOrder(j.data) }
      else           { setOrder(null); setError(j.error ?? "Order not found.") }
    } catch {
      setError("Network error. Please try again.")
    }
    setLoading(false)
  }

  const currentStepIdx  = order ? STEPS.findIndex(s => s.key === order.status) : -1
  const isCancelled     = order?.status === "cancelled"

  const INP: React.CSSProperties = {
    background: "#0d0d0d", border: "1px solid #222", color: "#f5f5f5",
    padding: ".8rem 1rem", fontFamily: "'Barlow', sans-serif",
    fontSize: ".9rem", outline: "none", width: "100%",
  }
  const LABEL: React.CSSProperties = {
    display: "block", fontSize: ".68rem", fontWeight: 700, letterSpacing: 2,
    textTransform: "uppercase", color: "#555", marginBottom: ".4rem",
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f5f5f5", fontFamily: "'Barlow', sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ borderBottom: "1px solid #111", padding: "1.25rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.6rem", letterSpacing: 4, color: "#f5f5f5", textDecoration: "none" }}>
          <span style={{ color: "#e5202e" }}>TRIDENT</span>
        </Link>
        <Link href="/account/orders" style={{ fontSize: ".75rem", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#555", textDecoration: "none" }}>
          My Orders →
        </Link>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "3rem 1.5rem" }}>

        {/* ── Page title ── */}
        <div style={{ marginBottom: "2.5rem" }}>
          <p style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "#e5202e", marginBottom: ".4rem" }}>
            Order Tracking
          </p>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.8rem", letterSpacing: 3, lineHeight: 1, margin: 0 }}>
            TRACK YOUR ORDER
          </h1>
          <p style={{ color: "#555", fontSize: ".88rem", marginTop: ".5rem" }}>
            Enter your order ID to get real-time status updates.
          </p>
        </div>

        {/* ── Search form ── */}
        <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", padding: "2rem", marginBottom: "2.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "1rem", alignItems: "flex-end" }}>
            <div>
              <label style={LABEL}>Order ID</label>
              <input
                style={INP}
                placeholder="TRD-20260306-A7K2X9"
                value={orderId}
                onChange={e => setOrderId(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && doSearch()}
                onFocus={e => (e.target.style.borderColor = "#333")}
                onBlur={e => (e.target.style.borderColor = "#222")}
              />
            </div>
            <div>
              <label style={LABEL}>Email (optional)</label>
              <input
                style={INP}
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doSearch()}
                onFocus={e => (e.target.style.borderColor = "#333")}
                onBlur={e => (e.target.style.borderColor = "#222")}
              />
            </div>
            <button
              onClick={() => doSearch()}
              disabled={loading}
              style={{
                background: loading ? "#333" : "#e5202e", color: "#fff", border: "none",
                padding: ".82rem 1.5rem", fontFamily: "'Barlow', sans-serif",
                fontWeight: 800, fontSize: ".78rem", letterSpacing: 2,
                textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "…" : "TRACK →"}
            </button>
          </div>
          {error && (
            <div style={{ marginTop: "1rem", color: "#e5202e", fontSize: ".82rem", fontWeight: 600, display: "flex", alignItems: "center", gap: ".5rem" }}>
              <span>⚠</span> {error}
            </div>
          )}
        </div>

        {/* ── Results ── */}
        {order && (
          <div>
            {/* Order header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.5rem", letterSpacing: 3, color: "#e5202e" }}>
                  {order.orderId}
                </div>
                <div style={{ color: "#555", fontSize: ".78rem", marginTop: ".3rem" }}>
                  Placed {fmtDate(order.createdAt)} · {order.paymentMethod?.toUpperCase()}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                <span style={{
                  background: `${STATUS_COLOR[order.status] ?? "#555"}18`,
                  color: STATUS_COLOR[order.status] ?? "#888",
                  padding: ".4rem 1.2rem", fontWeight: 800,
                  fontSize: ".72rem", letterSpacing: 2, textTransform: "uppercase",
                }}>
                  {order.status.toUpperCase()}
                </span>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", color: "#e5202e" }}>
                  ${order.totalAmount.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Progress tracker */}
            {!isCancelled && (
              <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", padding: "2rem", marginBottom: "2rem" }}>
                <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: "#444", marginBottom: "1.5rem" }}>
                  Order Progress
                </div>

                {/* Step dots + line */}
                <div style={{ position: "relative", marginBottom: "2rem" }}>
                  {/* Background line */}
                  <div style={{ position: "absolute", top: 20, left: "12.5%", right: "12.5%", height: 2, background: "#1e1e1e" }} />
                  {/* Progress fill */}
                  <div style={{
                    position: "absolute", top: 20, left: "12.5%", height: 2,
                    background: "#e5202e", transition: "width .6s ease",
                    width: currentStepIdx <= 0 ? "0%" : `${(currentStepIdx / (STEPS.length - 1)) * 75}%`,
                  }} />

                  <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
                    {STEPS.map((step, i) => {
                      const done    = currentStepIdx >= i
                      const current = currentStepIdx === i
                      return (
                        <div key={step.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "25%" }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: "50%",
                            background: done ? "#e5202e" : "#111",
                            border: `2px solid ${done ? "#e5202e" : "#2a2a2a"}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "1.1rem", marginBottom: ".6rem",
                            boxShadow: current ? "0 0 0 4px rgba(229,32,46,.2)" : "none",
                            transition: "all .3s",
                          }}>
                            {done ? "✓" : <span style={{ opacity: .4 }}>{step.icon}</span>}
                          </div>
                          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: ".72rem", letterSpacing: 1.5, textTransform: "uppercase", color: done ? "#f5f5f5" : "#444", textAlign: "center" }}>
                            {step.label}
                          </div>
                          <div style={{ color: "#444", fontSize: ".62rem", textAlign: "center", marginTop: ".2rem", lineHeight: 1.4 }}>
                            {step.desc}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Last updated */}
                <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: "1rem", color: "#444", fontSize: ".72rem" }}>
                  Last updated: {fmtDate(order.updatedAt)}
                </div>
              </div>
            )}

            {/* Cancelled banner */}
            {isCancelled && (
              <div style={{ background: "rgba(229,32,46,.08)", border: "1px solid rgba(229,32,46,.2)", padding: "1.25rem 1.5rem", marginBottom: "2rem", display: "flex", gap: "1rem", alignItems: "center" }}>
                <span style={{ fontSize: "1.5rem" }}>✕</span>
                <div>
                  <div style={{ fontWeight: 800, color: "#e5202e", fontSize: ".88rem" }}>Order Cancelled</div>
                  <div style={{ color: "#666", fontSize: ".78rem", marginTop: ".2rem" }}>This order has been cancelled. Contact support if you have questions.</div>
                </div>
              </div>
            )}

            {/* Tracking number */}
            {order.trackingNumber && (
              <div style={{ background: "#0d0d0d", border: "1px solid #8b5cf620", padding: "1.25rem 1.5rem", marginBottom: "2rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <div style={{ fontSize: ".62rem", fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: "#555", marginBottom: ".35rem" }}>
                    Tracking Number
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.2rem", letterSpacing: 3, color: "#8b5cf6" }}>
                    {order.trackingNumber}
                  </div>
                </div>
                <div style={{ fontSize: ".72rem", fontWeight: 700, color: "#8b5cf6", letterSpacing: 1.5, textTransform: "uppercase" }}>
                  📬 Courier tracking active
                </div>
              </div>
            )}

            {/* Two-column: items + delivery info */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>

              {/* Items */}
              <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", padding: "1.5rem" }}>
                <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: "#444", marginBottom: "1rem" }}>
                  Order Items
                </div>
                {order.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: ".6rem 0", borderBottom: "1px solid #111", fontSize: ".85rem" }}>
                    <div>
                      <span style={{ color: "#ccc", fontWeight: 600 }}>{item.name}</span>
                      {item.size && <span style={{ color: "#555", fontSize: ".72rem", marginLeft: ".4rem" }}>({item.size})</span>}
                      <span style={{ color: "#555", marginLeft: ".4rem" }}>×{item.qty}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: "#e5202e" }}>${(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: ".75rem 0 0", fontWeight: 800 }}>
                  <span style={{ fontSize: ".75rem", letterSpacing: 1, textTransform: "uppercase", color: "#555" }}>Total</span>
                  <span style={{ color: "#e5202e" }}>${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Delivery + customer */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", padding: "1.5rem", flex: 1 }}>
                  <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: "#444", marginBottom: ".75rem" }}>
                    Customer
                  </div>
                  <div style={{ fontWeight: 700, fontSize: ".9rem", marginBottom: ".2rem" }}>{order.customer.name}</div>
                  <div style={{ color: "#555", fontSize: ".78rem" }}>{order.customer.email}</div>
                </div>
                {order.customer.address && (
                  <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", padding: "1.5rem", flex: 1, borderTop: "none" }}>
                    <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: "#444", marginBottom: ".75rem" }}>
                      Shipping Address
                    </div>
                    <div style={{ color: "#888", fontSize: ".82rem", lineHeight: 1.7 }}>
                      {order.customer.address}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom actions */}
            <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <Link href="/" style={{ border: "1px solid #1e1e1e", color: "#888", padding: ".75rem 1.5rem", fontWeight: 700, fontSize: ".75rem", letterSpacing: 2, textTransform: "uppercase", textDecoration: "none" }}>
                ← Continue Shopping
              </Link>
              <Link href="/account/orders" style={{ border: "1px solid #1e1e1e", color: "#888", padding: ".75rem 1.5rem", fontWeight: 700, fontSize: ".75rem", letterSpacing: 2, textTransform: "uppercase", textDecoration: "none" }}>
                All My Orders
              </Link>
            </div>
          </div>
        )}

        {/* Empty state — no result yet */}
        {!order && !loading && searched && !error && (
          <div style={{ textAlign: "center", padding: "4rem 2rem", color: "#555" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.6rem", letterSpacing: 2, marginBottom: ".5rem" }}>
              No Order Found
            </div>
            <p style={{ fontSize: ".85rem" }}>Double-check your order ID. It looks like: TRD-YYYYMMDD-XXXXXX</p>
          </div>
        )}

        {/* Tip */}
        {!searched && !order && (
          <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", padding: "1.5rem", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
            <span style={{ fontSize: "1.2rem", flexShrink: 0, marginTop: ".1rem" }}>💡</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: ".82rem", marginBottom: ".4rem" }}>Where to find your order ID?</div>
              <ul style={{ color: "#555", fontSize: ".78rem", lineHeight: 1.8, paddingLeft: "1rem", margin: 0 }}>
                <li>In your confirmation email — subject line contains the order ID</li>
                <li>On the order confirmation page right after placing your order</li>
                <li>In <Link href="/account/orders" style={{ color: "#e5202e", textDecoration: "none" }}>My Orders</Link> if you're signed in</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", color: "#555", fontFamily: "'Barlow', sans-serif" }}>
        Loading…
      </div>
    }>
      <TrackContent />
    </Suspense>
  )
}
