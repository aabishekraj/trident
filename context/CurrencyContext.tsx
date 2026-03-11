"use client"

import { createContext, useContext, useEffect, useState } from "react"

export type Currency = "USD" | "INR" | "EUR"

export type ShippingCountryRate = { country: string; rate: number }

export type StoreConfig = {
  currency: Currency
  shippingFreeThreshold: number
  shippingFlatRate: number
  shippingCountryRates: ShippingCountryRate[]
  taxRate: number
}

const SYMBOLS: Record<Currency, string> = { USD: "$", INR: "₹", EUR: "€" }

// Payment methods that are native to each currency
// UPI and COD are INR-only; card works everywhere
const NATIVE_PAYMENTS: Record<Currency, string[]> = {
  USD: ["card"],
  INR: ["card", "upi", "cod"],
  EUR: ["card"],
}

const DEFAULT: StoreConfig = {
  currency: "USD",
  shippingFreeThreshold: 500,
  shippingFlatRate: 49,
  shippingCountryRates: [],
  taxRate: 18,
}

type CurrencyCtx = StoreConfig & {
  symbol: string
  fmt: (n: number) => string
  getShipping: (subtotal: number, country?: string) => number
  mismatch: (paymentMethod: string) => string | null
}

const CurrencyContext = createContext<CurrencyCtx>({
  ...DEFAULT,
  symbol: "$",
  fmt: n => `$${n.toFixed(2)}`,
  getShipping: s => (s >= 500 ? 0 : 49),
  mismatch: () => null,
})

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [cfg, setCfg] = useState<StoreConfig>(DEFAULT)

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          const { currency, shippingFreeThreshold, shippingFlatRate, shippingCountryRates, taxRate } = d.data
          setCfg(prev => ({
            currency:             currency             ?? prev.currency,
            shippingFreeThreshold: shippingFreeThreshold ?? prev.shippingFreeThreshold,
            shippingFlatRate:     shippingFlatRate     ?? prev.shippingFlatRate,
            shippingCountryRates: shippingCountryRates ?? prev.shippingCountryRates,
            taxRate:              taxRate              ?? prev.taxRate,
          }))
        }
      })
      .catch(() => {})
  }, [])

  const symbol = SYMBOLS[cfg.currency]
  const fmt = (n: number) => `${symbol}${n.toFixed(2)}`

  const getShipping = (subtotal: number, country?: string): number => {
    if (country) {
      const r = cfg.shippingCountryRates.find(
        x => x.country.toLowerCase() === country.toLowerCase()
      )
      if (r !== undefined) return r.rate
    }
    return subtotal >= cfg.shippingFreeThreshold ? 0 : cfg.shippingFlatRate
  }

  const mismatch = (pm: string): string | null => {
    const allowed = NATIVE_PAYMENTS[cfg.currency]
    if (!allowed.includes(pm)) {
      const pmLabels: Record<string, string> = { upi: "UPI", cod: "Cash on Delivery", card: "Card" }
      return `Currency mismatch: Store is set to ${cfg.currency} but ${pmLabels[pm] ?? pm} is only available for INR orders. Please use Card payment or ask the admin to change the store currency to INR.`
    }
    return null
  }

  return (
    <CurrencyContext.Provider value={{ ...cfg, symbol, fmt, getShipping, mismatch }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => useContext(CurrencyContext)
