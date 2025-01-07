'use client'

import { ReactNode } from 'react'
import Navbar from '@/ui/navbar'

export default function Dashboard({children}: { children: ReactNode }) {
    return (
        <div className="w-screen h-screen relative bg-lul-black">
            <Navbar/>
            <div className="lg:pl-24 lg:pb-0 w-full h-full flex justify-center pb-16">
                {children}
            </div>
        </div>
    )
}
