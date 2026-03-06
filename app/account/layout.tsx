"use client"

import { useEffect, useState, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"

type Customer = { name: string; email: string; token: string }

const NAV = [
  { href: "/account",          icon: "👤", label: "My Account"  },
  { href: "/account/orders",   icon: "📦", label: "My Orders"   },
  { href: "/account/wishlist", icon: "♡",  label: "Wishlist"    },
]

export default function AccountLayout({ children }: { children: ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem("trident_customer")
    if (saved) {
      setCustomer(JSON.parse(saved))
    } else {
      router.push("/signin")
    }
    setLoading(false)
  }, [router])

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", color: "#555", fontFamily: "'Barlow', sans-serif" }}>
      Loading…
    </div>
  )

  if (!customer) return null

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f5f5f5", fontFamily: "'Barlow', sans-serif" }}>
      {/* Top nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2.5rem", height: 60, background: "rgba(10,10,10,0.97)", borderBottom: "1px solid #1e1e1e" }}>
        <Link href="/" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.6rem", letterSpacing: 4, color: "#f5f5f5", textDecoration: "none" }}>
          TRI<span style={{ color: "#e5202e" }}>DENT</span>
        </Link>
        <div style={{ display: "flex", gap: ".75rem", alignItems: "center" }}>
          <span style={{ color: "#555", fontSize: ".78rem", fontWeight: 700, letterSpacing: 1 }}>
            {customer.name}
          </span>
          <button onClick={() => { localStorage.removeItem("trident_customer"); router.push("/") }}
            style={{ background: "none", border: "1px solid #1e1e1e", color: "#666", padding: ".35rem .9rem", fontSize: ".72rem", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", fontFamily: "'Barlow', sans-serif" }}>
            SIGN OUT
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2.5rem 2rem", display: "grid", gridTemplateColumns: "200px 1fr", gap: "2.5rem" }}>
        {/* Sidebar */}
        <aside>
          <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", overflow: "hidden" }}>
            {/* Profile mini */}
            <div style={{ padding: "1.5rem", borderBottom: "1px solid #1e1e1e" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#e5202e", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", color: "#fff", marginBottom: ".75rem" }}>
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ fontWeight: 700, fontSize: ".88rem", marginBottom: ".2rem" }}>{customer.name}</div>
              <div style={{ color: "#555", fontSize: ".72rem" }}>{customer.email}</div>
            </div>
            {/* Nav */}
            {NAV.map(({ href, icon, label }) => {
              const active = pathname === href
              return (
                <Link key={href} href={href} style={{
                  display: "flex", alignItems: "center", gap: ".75rem",
                  padding: ".85rem 1.25rem",
                  color: active ? "#f5f5f5" : "#555",
                  background: active ? "rgba(229,32,46,.06)" : "transparent",
                  borderLeft: `2px solid ${active ? "#e5202e" : "transparent"}`,
                  textDecoration: "none", fontWeight: 700, fontSize: ".78rem",
                  letterSpacing: 1, textTransform: "uppercase", transition: "all .15s",
                }}>
                  <span style={{ fontSize: ".95rem" }}>{icon}</span>
                  {label}
                </Link>
              )
            })}
          </div>
        </aside>

        {/* Main content */}
        <main>{children}</main>
      </div>
    </div>
  )
}
