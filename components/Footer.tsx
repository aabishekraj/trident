"use client"

import Link from "next/link"
import { useState } from "react"

const LINK: React.CSSProperties = {
  display: "block",
  color: "#555",
  fontSize: ".82rem",
  fontWeight: 500,
  textDecoration: "none",
  marginBottom: ".6rem",
  transition: "color .15s",
  fontFamily: "'Barlow', sans-serif",
}

const HEADING: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 800,
  fontSize: ".72rem",
  letterSpacing: 3,
  textTransform: "uppercase",
  color: "#f5f5f5",
  marginBottom: "1.2rem",
}

const COLUMNS = [
  {
    title: "SHOP",
    links: [
      { label: "Men",          href: "/collection/men"    },
      { label: "Women",        href: "/collection/women"  },
      { label: "Kids",         href: "/collection/kids"   },
      { label: "Unisex",       href: "/collection/unisex" },
      { label: "New Arrivals", href: "/collection/new"    },
      { label: "Sale",         href: "/collection/sale"   },
      { label: "Collections",  href: "/collection/men"    },
    ],
  },
  {
    title: "HELP",
    links: [
      { label: "Order Tracking",     href: "/account/orders"  },
      { label: "Shipping & Returns", href: "/help/shipping"   },
      { label: "Size Guide",         href: "/help/size-guide" },
      { label: "FAQ",                href: "/help/faq"        },
      { label: "Contact Us",         href: "/help/contact"    },
      { label: "Store Locator",      href: "/help/stores"     },
    ],
  },
  {
    title: "COMPANY",
    links: [
      { label: "About Us",       href: "/about"         },
      { label: "Careers",        href: "/careers"       },
      { label: "Press",          href: "/press"         },
      { label: "Sustainability",  href: "/sustainability" },
      { label: "Investors",       href: "/investors"     },
      { label: "Affiliate",       href: "/affiliate"     },
    ],
  },
]

const SOCIALS = [
  { label: "X",  href: "https://x.com"        },
  { label: "IG", href: "https://instagram.com" },
  { label: "YT", href: "https://youtube.com"   },
  { label: "TK", href: "https://tiktok.com"    },
]

export default function Footer() {
  const [email, setEmail]       = useState("")
  const [subscribed, setSubscribed] = useState(false)

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !email.includes("@")) return
    setSubscribed(true)
    setEmail("")
  }

  return (
    <footer style={{ background: "#050505", borderTop: "1px solid #111", fontFamily: "'Barlow', sans-serif" }}>

      {/* Main grid */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "4rem 2.5rem 3rem", display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1.4fr", gap: "2.5rem" }}>

        {/* Brand column */}
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", letterSpacing: 5, color: "#f5f5f5", marginBottom: "1rem" }}>
            TRI<span style={{ color: "#e5202e" }}>DENT</span>
          </div>
          <p style={{ color: "#444", fontSize: ".82rem", lineHeight: 1.75, marginBottom: "1.5rem", maxWidth: 220 }}>
            Performance meets obsession. Built for those who demand more from every move.
          </p>
          <div style={{ display: "flex", gap: ".5rem", marginBottom: "1.5rem" }}>
            {SOCIALS.map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                style={{ width: 34, height: 34, border: "1px solid #1e1e1e", display: "flex", alignItems: "center", justifyContent: "center", color: "#555", fontSize: ".72rem", fontWeight: 800, letterSpacing: 1, textDecoration: "none", transition: "all .2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#e5202e"; (e.currentTarget as HTMLElement).style.color = "#f5f5f5" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#1e1e1e"; (e.currentTarget as HTMLElement).style.color = "#555" }}
              >{s.label}</a>
            ))}
          </div>
          {/* Trust badges */}
          <div style={{ display: "flex", flexDirection: "column", gap: ".35rem" }}>
            {["🔒 SSL Secure Checkout", "🚚 Free Shipping over $500", "↩ 30-Day Easy Returns"].map(t => (
              <div key={t} style={{ color: "#333", fontSize: ".7rem", display: "flex", alignItems: "center", gap: ".4rem" }}>{t}</div>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {COLUMNS.map(col => (
          <div key={col.title}>
            <div style={HEADING}>{col.title}</div>
            {col.links.map(l => (
              <Link key={l.href + l.label} href={l.href} style={LINK}
                onMouseEnter={e => (e.currentTarget.style.color = "#f5f5f5")}
                onMouseLeave={e => (e.currentTarget.style.color = "#555")}
              >{l.label}</Link>
            ))}
          </div>
        ))}

        {/* Newsletter */}
        <div>
          <div style={HEADING}>NEWSLETTER</div>
          <p style={{ color: "#444", fontSize: ".8rem", lineHeight: 1.7, marginBottom: "1.2rem" }}>
            Get early access to drops &amp; exclusive member offers.
          </p>
          {subscribed ? (
            <div style={{ background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.25)", padding: ".85rem 1rem", color: "#22c55e", fontSize: ".78rem", fontWeight: 700, letterSpacing: .5 }}>
              ✓ You&apos;re subscribed!
            </div>
          ) : (
            <form onSubmit={handleSubscribe}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: "100%", background: "#0d0d0d", border: "1px solid #1e1e1e", color: "#f5f5f5", padding: ".75rem 1rem", fontFamily: "'Barlow', sans-serif", fontSize: ".82rem", outline: "none", marginBottom: ".5rem", boxSizing: "border-box" }}
              />
              <button type="submit"
                style={{ width: "100%", background: "#e5202e", color: "#fff", border: "none", padding: ".75rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".72rem", letterSpacing: 2.5, textTransform: "uppercase", cursor: "pointer" }}>
                SUBSCRIBE
              </button>
            </form>
          )}
          {/* Payment methods */}
          <div style={{ marginTop: "1.5rem" }}>
            <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#2a2a2a", marginBottom: ".6rem" }}>Accepted Payments</div>
            <div style={{ display: "flex", gap: ".35rem", flexWrap: "wrap" }}>
              {["VISA","MC","AMEX","UPI","COD"].map(p => (
                <span key={p} style={{ border: "1px solid #1a1a1a", color: "#333", fontSize: ".58rem", fontWeight: 800, padding: ".3rem .6rem", letterSpacing: .5 }}>{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid #0d0d0d" }} />

      {/* Bottom bar */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "1.25rem 2.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: ".75rem" }}>
        <div style={{ color: "#2a2a2a", fontSize: ".72rem" }}>
          © {new Date().getFullYear()} TRIDENT. All rights reserved.
        </div>
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          {[
            { label: "Privacy Policy", href: "/privacy"       },
            { label: "Terms of Use",   href: "/terms"         },
            { label: "Cookie Policy",  href: "/cookies"       },
            { label: "Accessibility",  href: "/accessibility" },
          ].map(l => (
            <Link key={l.href} href={l.href}
              style={{ color: "#2a2a2a", fontSize: ".68rem", textDecoration: "none", fontWeight: 500, transition: "color .15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#888")}
              onMouseLeave={e => (e.currentTarget.style.color = "#2a2a2a")}
            >{l.label}</Link>
          ))}
        </div>
        <div style={{ color: "#222", fontSize: ".68rem" }}>Made with ♥ in India</div>
      </div>
    </footer>
  )
}
