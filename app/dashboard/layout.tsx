'use client'

import { ReactNode } from 'react'
import Navbar from '@/ui/navbar'

export default function Dashboard({children}: { children: ReactNode }) {
    return (
        <div className="w-screen h-screen relative bg-lul-black">
            <Navbar/>
            <div className="lg:pl-32 w-full h-full pb-14 flex flex-col gap-y-8 bg-lul-black text-white overflow-y-scroll">
                {children}
            </div>
        </div>
    )
}
