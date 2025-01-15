import { ReactNode } from 'react'

export function Grid({title, children}: { title: string, children: ReactNode }) {
    return (
        <div className="h-full flex flex-col pt-6">
            <h1 className="text-2xl font-bold uppercase border-lul-blue border-b">{title}</h1>

            {/* Teams Grid */}
            <div className="pt-6 flex-1 overflow-y-auto 2xl:grid-cols-4 lg:grid-cols-3 grid grid-cols-1 gap-6 items-stretch">
                {children}
            </div>
        </div>
    )
}
