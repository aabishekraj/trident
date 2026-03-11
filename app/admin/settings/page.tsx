"use client"

import { useEffect, useState } from "react"

export default function AdminSettingsPage() {
  const [messages, setMessages]   = useState<string[]>([])
  const [newMsg,   setNewMsg]     = useState("")
  const [saving,   setSaving]     = useState(false)
  const [feedback, setFeedback]   = useState("")
  const [loading,  setLoading]    = useState(true)

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then(d => { if (d.success) setMessages(d.data.promoBannerMessages || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function addMessage() {
    const t = newMsg.trim()
    if (!t || messages.length >= 20) return
    setMessages(prev => [...prev, t])
    setNewMsg("")
    setFeedback("")
  }

  function removeMessage(i: number) {
    setMessages(prev => prev.filter((_, idx) => idx !== i))
  }

  function moveUp(i: number) {
    if (i === 0) return
    setMessages(prev => {
      const next = [...prev]
      ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
      return next
    })
  }

  function moveDown(i: number) {
    if (i === messages.length - 1) return
    setMessages(prev => {
      const next = [...prev]
      ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
      return next
    })
  }

  async function saveSettings() {
    setSaving(true)
    setFeedback("")
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoBannerMessages: messages }),
      })
      const d = await res.json()
      if (d.success) {
        setFeedback("✓ Settings saved successfully.")
      } else {
        setFeedback(`Error: ${d.error || "Failed to save."}`)
      }
    } catch {
      setFeedback("Network error. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ color: "#555", padding: "3rem", textAlign: "center" }}>Loading…</div>
  )

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", letterSpacing: 3, marginBottom: ".3rem" }}>
          SITE SETTINGS
        </h1>
        <p style={{ color: "#555", fontSize: ".85rem" }}>Manage your storefront promotional banner messages.</p>
      </div>

      {/* Promo Banner Editor */}
      <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", padding: "1.75rem", maxWidth: 720 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <span style={{ fontSize: "1.1rem" }}>📢</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: ".9rem", letterSpacing: 1 }}>PROMO BANNER MESSAGES</div>
            <div style={{ color: "#555", fontSize: ".78rem", marginTop: ".2rem" }}>These messages scroll across the red banner at the top of the storefront. Max 20 messages, 200 chars each.</div>
          </div>
        </div>

        {/* Current messages list */}
        <div style={{ marginBottom: "1.5rem" }}>
          {messages.length === 0 ? (
            <div style={{ color: "#444", fontSize: ".82rem", padding: "1.5rem", textAlign: "center", border: "1px dashed #222" }}>
              No messages. Add one below.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: ".5rem", background: "#111", border: "1px solid #1e1e1e", padding: ".65rem 1rem" }}>
                  {/* Order controls */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", flexShrink: 0 }}>
                    <button onClick={() => moveUp(i)} disabled={i === 0}
                      style={{ background: "none", border: "none", color: i === 0 ? "#222" : "#555", cursor: i === 0 ? "default" : "pointer", fontSize: ".7rem", lineHeight: 1, padding: "1px 3px" }}>▲</button>
                    <button onClick={() => moveDown(i)} disabled={i === messages.length - 1}
                      style={{ background: "none", border: "none", color: i === messages.length - 1 ? "#222" : "#555", cursor: i === messages.length - 1 ? "default" : "pointer", fontSize: ".7rem", lineHeight: 1, padding: "1px 3px" }}>▼</button>
                  </div>
                  <span style={{ flex: 1, fontSize: ".82rem", color: "#c8c8c8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg}</span>
                  <button onClick={() => removeMessage(i)}
                    style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: ".85rem", flexShrink: 0, transition: "color .15s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#e5202e")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#555")}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add new message */}
        <div style={{ display: "flex", gap: ".5rem", marginBottom: "1.5rem" }}>
          <input
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addMessage()}
            placeholder="Type a new message… e.g. 🔥 SALE UP TO 40% OFF"
            maxLength={200}
            style={{
              flex: 1, background: "#0a0a0a", border: "1px solid #1e1e1e",
              color: "#f5f5f5", fontFamily: "'Barlow', sans-serif",
              fontSize: ".85rem", padding: ".7rem 1rem", outline: "none",
            }}
          />
          <button onClick={addMessage} disabled={!newMsg.trim() || messages.length >= 20}
            style={{
              background: (!newMsg.trim() || messages.length >= 20) ? "#1e1e1e" : "#e5202e",
              color:      (!newMsg.trim() || messages.length >= 20) ? "#444"    : "#fff",
              border: "none", padding: ".7rem 1.25rem",
              fontFamily: "'Barlow', sans-serif", fontWeight: 800,
              fontSize: ".75rem", letterSpacing: 1.5, textTransform: "uppercase",
              cursor: (!newMsg.trim() || messages.length >= 20) ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
            }}>
            + ADD
          </button>
        </div>

        {/* Save */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button onClick={saveSettings} disabled={saving}
            style={{
              background: saving ? "#1e1e1e" : "#f5f5f5",
              color:      saving ? "#555"    : "#0a0a0a",
              border: "none", padding: ".8rem 2.5rem",
              fontFamily: "'Barlow', sans-serif", fontWeight: 800,
              fontSize: ".8rem", letterSpacing: 2, textTransform: "uppercase",
              cursor: saving ? "not-allowed" : "pointer", transition: "all .2s",
            }}
            onMouseEnter={e => { if (!saving) { (e.currentTarget as HTMLElement).style.background = "#e5202e"; (e.currentTarget as HTMLElement).style.color = "#fff" } }}
            onMouseLeave={e => { if (!saving) { (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; (e.currentTarget as HTMLElement).style.color = "#0a0a0a" } }}>
            {saving ? "SAVING…" : "SAVE SETTINGS"}
          </button>
          {feedback && (
            <span style={{ fontSize: ".82rem", fontWeight: 600, color: feedback.startsWith("✓") ? "#22c55e" : "#e5202e" }}>
              {feedback}
            </span>
          )}
        </div>
      </div>

      {/* Preview */}
      {messages.length > 0 && (
        <div style={{ marginTop: "2rem", maxWidth: 720 }}>
          <div style={{ fontWeight: 800, fontSize: ".75rem", letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: ".75rem" }}>BANNER PREVIEW</div>
          <div style={{ background: "#e5202e", color: "#fff", height: 36, overflow: "hidden", display: "flex", alignItems: "center", position: "relative" }}>
            <div style={{ display: "flex", animation: "ticker 28s linear infinite", whiteSpace: "nowrap", willChange: "transform" }}>
              {[...messages, ...messages].map((msg, i) => (
                <span key={i} style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", padding: "0 3rem" }}>{msg}</span>
              ))}
            </div>
            <style>{`@keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
          </div>
        </div>
      )}
    </div>
  )
}
