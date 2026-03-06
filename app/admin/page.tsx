export default function AdminDashboard(){

  return(

    <div>

      <h1 className="text-3xl font-bold mb-10">
        Dashboard
      </h1>

      <div className="grid grid-cols-4 gap-8">

        <div className="border border-neutral-800 p-6">
          <p className="text-neutral-400">
            Total Orders
          </p>

          <h2 className="text-2xl font-bold">
            0
          </h2>
        </div>


        <div className="border border-neutral-800 p-6">
          <p className="text-neutral-400">
            Revenue
          </p>

          <h2 className="text-2xl font-bold">
            $0
          </h2>
        </div>


        <div className="border border-neutral-800 p-6">
          <p className="text-neutral-400">
            Customers
          </p>

          <h2 className="text-2xl font-bold">
            0
          </h2>
        </div>


        <div className="border border-neutral-800 p-6">
          <p className="text-neutral-400">
            Products
          </p>

          <h2 className="text-2xl font-bold">
            0
          </h2>
        </div>

      </div>

    </div>
  )
}