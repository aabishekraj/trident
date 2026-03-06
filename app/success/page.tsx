"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"

function SuccessContent() {
  const params  = useSearchParams()
  const orderId = params.get("orderId") || ""

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Barlow', sans-serif", padding: "2rem" }}>
      <div style={{ textAlign: "center", maxWidth: 520 }}>
        {/* Animated checkmark */}
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(34,197,94,.12)", border: "2px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 2rem", fontSize: "2.5rem" }}>
          ✓
        </div>

        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "3.5rem", letterSpacing: 3, marginBottom: ".5rem" }}>
          PAYMENT <span style={{ color: "#22c55e" }}>CONFIRMED</span>
        </h1>

        {orderId && (
          <div style={{ display: "inline-block", background: "rgba(229,32,46,.1)", border: "1px solid rgba(229,32,46,.3)", padding: ".5rem 1.5rem", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.1rem", letterSpacing: 3, color: "#e5202e", marginBottom: "1.5rem" }}>
            {orderId}
          </div>
        )}

        <p style={{ color: "#555", lineHeight: 1.8, marginBottom: "2.5rem", fontSize: ".95rem" }}>
          Your order has been confirmed and is being processed.<br />
          A confirmation email has been sent to your inbox.<br />
          <span style={{ color: "#888" }}>Estimated delivery: 3–7 business days</span>
        </p>

        <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", padding: "1.5rem", marginBottom: "2.5rem", textAlign: "left" }}>
          <div style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "#333", marginBottom: "1rem" }}>What happens next?</div>
          {[
            ["📧", "Confirmation email sent", "Check your inbox for your order details"],
            ["📦", "Order processing", "We're preparing your items (1-2 business days)"],
            ["🚚", "Shipped", "You'll receive a tracking email once dispatched"],
            ["🎉", "Delivered", "Enjoy your TRIDENT gear!"],
          ].map(([icon, title, desc]) => (
            <div key={title} style={{ display: "flex", gap: "1rem", marginBottom: ".75rem", alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.1rem", width: 28, flexShrink: 0 }}>{icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: ".85rem", color: "#f5f5f5" }}>{title}</div>
                <div style={{ color: "#555", fontSize: ".78rem", marginTop: ".15rem" }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/account/orders" style={{ background: "#e5202e", color: "#fff", padding: ".85rem 2rem", fontWeight: 800, fontSize: ".78rem", letterSpacing: 2, textTransform: "uppercase", textDecoration: "none" }}>
            TRACK ORDER
          </Link>
          <Link href="/" style={{ border: "1px solid #222", color: "#888", padding: ".85rem 2rem", fontWeight: 700, fontSize: ".78rem", letterSpacing: 2, textTransform: "uppercase", textDecoration: "none" }}>
            CONTINUE SHOPPING
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", color: "#f5f5f5", fontFamily: "'Barlow', sans-serif" }}>
        Processing…
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
