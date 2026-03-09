"use client"

import Link from "next/link"

const LINKS = [
  { label: "Track Order",  href: "/track"          },
  { label: "Collections",  href: "/collection/men"  },
  { label: "My Account",   href: "/account"         },
  { label: "Contact",      href: "/help/contact"    },
]

const SOCIALS = [
  { label: "IG", href: "https://instagram.com" },
  { label: "X",  href: "https://x.com"         },
  { label: "YT", href: "https://youtube.com"   },
]

export default function Footer() {
  return (
    <footer style={{
      background: "#050505",
      borderTop: "1px solid #111",
      fontFamily: "'Barlow', sans-serif",
    }}>
      <div style={{
        maxWidth: 1280, margin: "0 auto",
        padding: "3rem 2.5rem 2.5rem",
        display: "flex", flexDirection: "column", gap: "2rem",
      }}>

        {/* Top row — brand + nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1.5rem" }}>
          {/* Brand */}
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", letterSpacing: 5, color: "#f5f5f5" }}>
            TRI<span style={{ color: "#e5202e" }}>DENT</span>
          </div>

          {/* Nav links */}
          <nav style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            {LINKS.map(l => (
              <Link key={l.href} href={l.href}
                style={{ color: "#555", fontSize: ".82rem", fontWeight: 600, textDecoration: "none", letterSpacing: .5, transition: "color .15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#f5f5f5")}
                onMouseLeave={e => (e.currentTarget.style.color = "#555")}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Socials */}
          <div style={{ display: "flex", gap: ".5rem" }}>
            {SOCIALS.map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                style={{ width: 32, height: 32, border: "1px solid #1e1e1e", display: "flex", alignItems: "center", justifyContent: "center", color: "#555", fontSize: ".7rem", fontWeight: 800, textDecoration: "none", transition: "all .2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#e5202e"; (e.currentTarget as HTMLElement).style.color = "#f5f5f5" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#1e1e1e"; (e.currentTarget as HTMLElement).style.color = "#555" }}
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        {/* Thin divider */}
        <div style={{ borderTop: "1px solid #0d0d0d" }} />

        {/* Bottom row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: ".75rem" }}>
          <span style={{ color: "#2a2a2a", fontSize: ".72rem" }}>
            © {new Date().getFullYear()} TRIDENT. All rights reserved.
          </span>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            {[{ label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }].map(l => (
              <Link key={l.href} href={l.href}
                style={{ color: "#2a2a2a", fontSize: ".68rem", textDecoration: "none", fontWeight: 500, transition: "color .15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#888")}
                onMouseLeave={e => (e.currentTarget.style.color = "#2a2a2a")}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <span style={{ color: "#222", fontSize: ".68rem" }}>Made with ♥ in India</span>
        </div>
      </div>
    </footer>
  )
}
