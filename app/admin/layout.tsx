import Link from "next/link"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (

    <div className="flex min-h-screen bg-black text-white">

      {/* SIDEBAR */}

      <aside className="w-64 border-r border-neutral-800 p-6">

        <h2 className="text-xl font-bold mb-10">
          Admin Panel
        </h2>

        <nav className="flex flex-col gap-4 text-sm">

          <Link href="/admin">Dashboard</Link>

          <Link href="/admin/orders">
            Orders
          </Link>

          <Link href="/admin/products">
            Products
          </Link>

          <Link href="/admin/coupons">
            Coupons
          </Link>

          <Link href="/admin/analytics">
            Analytics
          </Link>

        </nav>

      </aside>


      {/* CONTENT */}

      <main className="flex-1 p-10">
        {children}
      </main>

    </div>

  )
}