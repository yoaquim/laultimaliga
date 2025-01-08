'use client'

import { ReactNode } from 'react'
import Navbar from '@/ui/navbar'

export default function Dashboard({children}: { children: ReactNode }) {
    return (
        <div className="w-screen h-screen relative">
            <Navbar/>
            <div className="lg:pl-32 lg:pr-8 lg:pb-14 w-full h-full pb-28 flex flex-col gap-y-8 bg-lul-black text-white overflow-y-scroll">
                {children}
            </div>
        </div>
    )
}
