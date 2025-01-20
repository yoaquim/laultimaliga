'use client'

import { ReactNode } from 'react'
import Navbar from '@/ui/navbar'

export default function Dashboard({children}: { children: ReactNode }) {
    return (
        <div className="flex flex-col lg:flex-row w-screen h-screen bg-gradient-to-br from-lul-black to-lul-black/95">
            <Navbar/>

            <div className="lg:px-10 lg:pb-6 px-8 flex-1 pb-32 text-white overflow-y-auto">
                {children}
            </div>
        </div>
    )
}
