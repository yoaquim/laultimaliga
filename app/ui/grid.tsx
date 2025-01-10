import { ReactNode } from 'react'

export function Grid({title, children}: { title: string, children: ReactNode }) {
    return (
        <>
            {/* Sticky Header */}
            <div className="sticky top-0 bg-lul-black pt-8 pb-6 z-50">
                <h1 className="text-3xl font-bold">{title}</h1>
            </div>

            {/* Teams Grid */}
            <div className="2xl:grid-cols-5 lg:grid-cols-3 grid grid-cols-1 gap-6">
                {children}
            </div>
        </>
    )
}
