import ProductView from "@/components/ProductView"
import { products } from "@/data/products"

export default async function ProductPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {

  const params = await searchParams
  const id = params?.id || "elite-jacket"

  const product = products.find((p) => p.id === id)

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        Product not found
      </div>
    )
  }

  return <ProductView product={product} />
}