import { ReactNode } from 'react'
import clsx from 'clsx'

export function InfoCard({
                             title,
                             titleClassName,
                             children,
                             fullWidth = false,
                             color = 'blue',
                             className = '',
                         }: {
    title: string | ReactNode,
    titleClassName?: string
    children: ReactNode,
    fullWidth?: boolean,
    color?: 'blue' | 'green' | 'red' | 'yellow' | 'orange',
    className?: string,
}) {
    return (
        <div className={clsx(`lg:w-1/2 w-full bg-lul-grey/20 rounded-md p-4 ${className}`, {
            'lg:w-full': fullWidth
        })}>
            <h2 className={clsx(`text-white font-bold text-lg mb-2 uppercase border-b ${titleClassName}`, {
                'border-lul-green': color === 'green',
                'border-lul-blue': color === 'blue',
                'border-lul-red': color === 'red',
                'border-lul-yellow': color === 'yellow',
                'border-lul-orange': color === 'orange',
            })}>
                {title}
            </h2>

            {children}
        </div>
    )
}
