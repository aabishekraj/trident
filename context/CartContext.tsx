"use client"

import { createContext, useContext, useState, useEffect } from "react"

export type CartItem = {
  id: string
  name: string
  price: number
  image?: string
  quantity: number
  size?: string
  couponDiscount?: number
  couponCode?: string
}

type CartContextType = {
  cart: CartItem[]
  addToCart: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void
  removeFromCart: (id: string, size?: string) => void
  increaseQty: (id: string, size?: string) => void
  decreaseQty: (id: string, size?: string) => void
  clearCart: () => void
  applyCoupon: (code: string, discount: number) => void
  cartCount: number
  openCart: () => void
  closeCart: () => void
  cartOpen: boolean
}

const CartContext = createContext<CartContextType | null>(null)

function itemKey(id: string, size?: string) {
  return id + (size || "")
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart]         = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("trident_cart_v2")
      if (stored) setCart(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  // Persist to localStorage AND sync to sessionStorage (checkout format)
  useEffect(() => {
    localStorage.setItem("trident_cart_v2", JSON.stringify(cart))
    // Sync to sessionStorage in checkout-compatible format
    const checkoutCart = cart.map(item => ({
      _id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      qty: item.quantity,
      selectedSize: item.size,
      couponDiscount: item.couponDiscount,
      couponCode: item.couponCode,
    }))
    try { sessionStorage.setItem("trident_cart", JSON.stringify(checkoutCart)) } catch { /* ignore */ }
  }, [cart])

  const addToCart = (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setCart(prev => {
      const key = itemKey(item.id, item.size)
      const existing = prev.find(p => itemKey(p.id, p.size) === key)
      if (existing) {
        return prev.map(p =>
          itemKey(p.id, p.size) === key
            ? { ...p, quantity: p.quantity + (item.quantity ?? 1) }
            : p
        )
      }
      return [...prev, { ...item, quantity: item.quantity ?? 1 }]
    })
  }

  const removeFromCart = (id: string, size?: string) => {
    const key = itemKey(id, size)
    setCart(prev => prev.filter(item => itemKey(item.id, item.size) !== key))
  }

  const increaseQty = (id: string, size?: string) => {
    const key = itemKey(id, size)
    setCart(prev =>
      prev.map(item =>
        itemKey(item.id, item.size) === key
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    )
  }

  const decreaseQty = (id: string, size?: string) => {
    const key = itemKey(id, size)
    setCart(prev =>
      prev.map(item =>
        itemKey(item.id, item.size) === key
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item
      )
    )
  }

  const clearCart = () => setCart([])

  const applyCoupon = (code: string, discount: number) => {
    setCart(prev => prev.map(item => ({ ...item, couponCode: code, couponDiscount: discount })))
  }

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, increaseQty, decreaseQty, clearCart, applyCoupon,
      cartCount, openCart: () => setCartOpen(true), closeCart: () => setCartOpen(false), cartOpen,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart must be used inside CartProvider")
  return context
}
