import { ReactNode } from 'react'

export function Container({children, className = ''}: { className?: string, children: ReactNode }) {
    return (
        <div className={`lg:h-full lg:flex lg:flex-col flex-1 overflow-y-auto items-stretch ${className}`}>
            {children}
        </div>
    )
}
