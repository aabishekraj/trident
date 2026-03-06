"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const INP: React.CSSProperties = {
  width: "100%", background: "#0d0d0d", border: "1px solid #1e1e1e",
  color: "#f5f5f5", padding: ".85rem 1rem",
  fontFamily: "'Barlow', sans-serif", fontSize: ".92rem", outline: "none",
  transition: "border-color .2s",
}
const LABEL: React.CSSProperties = {
  display: "block", fontSize: ".7rem", fontWeight: 700,
  letterSpacing: 2, textTransform: "uppercase", color: "#666", marginBottom: ".5rem",
}

export default function SignInPage() {
  const router = useRouter()
  const [mode, setMode]     = useState<"signin" | "register">("signin")
  const [step, setStep]     = useState<"email" | "verify">("email")
  const [email, setEmail]   = useState("")
  const [name, setName]     = useState("")
  const [otp, setOtp]       = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState("")
  const [sentOtp, setSentOtp] = useState("") // In production, this comes from the server

  async function sendOtp() {
    if (!email) return setError("Please enter your email.")
    if (mode === "register" && !name) return setError("Please enter your name.")
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/auth/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, action: "sendOtp" }),
      })
      const j = await res.json()
      if (j.success) {
        // In dev mode, OTP returned in response for testing
        if (j.devOtp) setSentOtp(j.devOtp)
        setStep("verify")
      } else {
        setError(j.error || "Failed to send OTP.")
      }
    } catch {
      // Fallback for demo: generate local OTP
      const localOtp = Math.floor(100000 + Math.random() * 900000).toString()
      setSentOtp(localOtp)
      setStep("verify")
      console.log("Demo OTP:", localOtp)
    }
    setLoading(false)
  }

  async function verifyOtp() {
    if (!otp) return setError("Enter the OTP sent to your email.")
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/auth/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, otp, expectedOtp: sentOtp, action: "verifyOtp" }),
      })
      const j = await res.json()
      if (j.success) {
        localStorage.setItem("trident_customer", JSON.stringify(j.data))
        router.push("/")
      } else {
        setError(j.error || "Invalid OTP.")
      }
    } catch {
      // Demo fallback
      if (otp === sentOtp) {
        const customer = { name: name || email.split("@")[0], email, token: "demo_" + Date.now() }
        localStorage.setItem("trident_customer", JSON.stringify(customer))
        router.push("/")
      } else {
        setError("Incorrect OTP. Please try again.")
      }
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f5f5f5", display: "flex", fontFamily: "'Barlow', sans-serif" }}>

      {/* Left panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          <Link href="/" style={{ display: "block", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", letterSpacing: 4, color: "#f5f5f5", textDecoration: "none", marginBottom: "3rem" }}>TRIDENT</Link>

          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.5rem", letterSpacing: 2, marginBottom: ".5rem" }}>
            {mode === "signin" ? "WELCOME BACK" : "CREATE ACCOUNT"}
          </h1>
          <p style={{ color: "#555", fontSize: ".88rem", marginBottom: "2.5rem", lineHeight: 1.6 }}>
            {step === "email"
              ? mode === "signin" ? "Sign in to track orders, save favourites & more." : "Join TRIDENT for exclusive access & faster checkout."
              : `We've sent a 6-digit code to ${email}`}
          </p>

          {/* Mode toggle */}
          {step === "email" && (
            <div style={{ display: "flex", background: "#0d0d0d", border: "1px solid #1e1e1e", marginBottom: "2rem" }}>
              {[["signin","SIGN IN"],["register","REGISTER"]].map(([m, l]) => (
                <button key={m} onClick={() => { setMode(m as "signin"|"register"); setError("") }}
                  style={{ flex: 1, padding: ".7rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".78rem", letterSpacing: 2, textTransform: "uppercase", border: "none", background: mode === m ? "#e5202e" : "transparent", color: mode === m ? "#fff" : "#555", cursor: "pointer", transition: "all .2s" }}>
                  {l}
                </button>
              ))}
            </div>
          )}

          {/* Form */}
          {step === "email" ? (
            <div>
              {mode === "register" && (
                <div style={{ marginBottom: "1rem" }}>
                  <label style={LABEL}>Full Name</label>
                  <input style={INP} placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} onFocus={e => (e.target.style.borderColor = "#333")} onBlur={e => (e.target.style.borderColor = "#1e1e1e")} />
                </div>
              )}
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={LABEL}>Email Address</label>
                <input style={INP} type="email" placeholder="john@email.com" value={email} onChange={e => setEmail(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = "#333")} onBlur={e => (e.target.style.borderColor = "#1e1e1e")}
                  onKeyDown={e => e.key === "Enter" && sendOtp()} />
              </div>
              {error && <div style={{ color: "#e5202e", fontSize: ".82rem", fontWeight: 600, marginBottom: "1rem" }}>{error}</div>}
              <button onClick={sendOtp} disabled={loading}
                style={{ width: "100%", background: loading ? "#333" : "#e5202e", color: "#fff", border: "none", padding: "1rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".85rem", letterSpacing: 2, textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "SENDING…" : "SEND OTP →"}
              </button>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={LABEL}>Enter OTP</label>
                <input style={{ ...INP, fontSize: "1.5rem", letterSpacing: "1rem", textAlign: "center", fontFamily: "'Bebas Neue', sans-serif" }}
                  placeholder="------" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={e => e.key === "Enter" && verifyOtp()}
                />
                {sentOtp && (
                  <p style={{ color: "#555", fontSize: ".72rem", marginTop: ".5rem", textAlign: "center" }}>
                    Demo mode — OTP: <strong style={{ color: "#eab308" }}>{sentOtp}</strong>
                  </p>
                )}
              </div>
              {error && <div style={{ color: "#e5202e", fontSize: ".82rem", fontWeight: 600, marginBottom: "1rem" }}>{error}</div>}
              <button onClick={verifyOtp} disabled={loading}
                style={{ width: "100%", background: loading ? "#333" : "#e5202e", color: "#fff", border: "none", padding: "1rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".85rem", letterSpacing: 2, textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", marginBottom: ".75rem" }}>
                {loading ? "VERIFYING…" : "VERIFY & SIGN IN →"}
              </button>
              <button onClick={() => { setStep("email"); setOtp(""); setError("") }}
                style={{ width: "100%", background: "transparent", color: "#666", border: "1px solid #1e1e1e", padding: ".75rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".78rem", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer" }}>
                ← CHANGE EMAIL
              </button>
            </div>
          )}

          <div style={{ marginTop: "2rem", borderTop: "1px solid #141414", paddingTop: "1.5rem" }}>
            <p style={{ color: "#444", fontSize: ".78rem", lineHeight: 1.6 }}>
              By continuing, you agree to our{" "}
              <a href="#" style={{ color: "#888", textDecoration: "underline" }}>Terms of Service</a>
              {" "}and{" "}
              <a href="#" style={{ color: "#888", textDecoration: "underline" }}>Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — visual */}
      <div style={{ width: 480, background: "#0d0d0d", borderLeft: "1px solid #1e1e1e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(255,255,255,.02) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,.02) 40px)" }} />
        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "5rem", letterSpacing: -2, lineHeight: .9, marginBottom: "2rem", color: "#1a1a1a" }}>TRIDENT</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {[
              ["📦", "Track every order in real-time"],
              ["🏷️", "Exclusive member discounts & early access"],
              ["⚡", "One-click checkout with saved addresses"],
              ["🎁", "Birthday rewards & loyalty points"],
            ].map(([icon, text]) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: "1rem", textAlign: "left" }}>
                <span style={{ fontSize: "1.5rem", width: 40, textAlign: "center" }}>{icon}</span>
                <span style={{ color: "#555", fontSize: ".88rem", fontWeight: 600 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
