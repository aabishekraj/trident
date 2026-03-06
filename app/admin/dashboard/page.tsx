import Link from "next/link"

export default function AdminDashboard() {

  return (

    <div className="min-h-screen bg-black text-white p-10">

      <h1 className="text-4xl font-bold mb-10">
        TRIDENT ADMIN
      </h1>

      <div className="grid grid-cols-3 gap-6">

        <Link href="/admin/products" className="p-6 bg-neutral-900">
          Manage Products
        </Link>

        <div className="p-6 bg-neutral-900">
          Orders
        </div>

        <div className="p-6 bg-neutral-900">
          Discounts
        </div>

        <div className="p-6 bg-neutral-900">
          Customers
        </div>

      </div>

    </div>
  )
}