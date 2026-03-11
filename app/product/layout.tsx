import Navbar from "@/components/Navbar"
import CartDrawer from "@/components/cart/CartDrawer"

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <CartDrawer />
    </>
  )
}
