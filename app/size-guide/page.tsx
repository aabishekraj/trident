"use client"

import Link from "next/link"
import { useState } from "react"

const TOPS = [
  { size: "XS", chest: "32-34",  waist: "26-28",  height: "5'3–5'5"  },
  { size: "S",  chest: "35-37",  waist: "29-31",  height: "5'5–5'7"  },
  { size: "M",  chest: "38-40",  waist: "32-34",  height: "5'7–5'9"  },
  { size: "L",  chest: "41-43",  waist: "35-37",  height: "5'9–5'11" },
  { size: "XL", chest: "44-47",  waist: "38-40",  height: "5'11–6'1" },
  { size: "2XL",chest: "48-51",  waist: "41-44",  height: "6'1–6'3"  },
  { size: "3XL",chest: "52-55",  waist: "45-48",  height: "6'3–6'5"  },
]

const BOTTOMS = [
  { size: "XS", waist: "26-28",  hip: "34-36",  inseam: "28-30" },
  { size: "S",  waist: "29-31",  hip: "37-39",  inseam: "30-31" },
  { size: "M",  waist: "32-34",  hip: "40-42",  inseam: "31-32" },
  { size: "L",  waist: "35-37",  hip: "43-45",  inseam: "32-33" },
  { size: "XL", waist: "38-40",  hip: "46-48",  inseam: "33-34" },
  { size: "2XL",waist: "41-44",  hip: "49-52",  inseam: "33-34" },
  { size: "3XL",waist: "45-48",  hip: "53-56",  inseam: "33-34" },
]

const FOOTWEAR = [
  { size: "UK 5",  eu: "38",  us: "6",   cm: "24.0" },
  { size: "UK 6",  eu: "39",  us: "7",   cm: "25.0" },
  { size: "UK 7",  eu: "41",  us: "8",   cm: "26.0" },
  { size: "UK 8",  eu: "42",  us: "9",   cm: "27.0" },
  { size: "UK 9",  eu: "43",  us: "10",  cm: "28.0" },
  { size: "UK 10", eu: "44",  us: "11",  cm: "29.0" },
  { size: "UK 11", eu: "46",  us: "12",  cm: "30.0" },
  { size: "UK 12", eu: "47",  us: "13",  cm: "31.0" },
]

type Tab = "tops" | "bottoms" | "footwear"

const TH: React.CSSProperties = { fontSize: ".6rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#555", padding: ".75rem 1.25rem", textAlign: "left", borderBottom: "1px solid #1e1e1e", background: "#080808" }
const TD: React.CSSProperties = { fontSize: ".85rem", color: "#888", padding: ".75rem 1.25rem", borderBottom: "1px solid #111" }
const TDS: React.CSSProperties = { ...TD, color: "#f5f5f5", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1rem", letterSpacing: 1 }

export default function SizeGuidePage() {
  const [tab, setTab] = useState<Tab>("tops")
  const [unit, setUnit] = useState<"in" | "cm">("in")

  function conv(val: string): string {
    if (unit === "in") return val + " in"
    const parts = val.split("-")
    if (parts.length === 2) {
      return `${Math.round(+parts[0] * 2.54)}–${Math.round(+parts[1] * 2.54)} cm`
    }
    return val
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f5f5f5", fontFamily: "'Barlow', sans-serif" }}>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1e1e1e", padding: "2.5rem 2rem 2rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 3, color: "#555", marginBottom: "1rem" }}>
            <Link href="/" style={{ color: "#555", textDecoration: "none" }}>Home</Link> / Size Guide
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2.5rem,6vw,4rem)", letterSpacing: 2, marginBottom: ".5rem" }}>
            SIZE <span style={{ color: "#e5202e" }}>GUIDE</span>
          </h1>
          <p style={{ color: "#666", fontSize: ".9rem", lineHeight: 1.65, maxWidth: 540 }}>
            All measurements are in inches unless otherwise specified. For the best fit, measure yourself and compare with the chart below.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2.5rem 2rem 5rem" }}>

        {/* How to measure */}
        <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderLeft: "3px solid #e5202e", padding: "1.25rem 1.5rem", marginBottom: "2.5rem" }}>
          <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#e5202e", marginBottom: ".75rem" }}>HOW TO MEASURE</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "1rem" }}>
            {[
              ["Chest", "Measure around the fullest part of your chest, keeping the tape level."],
              ["Waist", "Measure around your natural waistline, just above your hip bones."],
              ["Hip",   "Measure around the fullest part of your hips and seat."],
              ["Inseam","From the crotch seam to the bottom of your leg."],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontWeight: 700, fontSize: ".78rem", marginBottom: ".25rem" }}>{k}</div>
                <div style={{ color: "#555", fontSize: ".75rem", lineHeight: 1.55 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs + unit toggle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "1px", background: "#1e1e1e" }}>
            {(["tops","bottoms","footwear"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ background: tab === t ? "#e5202e" : "#0d0d0d", color: tab === t ? "#fff" : "#555", border: "none", padding: ".65rem 1.5rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".72rem", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer" }}>
                {t}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "1px", background: "#1e1e1e" }}>
            {(["in","cm"] as ("in" | "cm")[]).map(u => (
              <button key={u} onClick={() => setUnit(u)}
                style={{ background: unit === u ? "#f5f5f5" : "#0d0d0d", color: unit === u ? "#0a0a0a" : "#555", border: "none", padding: ".5rem 1rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".72rem", letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }}>
                {u}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto", background: "#0d0d0d", border: "1px solid #1e1e1e" }}>
          {tab === "tops" && (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={TH}>Size</th>
                  <th style={TH}>Chest</th>
                  <th style={TH}>Waist</th>
                  <th style={TH}>Height</th>
                </tr>
              </thead>
              <tbody>
                {TOPS.map(r => (
                  <tr key={r.size} onMouseEnter={e => (e.currentTarget.style.background = "#111")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td style={TDS}>{r.size}</td>
                    <td style={TD}>{conv(r.chest)}</td>
                    <td style={TD}>{conv(r.waist)}</td>
                    <td style={TD}>{r.height}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === "bottoms" && (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={TH}>Size</th>
                  <th style={TH}>Waist</th>
                  <th style={TH}>Hip</th>
                  <th style={TH}>Inseam</th>
                </tr>
              </thead>
              <tbody>
                {BOTTOMS.map(r => (
                  <tr key={r.size} onMouseEnter={e => (e.currentTarget.style.background = "#111")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td style={TDS}>{r.size}</td>
                    <td style={TD}>{conv(r.waist)}</td>
                    <td style={TD}>{conv(r.hip)}</td>
                    <td style={TD}>{conv(r.inseam)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === "footwear" && (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={TH}>UK</th>
                  <th style={TH}>EU</th>
                  <th style={TH}>US</th>
                  <th style={TH}>Length (cm)</th>
                </tr>
              </thead>
              <tbody>
                {FOOTWEAR.map(r => (
                  <tr key={r.size} onMouseEnter={e => (e.currentTarget.style.background = "#111")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td style={TDS}>{r.size}</td>
                    <td style={TD}>{r.eu}</td>
                    <td style={TD}>{r.us}</td>
                    <td style={TD}>{r.cm} cm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p style={{ color: "#444", fontSize: ".78rem", lineHeight: 1.65, marginTop: "1.25rem" }}>
          * Sizes may vary slightly between different product lines. When in doubt, size up. All TRIDENT products are designed for an athletic fit.
        </p>

        {/* CTA */}
        <div style={{ marginTop: "3rem", background: "#0d0d0d", border: "1px solid #1e1e1e", padding: "2rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1.5rem" }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.3rem", letterSpacing: 2, marginBottom: ".35rem" }}>STILL NOT SURE?</div>
            <div style={{ color: "#555", fontSize: ".82rem" }}>Our support team can help you find the perfect fit.</div>
          </div>
          <Link href="/support" style={{ background: "#e5202e", color: "#fff", padding: ".75rem 2rem", fontWeight: 800, fontSize: ".78rem", letterSpacing: 2, textTransform: "uppercase", textDecoration: "none" }}>
            CONTACT SUPPORT →
          </Link>
        </div>
      </div>
    </div>
  )
}
