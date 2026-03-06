"use client"

import { useState } from "react"
import Link from "next/link"

export default function DropdownMenu({
  title,
  items
}:{
  title:string
  items:string[]
}){

  const [open,setOpen] = useState(false)

  return(

    <div
      className="relative"
      onMouseEnter={()=>setOpen(true)}
      onMouseLeave={()=>setOpen(false)}
    >

      <button className="hover:text-gray-300">
        {title}
      </button>

      {open && (

        <div className="absolute top-8 bg-black border border-neutral-700 p-6 w-48">

          {items.map((item)=>(
            <Link
              key={item}
              href={`/collection/${item.toLowerCase()}`}
              className="block py-2 text-neutral-400 hover:text-white"
            >
              {item}
            </Link>
          ))}

        </div>

      )}

    </div>
  )
}