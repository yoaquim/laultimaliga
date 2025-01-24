import { ReactNode } from 'react'
import clsx from 'clsx'
import { LulColor } from '@/lib/types'

export function InfoCard({
                             title,
                             titleClassName,
                             children,
                             style = 'bordered',
                             fullWidth = false,
                             color = 'blue',
                             className = '',
                         }: {
    title: string | ReactNode,
    titleClassName?: string
    children: ReactNode,
    style?: 'bordered' | 'exalted'
    fullWidth?: boolean,
    color?: LulColor
    className?: string,
}) {
    return (
        <div className={clsx(`w-full bg-lul-grey/20 rounded-md p-4 ${className}`, {'lg:w-full': fullWidth})}>
            {style === 'bordered' &&
                <h2 className={clsx(`text-white font-bold text-lg mb-2 uppercase border-b ${titleClassName}`, {
                    'border-lul-green': color === 'green',
                    'border-lul-blue': color === 'blue',
                    'border-lul-red': color === 'red',
                    'border-lul-yellow': color === 'yellow',
                    'border-lul-orange': color === 'orange',
                })}>
                    {title}
                </h2>
            }

            {style === 'exalted' &&
                <h2 className={clsx(`font-bold text-xl mb-2 uppercase ${titleClassName}`, {
                    'text-lul-green': color === 'green',
                    'text-lul-blue': color === 'blue',
                    'text-lul-red': color === 'red',
                    'text-lul-yellow': color === 'yellow',
                    'text-lul-orange': color === 'orange',
                })}>
                    {title}
                </h2>
            }

            {children}
        </div>
    )
}
