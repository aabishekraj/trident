"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ReactNode, useEffect } from "react"
import { AdminSessionProvider, useAdminSession } from "@/context/AdminSessionContext"
import { ROLE_PERMISSIONS, AdminRole } from "@/lib/roles"

const NAV: { href: string; icon: string; label: string; permKey: keyof typeof ROLE_PERMISSIONS[AdminRole] }[] = [
  { href: "/admin",            icon: "▦",  label: "Dashboard",  permKey: "dashboard"  },
  { href: "/admin/orders",     icon: "📦", label: "Orders",     permKey: "orders"     },
  { href: "/admin/products",   icon: "👟", label: "Products",   permKey: "products"   },
  { href: "/admin/messages",   icon: "💬", label: "Messages",   permKey: "messages"   },
  { href: "/admin/coupons",    icon: "🏷️", label: "Coupons",    permKey: "coupons"    },
  { href: "/admin/analytics",  icon: "📈", label: "Analytics",  permKey: "analytics"  },
  { href: "/admin/settings",   icon: "⚙️",  label: "Settings",   permKey: "settings"   },
  { href: "/admin/users",      icon: "👤", label: "Users",      permKey: "users"      },
]

function hasAccess(role: AdminRole, permKey: string): boolean {
  const perms = ROLE_PERMISSIONS[role]
  if (!perms) return false
  const val = (perms as Record<string, unknown>)[permKey]
  if (typeof val === "boolean") return val
  if (typeof val === "object" && val !== null) return (val as Record<string, boolean>).view ?? false
  return false
}

function AdminLayoutInner({ children }: { children: ReactNode }) {
  const path    = usePathname()
  const router  = useRouter()
  const session = useAdminSession()
  const role    = (session?.role ?? "analyst") as AdminRole

  // Redirect unauthenticated users to login (skip redirect while loading)
  useEffect(() => {
    if (!session.loading && !session.loggedIn && path !== "/admin/login") {
      router.replace("/admin/login")
    }
  }, [session.loading, session.loggedIn, path, router])

  async function handleLogout() {
    try { await fetch("/api/admin/login", { method: "DELETE" }) } catch { /* ignore */ }
    window.location.href = "/admin/login"
  }

  // While verifying session, show full-screen loader (prevents layout flash)
  if (session.loading && path !== "/admin/login") {
    return (
      <div style={{
        minHeight: "100vh", background: "#0a0a0a", display: "flex",
        alignItems: "center", justifyContent: "center", flexDirection: "column",
        gap: "1rem", fontFamily: "'Barlow', sans-serif",
      }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", letterSpacing: 6, color: "#f5f5f5" }}>
          <span style={{ color: "#e5202e" }}>TRIDENT</span>
        </div>
        <div style={{ width: 32, height: 32, border: "2px solid #1e1e1e", borderTopColor: "#e5202e", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // Not logged in — redirect is in progress, render nothing to avoid flash
  if (!session.loggedIn && path !== "/admin/login") return null

  const visibleNav = NAV.filter(n => hasAccess(role, n.permKey))
  const currentNav = NAV.find(n => path === n.href || (n.href !== "/admin" && path.startsWith(n.href)))
  const allowed    = !currentNav || hasAccess(role, currentNav.permKey)

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0a0a", color: "#f5f5f5", fontFamily: "'Barlow', sans-serif" }}>

      {/* Sidebar */}
      <aside style={{ width: 220, background: "#050505", borderRight: "1px solid #1a1a1a", display: "flex", flexDirection: "column", flexShrink: 0 }}>

        {/* Brand + user chip */}
        <div style={{ padding: "1.5rem", borderBottom: "1px solid #1a1a1a" }}>
          <Link href="/" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.6rem", letterSpacing: 4, color: "#f5f5f5", textDecoration: "none" }}>
            <span style={{ color: "#e5202e" }}>TRIDENT</span>
          </Link>
          <div style={{ fontSize: ".62rem", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "#2a2a2a", marginTop: ".2rem" }}>Admin Console</div>
          {session?.username && (
            <div style={{ marginTop: ".75rem", display: "flex", alignItems: "center", gap: ".5rem" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#e5202e", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bebas Neue', sans-serif", fontSize: ".85rem", color: "#fff", flexShrink: 0 }}>
                {session.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: ".72rem", fontWeight: 700, color: "#888" }}>{session.username}</div>
                <div style={{ fontSize: ".6rem", letterSpacing: 1.5, textTransform: "uppercase", color: "#333" }}>{role.replace("_", " ")}</div>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: ".75rem 0" }}>
          {visibleNav.map(({ href, icon, label }) => {
            const active = path === href || (href !== "/admin" && path.startsWith(href))
            return (
              <Link key={href} href={href} style={{
                display: "flex", alignItems: "center", gap: ".75rem",
                padding: ".85rem 1.5rem",
                color: active ? "#f5f5f5" : "#444",
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

        {/* Bottom */}
        <div style={{ borderTop: "1px solid #1a1a1a" }}>
          <Link href="/" style={{
            display: "flex", alignItems: "center", gap: ".75rem",
            padding: ".85rem 1.5rem", color: "#333",
            textDecoration: "none", fontSize: ".75rem", fontWeight: 700,
            letterSpacing: 1, textTransform: "uppercase",
          }}
            onMouseEnter={e => (e.currentTarget.style.color = "#888")}
            onMouseLeave={e => (e.currentTarget.style.color = "#333")}
          >
            <span style={{ fontSize: ".9rem" }}>↩</span>
            <span>Back to Store</span>
          </Link>
          <div style={{ margin: "0 1.5rem", borderTop: "1px solid #111" }} />
          <button onClick={handleLogout} style={{
            display: "flex", alignItems: "center", gap: ".75rem",
            width: "100%", padding: ".85rem 1.5rem",
            color: "#e5202e", background: "none", border: "none", cursor: "pointer",
            fontSize: ".75rem", fontWeight: 800, letterSpacing: 1.5,
            textTransform: "uppercase", fontFamily: "'Barlow', sans-serif",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(229,32,46,.08)" }}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "none"}
          >
            <span style={{ fontSize: "1rem" }}>⏻</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: "auto", padding: "2rem 2.5rem" }}>
        {allowed ? children : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🚫</div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", letterSpacing: 3, color: "#e5202e", marginBottom: ".5rem" }}>ACCESS DENIED</h2>
            <p style={{ color: "#444", fontSize: ".88rem", marginBottom: "1.5rem" }}>
              Your role (<strong style={{ color: "#888" }}>{role.replace("_", " ")}</strong>) does not have permission to view this section.
            </p>
            <Link href="/admin" style={{ background: "#e5202e", color: "#fff", padding: ".75rem 2rem", fontWeight: 800, fontSize: ".78rem", letterSpacing: 2, textTransform: "uppercase", textDecoration: "none" }}>
              ← Back to Dashboard
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminSessionProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminSessionProvider>
  )
}
