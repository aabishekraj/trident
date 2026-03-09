"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { AdminRole } from "@/lib/roles"

export type AdminSessionData = {
  loggedIn: boolean
  username?: string
  role?: AdminRole
}

const AdminSessionContext = createContext<AdminSessionData>({ loggedIn: false })

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSessionData>({ loggedIn: false })

  useEffect(() => {
    fetch("/api/admin/login")
      .then(r => r.json())
      .then(setSession)
      .catch(() => {})
  }, [])

  return (
    <AdminSessionContext.Provider value={session}>
      {children}
    </AdminSessionContext.Provider>
  )
}

export function useAdminSession() {
  return useContext(AdminSessionContext)
}
