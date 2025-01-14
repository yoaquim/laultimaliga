import { ReactNode } from 'react'

export function Grid({title, children}: { title: string, children: ReactNode }) {
    return (
        <div className="h-full flex flex-col">
            <h1 className="py-6 text-3xl font-bold">{title}</h1>

            {/* Teams Grid */}
            <div className="flex-1 overflow-y-auto 2xl:grid-cols-4 lg:grid-cols-3 grid grid-cols-1 gap-6 items-stretch">
                {children}
            </div>
        </div>
    )
}
