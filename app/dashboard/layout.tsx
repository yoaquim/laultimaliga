'use client'

import { ReactNode } from 'react'
import Navbar from '@/ui/navbar'

export default function Dashboard({children}: { children: ReactNode }) {
    return (
        <div className="flex flex-col lg:flex-row w-screen h-screen bg-gradient-to-br from-lul-black to-lul-black/95">
            {/* Page Content */}
            <div className="lg:order-2 lg:px-10 px-8 flex-1 order-1 pb-8 text-white overflow-y-auto">
                {children}
            </div>

            {/* Navbar */}
            <Navbar className="lg:order-1 order-2"/>
        </div>
    )
}
