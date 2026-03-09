"use client"

import { useState } from "react"
import Link from "next/link"

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleLogin() {
    if (!username || !password) return setError("Enter both username and password.");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (json.success) {
        // Hard navigation ensures the session cookie is sent with the next request
        window.location.href = "/admin";
      } else {
        setError(json.error ?? "Invalid credentials.");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const inp: React.CSSProperties = {
    width: "100%", background: "#0d0d0d", border: "1px solid #333",
    color: "#f5f5f5", padding: ".8rem 1rem",
    fontFamily: "'Barlow', sans-serif", fontSize: ".9rem", outline: "none",
  };

  return (
    <div
      style={{
        minHeight: "100vh", background: "#0a0a0a", display: "flex",
        alignItems: "center", justifyContent: "center",
        fontFamily: "'Barlow', sans-serif",
      }}
    >
      <div style={{ width: 380 }}>
        {/* Logo */}
        <div
          style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.5rem",
            letterSpacing: 6, color: "#f5f5f5", textAlign: "center",
            marginBottom: ".5rem",
          }}
        >
          <span style={{ color: "#e5202e" }}>TRIDENT</span>
        </div>
        <div
          style={{
            textAlign: "center", fontSize: ".78rem", fontWeight: 700,
            letterSpacing: 4, color: "#888", textTransform: "uppercase",
            marginBottom: "3rem",
          }}
        >
          Admin Portal
        </div>

        {/* Card */}
        <div style={{ border: "1px solid #222", padding: "2rem" }}>
          <div style={{ marginBottom: "1.2rem" }}>
            <label style={{ display: "block", fontSize: ".72rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#888", marginBottom: ".5rem" }}>
              Username
            </label>
            <input
              style={inp}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: ".72rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#888", marginBottom: ".5rem" }}>
              Password
            </label>
            <input
              style={inp}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          {error && (
            <div
              style={{
                background: "rgba(229,32,46,.12)", borderLeft: "2px solid #e5202e",
                padding: ".75rem 1rem", fontSize: ".82rem", color: "#e5202e",
                marginBottom: "1.2rem",
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%", background: loading ? "#555" : "#e5202e",
              color: "#fff", border: "none", padding: ".9rem",
              fontFamily: "'Barlow', sans-serif", fontWeight: 800,
              fontSize: ".85rem", letterSpacing: 2, textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "SIGNING IN…" : "SIGN IN →"}
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: ".78rem", color: "#444" }}>
          Default: <code style={{ color: "#666" }}>admin</code> / <code style={{ color: "#666" }}>trident2026</code> — change in <code style={{ color: "#666" }}>.env.local</code>
        </div>

        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <Link href="/" style={{ fontSize: ".75rem", color: "#444", textDecoration: "none", letterSpacing: 1, textTransform: "uppercase", fontWeight: 700, transition: "color .2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#888")}
            onMouseLeave={e => (e.currentTarget.style.color = "#444")}
          >
            ← Back to Store
          </Link>
        </div>
      </div>
    </div>
  )
}
