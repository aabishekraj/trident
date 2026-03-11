"use client"

import { createContext, useContext, useEffect, useState } from "react"

export type Theme = "dark" | "light"

// Color palettes for inline-styled components
export const DARK_COLORS = {
  bg:         "#0a0a0a",
  surface:    "#0d0d0d",
  surface2:   "#111",
  nav:        "rgba(0,0,0,.97)",
  text:       "#f5f5f5",
  textMuted:  "#666",
  textDim:    "#888",
  border:     "#1e1e1e",
  border2:    "#111111",
  input:      "#111",
  inputText:  "#f5f5f5",
  placeholder:"#444",
}

export const LIGHT_COLORS = {
  bg:         "#f8f8f8",
  surface:    "#ffffff",
  surface2:   "#f0f0f0",
  nav:        "rgba(248,248,248,.97)",
  text:       "#0a0a0a",
  textMuted:  "#555",
  textDim:    "#777",
  border:     "#e0e0e0",
  border2:    "#d4d4d4",
  input:      "#ffffff",
  inputText:  "#0a0a0a",
  placeholder:"#aaaaaa",
}

type Colors = typeof DARK_COLORS

type ThemeCtx = {
  theme: Theme
  isDark: boolean
  toggle: () => void
  c: Colors
}

const ThemeContext = createContext<ThemeCtx>({
  theme: "dark",
  isDark: true,
  toggle: () => {},
  c: DARK_COLORS,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark")

  useEffect(() => {
    const saved = localStorage.getItem("trident_theme") as Theme | null
    const t = saved === "light" ? "light" : "dark"
    setTheme(t)
    document.documentElement.setAttribute("data-theme", t)
  }, [])

  function toggle() {
    setTheme(t => {
      const next: Theme = t === "dark" ? "light" : "dark"
      localStorage.setItem("trident_theme", next)
      document.documentElement.setAttribute("data-theme", next)
      return next
    })
  }

  const c = theme === "dark" ? DARK_COLORS : LIGHT_COLORS

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === "dark", toggle, c }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
