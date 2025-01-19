import { ReactNode } from 'react'

export function Container({title, children, className = ''}: { title?: string, className?: string, children: ReactNode }) {
    return (
        <div className={`lg:h-full lg:flex lg:flex-col flex-1 overflow-y-auto py-6 ${className}`}>
            {title && <h1 className="w-full text-2xl font-bold uppercase border-lul-blue border-b">{title}</h1>}
            {children}
        </div>
    )
}
