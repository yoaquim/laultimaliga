import { jersey10 } from '@/ui/fonts'

export default function Score({value, className}: { value: string | number, className?: string }) {
    return (
        <span className={`${jersey10.className} ${className}`}>{value}</span>
    )
}