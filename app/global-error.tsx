"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body style={{ margin: 0, background: "#0a0a0a", color: "#f5f5f5", fontFamily: "'Barlow', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ fontSize: "3rem" }}>⚠</div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", letterSpacing: 2, color: "#e5202e", margin: 0 }}>SOMETHING WENT WRONG</h2>
        <p style={{ color: "#555", fontSize: ".88rem", textAlign: "center", maxWidth: 400, lineHeight: 1.65 }}>
          We&apos;ve been notified and are looking into it. Please try again.
        </p>
        <button onClick={reset}
          style={{ background: "#e5202e", color: "#fff", border: "none", padding: ".85rem 2.5rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".82rem", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer" }}>
          TRY AGAIN
        </button>
      </body>
    </html>
  )
}
