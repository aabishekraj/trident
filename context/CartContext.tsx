"use client"

import { createContext, useContext, useState, useEffect } from "react"

type CartItem = {
  id: string
  name: string
  price: number
  image?: string
  quantity: number
}

type CartContextType = {
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (id: string) => void
  increaseQty: (id: string) => void
  decreaseQty: (id: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {

  const [cart, setCart] = useState<CartItem[]>([])

  // load cart from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("cart")
    if (stored) {
      setCart(JSON.parse(stored))
    }
  }, [])

  // save cart to localStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart))
  }, [cart])

  const addToCart = (item: CartItem) => {

    setCart(prev => {

      const existing = prev.find(p => p.id === item.id)

      if (existing) {
        return prev.map(p =>
          p.id === item.id
            ? { ...p, quantity: p.quantity + 1 }
            : p
        )
      }

      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const increaseQty = (id: string) => {
    setCart(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    )
  }

  const decreaseQty = (id: string) => {
    setCart(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item
      )
    )
  }

  const clearCart = () => {
    setCart([])
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        increaseQty,
        decreaseQty,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {

  const context = useContext(CartContext)

  if (!context) {
    throw new Error("useCart must be used inside CartProvider")
  }

  return context
}