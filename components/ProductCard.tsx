import Link from "next/link"
import Image from "next/image"

type ProductCardProps = {
  id: string
  name: string
  price: number
  image: string
}

export default function ProductCard({ id, name, price, image }: ProductCardProps) {

  const safeImage = image && image !== "" ? image : "/products/placeholder.jpg"

  return (
    <Link href={`/product/${id}`} className="group block">

      <div className="overflow-hidden mb-4">
        <Image
          src={safeImage}
          alt={name}
          width={400}
          height={500}
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>

      <h3 className="font-semibold">{name}</h3>
      <p className="text-neutral-400">${price}</p>

    </Link>
  )
}
