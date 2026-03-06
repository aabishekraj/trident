export default function Footer() {

  return (

    <footer className="bg-black text-white py-16 mt-20">

      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10 px-8">

        <div>

          <h3 className="font-bold mb-4">
            TRIDENT
          </h3>

          <p className="text-sm text-gray-400">
            Performance apparel engineered for dominance.
          </p>

        </div>


        <div>
          <h4 className="font-semibold mb-4">
            Products
          </h4>

          <ul className="space-y-2 text-sm text-gray-400">

            <li>Jackets</li>
            <li>Hoodies</li>
            <li>Accessories</li>

          </ul>

        </div>


        <div>
          <h4 className="font-semibold mb-4">
            Company
          </h4>

          <ul className="space-y-2 text-sm text-gray-400">

            <li>About</li>
            <li>Careers</li>
            <li>Press</li>

          </ul>

        </div>


        <div>
          <h4 className="font-semibold mb-4">
            Support
          </h4>

          <ul className="space-y-2 text-sm text-gray-400">

            <li>Help</li>
            <li>Shipping</li>
            <li>Returns</li>

          </ul>

        </div>

      </div>

      <div className="text-center text-gray-500 text-sm mt-10">
        © 2026 TRIDENT. All rights reserved.
      </div>

    </footer>
  )
}