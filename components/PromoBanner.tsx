"use client"

import { useState } from "react"

const MESSAGES = [
  "🚚 FREE SHIPPING ON ORDERS OVER $500",
  "⚡ LIMITED DROPS — SHOP BEFORE THEY'RE GONE",
  "↩  30-DAY HASSLE-FREE RETURNS",
  "🔥 USE CODE TRIDENT10 FOR 10% OFF YOUR FIRST ORDER",
]

export default function PromoBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div style={{
      background: "#e5202e",
      color: "#fff",
      position: "relative",
      overflow: "hidden",
      height: 36,
      display: "flex",
      alignItems: "center",
    }}>
      {/* Scrolling ticker */}
      <div style={{
        display: "flex",
        gap: 0,
        animation: "ticker 28s linear infinite",
        whiteSpace: "nowrap",
        willChange: "transform",
      }}>
        {[...MESSAGES, ...MESSAGES].map((msg, i) => (
          <span key={i} style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", padding: "0 3rem" }}>
            {msg}
          </span>
        ))}
      </div>

      {/* Dismiss */}
      <button onClick={() => setDismissed(true)}
        style={{ position: "absolute", right: ".75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,.6)", fontSize: ".85rem", cursor: "pointer", lineHeight: 1, padding: 0, flexShrink: 0, zIndex: 2 }}>
        ✕
      </button>

      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
