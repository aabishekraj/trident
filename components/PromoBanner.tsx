"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

const DEFAULT_MESSAGES = [
  "🚚 FREE SHIPPING ON ORDERS OVER $500",
  "⚡ LIMITED DROPS — SHOP BEFORE THEY'RE GONE",
  "↩  30-DAY HASSLE-FREE RETURNS",
  "🔥 USE CODE TRIDENT10 FOR 10% OFF YOUR FIRST ORDER",
]

export default function PromoBanner() {
  const pathname = usePathname()
  const [dismissed, setDismissed] = useState(false)
  const [messages, setMessages] = useState<string[]>(DEFAULT_MESSAGES)

  // Only show on collection pages (/collection/*)
  const isCollectionPage = pathname?.startsWith("/collection")

  useEffect(() => {
    // Persist dismissed state for the whole browser session
    const wasDismissed = sessionStorage.getItem("trident_banner_dismissed") === "1"
    if (wasDismissed) setDismissed(true)
  }, [])

  useEffect(() => {
    if (!isCollectionPage) return
    fetch("/api/settings")
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.data?.promoBannerMessages) && d.data.promoBannerMessages.length) {
          setMessages(d.data.promoBannerMessages)
        }
      })
      .catch(() => {})
  }, [isCollectionPage])

  if (!isCollectionPage || dismissed) return null

  function handleDismiss() {
    sessionStorage.setItem("trident_banner_dismissed", "1")
    setDismissed(true)
  }

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
        {[...messages, ...messages].map((msg, i) => (
          <span key={i} style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", padding: "0 3rem" }}>
            {msg}
          </span>
        ))}
      </div>

      {/* Dismiss */}
      <button onClick={handleDismiss}
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
