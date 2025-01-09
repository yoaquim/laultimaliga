import { ReactNode } from 'react'

export function Grid({title, children}: { title: string, children: ReactNode }) {
    return (
        <div className="">
            {/* Sticky Header */}
            <div className="lg:px-0 px-10 sticky top-0 pt-10 bg-lul-black py-8 z-50">
                <h1 className="text-3xl font-bold">{title}</h1>
            </div>

            {/* Teams Grid */}
            <div className="lg:px-0 lg:grid-cols-3 px-10 grid grid-cols-1 gap-6">
                {children}
            </div>
        </div>
    )
}
