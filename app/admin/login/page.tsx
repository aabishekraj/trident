"use client"

import { useState } from "react"
import Link from "next/link"

export default function AdminLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError]       = useState("")
  const [loading, setLoading]   = useState(false)

  async function handleLogin() {
    if (!username || !password) return setError("Enter both username and password.")
    setLoading(true)
    setError("")

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      let json: { success: boolean; error?: string } = { success: false }
      try {
        json = await res.json()
      } catch {
        setError(`Server returned an unexpected response (HTTP ${res.status}). Check server logs.`)
        return
      }

      if (json.success) {
        window.location.href = "/admin"
      } else {
        setError(json.error ?? "Invalid credentials.")
      }
    } catch (err: unknown) {
      clearTimeout(timeout)
      if (err instanceof Error && err.name === "AbortError") {
        setError("Request timed out. The server may be starting up — please try again.")
      } else {
        setError("Network error. Make sure the server is running.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;600;700;800&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes gridPan { from { background-position: 0 0; } to { background-position: 80px 80px; } }
        .al-card { animation: fadeUp .5s cubic-bezier(.16,1,.3,1) both; }
        .al-input:focus { border-color: #e5202e !important; outline: none; }
        .al-btn:not(:disabled):hover { background: #c81820 !important; transform: translateY(-1px); }
        .al-btn:active { transform: translateY(0) !important; }
        .al-back:hover { color: #888 !important; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#050505",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Barlow', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Subtle grid background */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }} />

        {/* Red glow */}
        <div style={{
          position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(229,32,46,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div className="al-card" style={{ width: "100%", maxWidth: 400, padding: "0 1.5rem", position: "relative", zIndex: 1 }}>

          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: "3rem",
              letterSpacing: 8, color: "#f5f5f5", lineHeight: 1,
            }}>
              <span style={{ color: "#e5202e" }}>TRIDENT</span>
            </div>
            <div style={{
              marginTop: ".5rem", fontSize: ".7rem", fontWeight: 700,
              letterSpacing: 5, color: "#2a2a2a", textTransform: "uppercase",
            }}>
              Admin Portal
            </div>
          </div>

          {/* Card */}
          <div style={{
            background: "#0a0a0a",
            border: "1px solid #1a1a1a",
            padding: "2.5rem",
          }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{
                display: "block", fontSize: ".68rem", fontWeight: 700,
                letterSpacing: 2.5, textTransform: "uppercase", color: "#444",
                marginBottom: ".6rem",
              }}>
                Username
              </label>
              <input
                className="al-input"
                style={{
                  width: "100%", background: "#0d0d0d",
                  border: "1px solid #222", color: "#f5f5f5",
                  padding: ".85rem 1rem", fontFamily: "'Barlow', sans-serif",
                  fontSize: ".9rem", transition: "border-color .2s",
                }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                autoComplete="username"
                spellCheck={false}
              />
            </div>

            <div style={{ marginBottom: "2rem" }}>
              <label style={{
                display: "block", fontSize: ".68rem", fontWeight: 700,
                letterSpacing: 2.5, textTransform: "uppercase", color: "#444",
                marginBottom: ".6rem",
              }}>
                Password
              </label>
              <input
                className="al-input"
                style={{
                  width: "100%", background: "#0d0d0d",
                  border: "1px solid #222", color: "#f5f5f5",
                  padding: ".85rem 1rem", fontFamily: "'Barlow', sans-serif",
                  fontSize: ".9rem", transition: "border-color .2s",
                }}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={{
                background: "rgba(229,32,46,.08)", borderLeft: "2px solid #e5202e",
                padding: ".75rem 1rem", fontSize: ".82rem", color: "#e5202e",
                marginBottom: "1.5rem", letterSpacing: .3,
              }}>
                {error}
              </div>
            )}

            <button
              className="al-btn"
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: "100%", background: loading ? "#1a1a1a" : "#e5202e",
                color: loading ? "#444" : "#fff", border: "none",
                padding: "1rem", fontFamily: "'Barlow', sans-serif",
                fontWeight: 800, fontSize: ".82rem", letterSpacing: 3,
                textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer",
                transition: "all .2s",
              }}
            >
              {loading ? "VERIFYING…" : "ACCESS PORTAL →"}
            </button>
          </div>

          {/* Back link */}
          <div style={{ textAlign: "center", marginTop: "1.75rem" }}>
            <Link
              href="/"
              className="al-back"
              style={{
                fontSize: ".7rem", color: "#2a2a2a", textDecoration: "none",
                letterSpacing: 2, textTransform: "uppercase", fontWeight: 700,
                transition: "color .2s",
              }}
            >
              ← Back to Store
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
