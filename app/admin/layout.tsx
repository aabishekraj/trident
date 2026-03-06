"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ReactNode } from "react"

const NAV = [
  { href: "/admin",           icon: "▦",  label: "Dashboard"  },
  { href: "/admin/orders",    icon: "📦", label: "Orders"     },
  { href: "/admin/products",  icon: "👟", label: "Products"   },
  { href: "/admin/coupons",   icon: "🏷️", label: "Coupons"    },
  { href: "/admin/analytics", icon: "📈", label: "Analytics"  },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const path = usePathname()

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0a0a", color: "#f5f5f5", fontFamily: "'Barlow', sans-serif" }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: "#050505", borderRight: "1px solid #1e1e1e", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid #1e1e1e" }}>
          <Link href="/" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.6rem", letterSpacing: 4, color: "#f5f5f5", textDecoration: "none" }}>
            <span style={{ color: "#e5202e" }}>TRIDENT</span>
          </Link>
          <div style={{ fontSize: ".62rem", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "#333", marginTop: ".2rem" }}>Admin Console</div>
        </div>

        <nav style={{ flex: 1, padding: ".75rem 0" }}>
          {NAV.map(({ href, icon, label }) => {
            const active = path === href || (href !== "/admin" && path.startsWith(href))
            return (
              <Link key={href} href={href} className="admin-nav-link" style={{
                display: "flex", alignItems: "center", gap: ".75rem",
                padding: ".85rem 1.5rem", color: active ? "#f5f5f5" : "#555",
                background: active ? "rgba(255,255,255,.04)" : "transparent",
                borderLeft: `2px solid ${active ? "#e5202e" : "transparent"}`,
                textDecoration: "none", fontWeight: 700, fontSize: ".78rem",
                letterSpacing: "1px", textTransform: "uppercase", transition: "all .15s",
              }}>
                <span style={{ fontSize: "1rem", width: 20, textAlign: "center" }}>{icon}</span>
                {label}
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: ".75rem 0", borderTop: "1px solid #1e1e1e" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: ".75rem", padding: ".85rem 1.5rem", color: "#444", textDecoration: "none", fontSize: ".75rem", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
            ↩ <span>Back to Store</span>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: "auto", padding: "2rem 2.5rem" }}>{children}</main>
    </div>
  )
}
