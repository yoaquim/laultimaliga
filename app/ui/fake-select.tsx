import { ChangeEvent, use, useState } from 'react'
import { LulColor } from '@/lib/types'
import clsx from 'clsx'
import { BsFillCaretDownFill } from 'react-icons/bs'


interface Props {
    collection: { name: string, id: string } []
    selectedId: string
    setSelected: (selectedId: string) => void
    className?: string
    color?: LulColor
}

export default function FakeSelect({collection, selectedId, setSelected, className = '', color = 'blue'}: Props) {
    return (
        <div className={`w-full relative flex justify-center ${className}`}>
            {/* FAKE SELECT */}
            <button
                className={clsx('relative max-w-lg w-full text-lg font-semibold text-center px-4 py-1.5 rounded-md uppercase text-white flex justify-center items-center cursor-pointer',
                    {
                        'bg-lul-blue': color === 'blue',
                        'bg-lul-green': color === 'green',
                        'bg-lul-red': color === 'red',
                        'bg-lul-yellow': color === 'yellow',
                        'bg-lul-orange': color === 'orange',
                    }
                )}>
                {collection.find(({name, id}) => id === selectedId)?.name || 'Select Item'}
                <div className="absolute right-2">
                    <BsFillCaretDownFill className="text-white text-xl"/>
                </div>
            </button>

            {/* HIDDEN NATIVE SELECT */}
            <select
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                value={selectedId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                    e.preventDefault()
                    setSelected(e.target.value)
                }}
            >
                {collection.map(({id, name}) => (
                    <option key={id} value={id}>
                        {name}
                    </option>
                ))}
            </select>
        </div>
    )
}
