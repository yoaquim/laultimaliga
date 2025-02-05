import clsx from 'clsx'
import { ReactNode } from 'react'
import { LulColor } from '@/lib/types'

interface Props {
    title: string
    forceLessCols?: boolean
    borderTitleColor: LulColor
    children: ReactNode
}

export default function CardGrid({title, borderTitleColor, forceLessCols = false, children}: Props) {
    return (
        <div className="flex-1 flex flex-col lg:overflow-hidden bg-lul-grey/20 rounded-md px-4">
            {/* Sticky header */}
            <div className={clsx('realtive lg:bg-opacity-0 sticky top-0 z-10 border-b text-2xl font-semibold py-2 flex items-end border-white', {
                'border-lul-blue': borderTitleColor === 'blue',
                'border-lul-green': borderTitleColor === 'green',
                'border-lul-yellow': borderTitleColor === 'yellow',
                'border-lul-orange': borderTitleColor === 'orange',
                'border-lul-red': borderTitleColor === 'red'
            })}>
                <h1 className="flex flex-1 uppercase text-xl sticky top-0 lg:static">{title}</h1>
            </div>

            {/* Scrollable stats area */}
            <div className={clsx('w-full overflow-y-auto py-4 grid grid-cols-1 2xl:grid-cols-2 3xl:grid-cols-3 gap-6', {
                'lg:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4': !forceLessCols
            })}>
                {children}
            </div>
        </div>
    )

}