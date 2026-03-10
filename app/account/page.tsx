"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Customer = { name: string; email: string; token: string }
type Order = {
  _id: string; orderId: string; status: string; totalAmount: number
  createdAt: string; items: { name: string; qty: number }[]
}

export default function AccountPage() {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders,   setOrders]   = useState<Order[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem("trident_customer")
    if (!saved) return
    const c = JSON.parse(saved) as Customer
    setCustomer(c)

    fetch(`/api/orders?email=${encodeURIComponent(c.email)}&limit=3`)
      .then(r => r.json())
      .then(j => setOrders(j.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const statusColor: Record<string, string> = {
    pending:    "#eab308",
    processing: "#3b82f6",
    shipped:    "#8b5cf6",
    delivered:  "#22c55e",
    cancelled:  "#e5202e",
  }

  return (
    <div>
      <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.2rem", letterSpacing: 3, marginBottom: "2rem" }}>
        MY ACCOUNT
      </h1>

      {/* Welcome card */}
      <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderLeft: "3px solid #e5202e", padding: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ fontSize: ".7rem", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "#555", marginBottom: ".5rem" }}>Welcome back</div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", letterSpacing: 2 }}>{customer?.name}</div>
        <div style={{ color: "#555", fontSize: ".82rem", marginTop: ".25rem" }}>{customer?.email}</div>
      </div>

      {/* Quick links grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "#1e1e1e", marginBottom: "2.5rem" }}>
        {[
          { href: "/account/orders",    icon: "📦", title: "My Orders",       desc: "Track and manage your orders" },
          { href: "/account/wishlist",  icon: "♡",  title: "Wishlist",        desc: "Your saved items" },
          { href: "/account/addresses", icon: "📍", title: "Saved Addresses", desc: "Manage your shipping addresses" },
          { href: "/search",            icon: "🔍", title: "Search",          desc: "Find products instantly" },
          { href: "/collection/men",    icon: "👟", title: "Shop Men",        desc: "Browse the latest men's collection" },
          { href: "/collection/women",  icon: "✨", title: "Shop Women",      desc: "Browse the latest women's collection" },
        ].map(({ href, icon, title, desc }) => (
          <Link key={href} href={href} style={{
            display: "flex", alignItems: "center", gap: "1rem",
            background: "#0d0d0d", padding: "1.25rem 1.5rem",
            textDecoration: "none", transition: "background .15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.background = "#111")}
            onMouseLeave={e => (e.currentTarget.style.background = "#0d0d0d")}>
            <span style={{ fontSize: "1.5rem", width: 40, textAlign: "center", flexShrink: 0 }}>{icon}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: ".85rem", color: "#f5f5f5", letterSpacing: .5 }}>{title}</div>
              <div style={{ color: "#444", fontSize: ".72rem", marginTop: ".15rem" }}>{desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.3rem", letterSpacing: 2 }}>RECENT ORDERS</div>
          <Link href="/account/orders" style={{ color: "#e5202e", fontSize: ".72rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", textDecoration: "none" }}>VIEW ALL →</Link>
        </div>

        {loading ? (
          <div style={{ color: "#555", fontSize: ".85rem" }}>Loading orders…</div>
        ) : orders.length === 0 ? (
          <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", padding: "2rem", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: ".75rem" }}>📦</div>
            <div style={{ fontWeight: 700, marginBottom: ".4rem" }}>No orders yet</div>
            <div style={{ color: "#555", fontSize: ".82rem", marginBottom: "1.25rem" }}>When you place an order, it will appear here.</div>
            <Link href="/" style={{ display: "inline-block", background: "#e5202e", color: "#fff", padding: ".65rem 1.75rem", fontWeight: 800, fontSize: ".72rem", letterSpacing: 2, textTransform: "uppercase", textDecoration: "none" }}>
              START SHOPPING
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#1e1e1e" }}>
            {orders.map(o => (
              <div key={o._id} style={{ background: "#0d0d0d", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1rem", letterSpacing: 1 }}>{o.orderId}</div>
                  <div style={{ color: "#555", fontSize: ".72rem", marginTop: ".2rem" }}>
                    {o.items.slice(0, 2).map(i => i.name).join(", ")}{o.items.length > 2 && ` +${o.items.length - 2} more`}
                  </div>
                  <div style={{ color: "#444", fontSize: ".68rem", marginTop: ".2rem" }}>
                    {new Date(o.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, marginBottom: ".35rem" }}>${o.totalAmount.toFixed(2)}</div>
                  <span style={{ display: "inline-block", background: `${statusColor[o.status] || "#555"}20`, color: statusColor[o.status] || "#888", padding: ".2rem .7rem", fontSize: ".62rem", fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase" }}>
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
