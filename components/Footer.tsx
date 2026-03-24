"use client"

import Link from "next/link"

const SHOP_LINKS = [
  { label: "Men",          href: "/collection/men"         },
  { label: "Women",        href: "/collection/women"       },
  { label: "Kids",         href: "/collection/kids"        },
  { label: "New Arrivals", href: "/collection/tag/NEW"     },
  { label: "Unisex",       href: "/collection/unisex"      },
]

const HELP_LINKS = [
  { label: "Track Order",        href: "/track"           },
  { label: "Shipping & Returns", href: "/help/shipping"   },
  { label: "Size Guide",         href: "/help/size-guide" },
  { label: "FAQ",                href: "/help/faq"        },
  { label: "Contact Us",         href: "/help/contact"    },
]

const COMPANY_LINKS = [
  { label: "About Trident", href: "/about"    },
  { label: "My Account",    href: "/account"  },
  { label: "Privacy Policy",href: "/privacy"  },
  { label: "Terms of Use",  href: "/terms"    },
]

const SOCIALS = [
  {
    label: "Instagram",
    href: "https://instagram.com",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
      </svg>
    ),
  },
  {
    label: "X (Twitter)",
    href: "https://x.com",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.26 5.632L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://youtube.com",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.54C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
      </svg>
    ),
  },
]

const lnk: React.CSSProperties = {
  color: "#383838", fontSize: ".8rem", fontWeight: 600,
  textDecoration: "none", display: "block",
  marginBottom: ".7rem", letterSpacing: .3,
  transition: "color .15s",
}

export default function Footer() {
  return (
    <footer style={{
      background: "#030303",
      borderTop: "1px solid #0f0f0f",
      fontFamily: "'Barlow', sans-serif",
    }}>
      <div style={{
        maxWidth: 1320, margin: "0 auto",
        padding: "4rem 2.5rem 2.5rem",
      }}>

        {/* Top section */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr",
          gap: "3rem",
          marginBottom: "3.5rem",
        }}>

          {/* Brand column */}
          <div>
            <Link href="/" style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "2.2rem", letterSpacing: 6,
              color: "#f5f5f5", textDecoration: "none",
              display: "inline-block", marginBottom: "1.25rem",
            }}>
              TRI<span style={{ color: "#e5202e" }}>DENT</span>
            </Link>
            <p style={{
              color: "#2e2e2e", fontSize: ".82rem", lineHeight: 1.75,
              maxWidth: 260, marginBottom: "1.75rem",
            }}>
              Performance apparel engineered for those who demand more from every move.
            </p>

            {/* Socials */}
            <div style={{ display: "flex", gap: ".6rem" }}>
              {SOCIALS.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.label}
                  style={{
                    width: 34, height: 34, border: "1px solid #151515",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#2a2a2a", textDecoration: "none",
                    transition: "all .2s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#e5202e"; (e.currentTarget as HTMLElement).style.color = "#e5202e" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#151515"; (e.currentTarget as HTMLElement).style.color = "#2a2a2a" }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <div style={{
              fontSize: ".65rem", fontWeight: 800, letterSpacing: 3.5,
              textTransform: "uppercase", color: "#1e1e1e",
              marginBottom: "1.25rem",
            }}>
              Shop
            </div>
            {SHOP_LINKS.map(l => (
              <Link key={l.href} href={l.href} style={lnk}
                onMouseEnter={e => (e.currentTarget.style.color = "#888")}
                onMouseLeave={e => (e.currentTarget.style.color = "#383838")}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Help */}
          <div>
            <div style={{
              fontSize: ".65rem", fontWeight: 800, letterSpacing: 3.5,
              textTransform: "uppercase", color: "#1e1e1e",
              marginBottom: "1.25rem",
            }}>
              Help
            </div>
            {HELP_LINKS.map(l => (
              <Link key={l.href} href={l.href} style={lnk}
                onMouseEnter={e => (e.currentTarget.style.color = "#888")}
                onMouseLeave={e => (e.currentTarget.style.color = "#383838")}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Company */}
          <div>
            <div style={{
              fontSize: ".65rem", fontWeight: 800, letterSpacing: 3.5,
              textTransform: "uppercase", color: "#1e1e1e",
              marginBottom: "1.25rem",
            }}>
              Company
            </div>
            {COMPANY_LINKS.map(l => (
              <Link key={l.href} href={l.href} style={lnk}
                onMouseEnter={e => (e.currentTarget.style.color = "#888")}
                onMouseLeave={e => (e.currentTarget.style.color = "#383838")}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid #0d0d0d", marginBottom: "1.75rem" }} />

        {/* Bottom bar */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap", gap: "1rem",
        }}>
          <span style={{ color: "#1e1e1e", fontSize: ".72rem", letterSpacing: .5 }}>
            © {new Date().getFullYear()} TRIDENT. All rights reserved.
          </span>

          <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
            {["VISA", "MC", "AMEX", "UPI"].map(p => (
              <span key={p} style={{
                border: "1px solid #111", color: "#1e1e1e",
                fontSize: ".6rem", fontWeight: 800, padding: ".25rem .5rem",
                letterSpacing: 1,
              }}>
                {p}
              </span>
            ))}
          </div>

          <span style={{ color: "#161616", fontSize: ".68rem", letterSpacing: .5 }}>
            Made with care in India
          </span>
        </div>
      </div>
    </footer>
  )
}
