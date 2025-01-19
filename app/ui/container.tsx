import { ReactNode } from 'react'
import { LulColor } from '@/lib/types'
import clsx from 'clsx'

interface Props {
    title?: string,
    className?: string,
    color?: LulColor,
    children: ReactNode
}

export function Container({title, children, color = 'blue', className = ''}: Props) {
    return (
        <div className={`lg:h-full lg:flex lg:flex-col flex-1 overflow-y-auto py-6 ${className}`}>
            {title &&
                <h1 className={clsx(`w-full text-2xl font-bold uppercase border-b`, {
                    'border-lul-blue': color === 'blue',
                    'border-lul-green': color === 'green',
                    'border-lul-yellow': color === 'yellow',
                    'border-lul-red': color === 'red',
                    'border-lul-orange': color === 'orange',
                })}>
                    {title}
                </h1>
            }
            {children}
        </div>
    )
}
