// Pure constants — no mongoose, safe to import in client components
export type AdminRole = "superadmin" | "manager" | "order_manager" | "analyst"

export const ROLE_PERMISSIONS: Record<AdminRole, {
  dashboard: boolean
  orders:    { view: boolean; edit: boolean; delete: boolean }
  products:  { view: boolean; create: boolean; edit: boolean; delete: boolean; bulkImport: boolean }
  coupons:   { view: boolean; create: boolean; edit: boolean; delete: boolean }
  analytics: boolean
  users:     { view: boolean; create: boolean; edit: boolean; delete: boolean }
}> = {
  superadmin: {
    dashboard: true,
    orders:    { view: true,  edit: true,  delete: true  },
    products:  { view: true,  create: true,  edit: true,  delete: true,  bulkImport: true  },
    coupons:   { view: true,  create: true,  edit: true,  delete: true  },
    analytics: true,
    users:     { view: true,  create: true,  edit: true,  delete: true  },
  },
  manager: {
    dashboard: true,
    orders:    { view: true,  edit: true,  delete: false },
    products:  { view: true,  create: true,  edit: true,  delete: false, bulkImport: true  },
    coupons:   { view: true,  create: true,  edit: true,  delete: false },
    analytics: true,
    users:     { view: true,  create: false, edit: false, delete: false },
  },
  order_manager: {
    dashboard: true,
    orders:    { view: true,  edit: true,  delete: false },
    products:  { view: true,  create: false, edit: false, delete: false, bulkImport: false },
    coupons:   { view: true,  create: false, edit: false, delete: false },
    analytics: false,
    users:     { view: false, create: false, edit: false, delete: false },
  },
  analyst: {
    dashboard: true,
    orders:    { view: true,  edit: false, delete: false },
    products:  { view: true,  create: false, edit: false, delete: false, bulkImport: false },
    coupons:   { view: true,  create: false, edit: false, delete: false },
    analytics: true,
    users:     { view: false, create: false, edit: false, delete: false },
  },
}
