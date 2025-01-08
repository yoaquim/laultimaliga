import { ReactNode } from 'react'

export function Grid({title, children}: { title: string, children: ReactNode }) {
    return (
        <div className="">
            {/* Sticky Header */}
            <div className="sticky top-0 pt-10 bg-lul-black py-8">
                <h1 className="text-3xl font-bold">{title}</h1>
            </div>

            {/* Teams Grid */}
            <div className="lg:pb-0 grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
                {children}
            </div>
        </div>
    )
}