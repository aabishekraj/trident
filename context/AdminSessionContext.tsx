"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { AdminRole } from "@/lib/roles"

export type AdminSessionData = {
  loggedIn: boolean
  loading: boolean
  username?: string
  role?: AdminRole
}

const AdminSessionContext = createContext<AdminSessionData>({ loggedIn: false, loading: true })

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSessionData>({ loggedIn: false, loading: true })

  useEffect(() => {
    fetch("/api/admin/login")
      .then(r => r.json())
      .then(data => setSession({ ...data, loading: false }))
      .catch(() => setSession({ loggedIn: false, loading: false }))
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
