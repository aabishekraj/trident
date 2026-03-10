"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type RequestType = "cancel_request" | "return_request" | "replacement_request"

type OrderItem = { name: string; qty: number; price: number; size?: string }
type Order = {
  _id: string; orderId: string; status: string; totalAmount: number
  createdAt: string; items: OrderItem[]; customer: { address: string }
  paymentMethod?: string; paymentStatus?: string; trackingNumber?: string
}

const STATUS_STEPS = ["pending","processing","shipped","delivered"]
const STATUS_COLOR: Record<string, string> = {
  pending:    "#eab308",
  processing: "#3b82f6",
  shipped:    "#8b5cf6",
  delivered:  "#22c55e",
  cancelled:  "#e5202e",
}

export default function MyOrdersPage() {
  const [orders,     setOrders]     = useState<Order[]>([])
  const [loading,    setLoading]    = useState(true)
  const [open,       setOpen]       = useState<string | null>(null)
  const [filter,     setFilter]     = useState("")
  const [requesting, setRequesting] = useState<string | null>(null)  // orderId being actioned
  const [reqSuccess, setReqSuccess] = useState<Record<string, string>>({}) // orderId → ticketId

  async function submitRequest(order: Order, type: RequestType) {
    const typeLabel = type === "cancel_request" ? "Cancellation" : type === "return_request" ? "Return" : "Replacement"
    if (!confirm(`Submit a ${typeLabel} request for order ${order.orderId}?`)) return
    const saved = localStorage.getItem("trident_customer")
    if (!saved) return
    const c = JSON.parse(saved)
    setRequesting(order._id)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          subject: `${typeLabel} Request — ${order.orderId}`,
          message: `Customer has requested a ${typeLabel.toLowerCase()} for order ${order.orderId}. Total: $${order.totalAmount.toFixed(2)}. Payment: ${order.paymentMethod || "N/A"}.`,
          customerName: c.name,
          customerEmail: c.email,
          orderId: order.orderId,
        }),
      })
      const j = await res.json()
      if (j.success) {
        setReqSuccess(prev => ({ ...prev, [order._id]: j.data.ticketId }))
      } else {
        alert(j.error || "Failed to submit request. Please try again.")
      }
    } catch {
      alert("Network error. Please try again.")
    }
    setRequesting(null)
  }

  useEffect(() => {
    const saved = localStorage.getItem("trident_customer")
    if (!saved) return
    const c = JSON.parse(saved)
    fetch(`/api/orders?email=${encodeURIComponent(c.email)}&limit=50`)
      .then(r => r.json())
      .then(j => setOrders(j.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter ? orders.filter(o => o.status === filter) : orders

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.2rem", letterSpacing: 3, margin: 0 }}>MY ORDERS</h1>
        <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
          {[["", "ALL"], ["pending","PENDING"], ["processing","PROCESSING"], ["shipped","SHIPPED"], ["delivered","DELIVERED"]].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              style={{ padding: ".35rem .85rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".68rem", letterSpacing: 1.5, textTransform: "uppercase", border: `1px solid ${filter === val ? "#e5202e" : "#1e1e1e"}`, color: filter === val ? "#e5202e" : "#555", background: filter === val ? "rgba(229,32,46,.08)" : "transparent", cursor: "pointer" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#1e1e1e" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ background: "#0d0d0d", height: 80 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", padding: "4rem", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📦</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", letterSpacing: 2, marginBottom: ".5rem" }}>
            {filter ? `NO ${filter.toUpperCase()} ORDERS` : "NO ORDERS YET"}
          </div>
          <p style={{ color: "#555", fontSize: ".88rem", marginBottom: "1.5rem" }}>
            {filter ? "Try a different filter." : "You haven't placed any orders yet. Let's change that!"}
          </p>
          <Link href="/" style={{ display: "inline-block", background: "#e5202e", color: "#fff", padding: ".75rem 2rem", fontWeight: 800, fontSize: ".78rem", letterSpacing: 2, textTransform: "uppercase", textDecoration: "none" }}>
            SHOP NOW
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#1e1e1e" }}>
          {filtered.map(order => (
            <div key={order._id}>
              {/* Order row */}
              <div onClick={() => setOpen(open === order._id ? null : order._id)}
                style={{ background: "#0d0d0d", padding: "1.25rem 1.5rem", cursor: "pointer", display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "center" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#111")}
                onMouseLeave={e => (e.currentTarget.style.background = "#0d0d0d")}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.05rem", letterSpacing: 1.5, color: "#e5202e" }}>
                      {order.orderId}
                    </div>
                    <span style={{ display: "inline-block", background: `${STATUS_COLOR[order.status] || "#555"}18`, color: STATUS_COLOR[order.status] || "#888", padding: ".2rem .7rem", fontSize: ".6rem", fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase" }}>
                      {order.status}
                    </span>
                  </div>
                  <div style={{ color: "#555", fontSize: ".72rem", marginTop: ".3rem" }}>
                    {order.items.slice(0, 3).map(i => i.name).join(", ")}{order.items.length > 3 && ` +${order.items.length - 3} more`}
                  </div>
                  <div style={{ color: "#333", fontSize: ".68rem", marginTop: ".2rem" }}>
                    {new Date(order.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
                    {order.paymentMethod && ` · ${order.paymentMethod.toUpperCase()}`}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: "1.05rem", marginBottom: ".4rem" }}>${order.totalAmount.toFixed(2)}</div>
                  <div style={{ color: "#444", fontSize: ".7rem", fontWeight: 700 }}>{open === order._id ? "▲ HIDE" : "▼ DETAILS"}</div>
                </div>
              </div>

              {/* Expanded details */}
              {open === order._id && (
                <div style={{ background: "#080808", borderTop: "1px solid #1a1a1a", padding: "1.5rem" }}>

                  {/* Progress bar */}
                  {order.status !== "cancelled" && (
                    <div style={{ marginBottom: "2rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", position: "relative", marginBottom: ".75rem" }}>
                        <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: "#1e1e1e", transform: "translateY(-50%)" }} />
                        <div style={{ position: "absolute", top: "50%", left: 0, height: 2, background: "#e5202e", transform: "translateY(-50%)", width: `${(STATUS_STEPS.indexOf(order.status) / (STATUS_STEPS.length - 1)) * 100}%`, transition: "width .4s" }} />
                        {STATUS_STEPS.map((s, i) => {
                          const done = STATUS_STEPS.indexOf(order.status) >= i
                          return (
                            <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>
                              <div style={{ width: 20, height: 20, borderRadius: "50%", background: done ? "#e5202e" : "#1e1e1e", border: `2px solid ${done ? "#e5202e" : "#333"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {done && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
                              </div>
                              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: ".62rem", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: done ? "#f5f5f5" : "#444", marginTop: ".4rem" }}>{s}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tracking */}
                  {order.trackingNumber && (
                    <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", padding: "1rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: ".3rem" }}>Tracking Number</div>
                        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.1rem", letterSpacing: 2 }}>{order.trackingNumber}</div>
                      </div>
                      <span style={{ color: "#8b5cf6", fontSize: ".72rem", fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase" }}>📬 TRACK</span>
                    </div>
                  )}

                  {/* Items */}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: ".75rem" }}>Items</div>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: ".6rem 0", borderBottom: "1px solid #111", fontSize: ".85rem" }}>
                        <span style={{ color: "#888" }}>{item.name}{item.size ? ` (${item.size})` : ""} × {item.qty}</span>
                        <span style={{ fontWeight: 700 }}>${(item.price * item.qty).toFixed(2)}</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", padding: ".75rem 0 0", fontWeight: 800 }}>
                      <span>TOTAL</span><span style={{ color: "#e5202e" }}>${order.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Shipping address */}
                  {order.customer?.address && (
                    <div style={{ marginBottom: "1.5rem" }}>
                      <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: ".4rem" }}>Shipping Address</div>
                      <div style={{ color: "#666", fontSize: ".82rem", lineHeight: 1.6 }}>{order.customer.address}</div>
                    </div>
                  )}

                  {/* Order Actions */}
                  {reqSuccess[order._id] ? (
                    <div style={{ background: "rgba(34,197,94,.08)", border: "1px solid rgba(34,197,94,.25)", padding: "1rem 1.2rem" }}>
                      <div style={{ color: "#22c55e", fontWeight: 700, fontSize: ".82rem", marginBottom: ".25rem" }}>✓ Request submitted successfully</div>
                      <div style={{ color: "#555", fontSize: ".72rem" }}>Ticket ID: <strong style={{ color: "#888" }}>{reqSuccess[order._id]}</strong> — our team will contact you within 24–48 hrs.</div>
                    </div>
                  ) : !["cancelled","delivered"].includes(order.status) ? (
                    <div>
                      <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: ".75rem" }}>Need Help With This Order?</div>
                      <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                        {order.status === "pending" && (
                          <button onClick={() => submitRequest(order, "cancel_request")} disabled={requesting === order._id}
                            style={{ background: "rgba(229,32,46,.1)", border: "1px solid rgba(229,32,46,.3)", color: "#e5202e", padding: ".5rem 1rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".72rem", letterSpacing: 1, textTransform: "uppercase", cursor: requesting === order._id ? "not-allowed" : "pointer" }}>
                            ✕ CANCEL ORDER
                          </button>
                        )}
                        {["shipped","processing"].includes(order.status) && (
                          <>
                            <button onClick={() => submitRequest(order, "return_request")} disabled={requesting === order._id}
                              style={{ background: "rgba(59,130,246,.1)", border: "1px solid rgba(59,130,246,.3)", color: "#3b82f6", padding: ".5rem 1rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".72rem", letterSpacing: 1, textTransform: "uppercase", cursor: requesting === order._id ? "not-allowed" : "pointer" }}>
                              ↩ RETURN
                            </button>
                            <button onClick={() => submitRequest(order, "replacement_request")} disabled={requesting === order._id}
                              style={{ background: "rgba(139,92,246,.1)", border: "1px solid rgba(139,92,246,.3)", color: "#8b5cf6", padding: ".5rem 1rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".72rem", letterSpacing: 1, textTransform: "uppercase", cursor: requesting === order._id ? "not-allowed" : "pointer" }}>
                              🔄 REPLACEMENT
                            </button>
                          </>
                        )}
                        <Link href="/support" style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", color: "#888", padding: ".5rem 1rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".72rem", letterSpacing: 1, textTransform: "uppercase", textDecoration: "none" }}>
                          💬 CONTACT SUPPORT
                        </Link>
                      </div>
                    </div>
                  ) : order.status === "delivered" ? (
                    <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                      <button onClick={() => submitRequest(order, "return_request")} disabled={requesting === order._id}
                        style={{ background: "rgba(59,130,246,.1)", border: "1px solid rgba(59,130,246,.3)", color: "#3b82f6", padding: ".5rem 1rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".72rem", letterSpacing: 1, textTransform: "uppercase", cursor: requesting === order._id ? "not-allowed" : "pointer" }}>
                        ↩ RETURN / EXCHANGE
                      </button>
                      <button onClick={() => submitRequest(order, "replacement_request")} disabled={requesting === order._id}
                        style={{ background: "rgba(139,92,246,.1)", border: "1px solid rgba(139,92,246,.3)", color: "#8b5cf6", padding: ".5rem 1rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".72rem", letterSpacing: 1, textTransform: "uppercase", cursor: requesting === order._id ? "not-allowed" : "pointer" }}>
                        🔄 REPLACEMENT
                      </button>
                      <Link href="/support" style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", color: "#888", padding: ".5rem 1rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".72rem", letterSpacing: 1, textTransform: "uppercase", textDecoration: "none" }}>
                        💬 CONTACT SUPPORT
                      </Link>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
