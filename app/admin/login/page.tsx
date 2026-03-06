"use client"

import { signIn } from "next-auth/react"

export default function LoginPage(){

  return (

    <div className="min-h-screen flex items-center justify-center bg-black text-white">

      <div className="w-105 border border-neutral-800 p-10">

        <h1 className="text-2xl font-bold mb-8">
          Login
        </h1>

        {/* GOOGLE LOGIN */}

        <button
          onClick={()=>signIn("google")}
          className="w-full bg-white text-black py-3 font-semibold mb-6 hover:bg-neutral-200 transition"
        >
          Continue with Google
        </button>


        <div className="text-center text-neutral-400 mb-6">
          or
        </div>


        {/* ADMIN LOGIN */}

        <button
          onClick={()=>signIn("credentials",{callbackUrl:"/admin"})}
          className="w-full border border-white py-3 hover:bg-white hover:text-black transition"
        >
          Admin Login
        </button>

      </div>

    </div>

  )
}