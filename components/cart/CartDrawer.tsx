"use client"

import { useCart } from "@/context/CartContext"
import { useCurrency } from "@/context/CurrencyContext"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

function safeImg(url?: string) {
  return url && (url.startsWith("http") || url.startsWith("data:"))
    ? url : "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=60"
}

export default function CartDrawer({ open, setOpen }: { open?: boolean; setOpen?: (v: boolean) => void }) {
  const { cart, removeFromCart, increaseQty, decreaseQty, cartOpen, closeCart } = useCart()
  const { fmt, getShipping, shippingFreeThreshold } = useCurrency()
  const router = useRouter()

  const isOpen  = open !== undefined ? open : cartOpen
  const doClose = setOpen ? () => setOpen(false) : closeCart

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const shipping = getShipping(subtotal)
  const total    = +(subtotal + shipping).toFixed(2)

  function handleCheckout() {
    doClose()
    router.push("/checkout")
  }

  return (
    <>
      {isOpen && (
        <div onClick={doClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", zIndex: 1400, backdropFilter: "blur(2px)" }} />
      )}

      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 420,
        background: "#0a0a0a", borderLeft: "1px solid #1e1e1e",
        zIndex: 1500, display: "flex", flexDirection: "column",
        transform: isOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform .35s cubic-bezier(.4,0,.2,1)",
        fontFamily: "'Barlow', sans-serif",
      }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "1px solid #1e1e1e", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", letterSpacing: 3 }}>YOUR BAG</span>
            <span style={{ background: "#e5202e", color: "#fff", width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".65rem", fontWeight: 800 }}>
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          </div>
          <button onClick={doClose} style={{ background: "none", border: "none", color: "#888", fontSize: "1.25rem", cursor: "pointer", lineHeight: 1, padding: ".25rem" }}>✕</button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.5rem" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 1rem", color: "#444" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🛍</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", letterSpacing: 2, marginBottom: ".5rem", color: "#555" }}>YOUR BAG IS EMPTY</div>
              <p style={{ fontSize: ".82rem", color: "#444", marginBottom: "1.5rem", lineHeight: 1.6 }}>Add something legendary to your bag.</p>
              <button onClick={doClose}
                style={{ background: "transparent", border: "1px solid #1e1e1e", color: "#888", padding: ".65rem 1.5rem", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: ".72rem", letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }}>
                CONTINUE SHOPPING
              </button>
            </div>
          ) : (
            <div>
              {cart.map(item => (
                <div key={item.id + (item.size || "")} style={{ display: "flex", gap: "1rem", padding: "1rem 0", borderBottom: "1px solid #111" }}>
                  <div style={{ position: "relative", width: 72, height: 72, background: "#111", flexShrink: 0, overflow: "hidden" }}>
                    <Image src={safeImg(item.image)} alt={item.name} fill style={{ objectFit: "cover" }} unoptimized />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: ".88rem", marginBottom: ".15rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                    {item.size && <div style={{ color: "#666", fontSize: ".72rem", marginBottom: ".3rem" }}>Size: {item.size}</div>}
                    <div style={{ display: "flex", alignItems: "center", gap: ".4rem", marginBottom: ".5rem" }}>
                      <span style={{ fontWeight: 800, fontSize: ".88rem" }}>{fmt(item.price)}</span>
                      {item.couponDiscount ? <span style={{ fontSize: ".72rem", color: "#e5202e", fontWeight: 700 }}>-{item.couponDiscount}%</span> : null}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                      <button onClick={() => decreaseQty(item.id, item.size)}
                        style={{ width: 26, height: 26, border: "1px solid #1e1e1e", background: "transparent", color: "#888", fontSize: ".9rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                      <span style={{ fontSize: ".85rem", fontWeight: 700, minWidth: 16, textAlign: "center" }}>{item.quantity}</span>
                      <button onClick={() => increaseQty(item.id, item.size)}
                        style={{ width: 26, height: 26, border: "1px solid #1e1e1e", background: "transparent", color: "#888", fontSize: ".9rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                      <span style={{ color: "#444", fontSize: ".72rem", marginLeft: ".25rem" }}>= {fmt(item.price * item.quantity)}</span>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.id, item.size)}
                    style={{ background: "none", border: "none", color: "#333", cursor: "pointer", fontSize: ".85rem", alignSelf: "flex-start", padding: ".25rem", flexShrink: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#e5202e")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#333")}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div style={{ borderTop: "1px solid #1e1e1e", padding: "1.25rem 1.5rem", flexShrink: 0 }}>
            {[["Subtotal", fmt(subtotal)], ["Shipping", shipping === 0 ? "FREE" : fmt(shipping)]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: ".4rem" }}>
                <span style={{ color: "#555", fontSize: ".82rem" }}>{l}</span>
                <span style={{ color: v === "FREE" ? "#22c55e" : "#f5f5f5", fontWeight: 600, fontSize: ".82rem" }}>{v}</span>
              </div>
            ))}
            {subtotal < shippingFreeThreshold && (
              <div style={{ fontSize: ".72rem", color: "#e5202e", marginBottom: ".4rem" }}>Add {fmt(shippingFreeThreshold - subtotal)} more for free shipping!</div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1rem", borderTop: "1px solid #1a1a1a", paddingTop: ".75rem", marginTop: ".4rem", marginBottom: "1rem" }}>
              <span>TOTAL</span>
              <span style={{ color: "#e5202e" }}>{fmt(total)}</span>
            </div>

            <button onClick={handleCheckout}
              style={{ width: "100%", background: "#f5f5f5", color: "#0a0a0a", border: "none", padding: ".95rem", fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: ".82rem", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", marginBottom: ".6rem", transition: "all .2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#e5202e"; (e.currentTarget as HTMLElement).style.color = "#fff" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; (e.currentTarget as HTMLElement).style.color = "#0a0a0a" }}>
              CHECKOUT →
            </button>
            <Link href="/account/wishlist" onClick={doClose}
              style={{ display: "block", textAlign: "center", color: "#555", fontSize: ".72rem", fontWeight: 700, letterSpacing: 1, textDecoration: "none" }}>
              VIEW WISHLIST →
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
