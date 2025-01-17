import { JSX, ReactNode, useEffect, useState } from 'react'
import Empty from '@/ui/empty'
import Loader from '@/ui/loader'

interface CommonProps<T> {
    title: string
    fetchData: (page: number) => Promise<{ data: T[]; totalPages: number }>
    renderItem: (item: T) => ReactNode
    maxVisiblePages?: number
    children?: ReactNode
}

interface EmptyProps {
    title: string
    empty: string
}

// Overloaded function types
export function Grid(props: EmptyProps): JSX.Element
export function Grid<T>(props: CommonProps<T>): JSX.Element

export function Grid<T>(props: CommonProps<T> | EmptyProps) {
    const isEmpty = 'empty' in props
    const [page, setPage] = useState(1)
    const [data, setData] = useState<T[]>([])
    const [totalPages, setTotalPages] = useState(1)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch data if fetchData is provided
    useEffect(() => {
        if (isEmpty) return

        async function fetchPageData() {
            setLoading(true)
            setError(null)
            try {
                const { data, totalPages } = await (props as CommonProps<T>).fetchData(page)
                setData(data)
                setTotalPages(totalPages)
            } catch (err) {
                setError('Failed to fetch data.')
            } finally {
                setLoading(false)
            }
        }

        fetchPageData()
    }, [page, props, isEmpty])

    if (loading) return <Loader />

    if (isEmpty) {
        return (
            <div className="h-full flex flex-col pt-6">
                <div className="text-2xl font-bold uppercase border-lul-blue border-b">
                    {props.title || 'Default Title'}
                </div>
                <Empty message={props.empty} />
            </div>
        )
    }

    // Helper function to generate visible page numbers
    const generatePageNumbers = () => {
        const maxVisiblePages = (props as CommonProps<T>).maxVisiblePages || 5

        if (totalPages <= maxVisiblePages) {
            return Array.from({ length: totalPages }, (_, i) => i + 1)
        }

        const pages: number[] = []
        const start = Math.max(1, page - Math.floor(maxVisiblePages / 2))
        const end = Math.min(totalPages, start + maxVisiblePages - 1)

        for (let i = start; i <= end; i++) {
            pages.push(i)
        }

        if (start > 1) pages.unshift(-1) // Indicates "..."
        if (end < totalPages) pages.push(-2) // Indicates "..."

        return pages
    }

    const visiblePages = generatePageNumbers()

    return (
        <div className="h-full flex flex-col pt-6">
            <div className="text-2xl font-bold uppercase border-lul-blue border-b">{props.title}</div>

            <div className="pt-6 flex-1 flex-col items-center justify-center overflow-y-auto">
                <div className="w-full 2xl:grid-cols-4 lg:grid-cols-3 grid grid-cols-1 gap-6 items-stretch">
                    {(props as CommonProps<T>).renderItem
                        ? data.map((item) => (props as CommonProps<T>).renderItem(item))
                        : props.children}
                </div>
            </div>

            {/* Pagination Controls */}
            <div className="mt-4 flex flex-col items-center gap-2">
                <div className="flex align-bottom justify-center gap-2">
                    {/* First Page Button */}
                    <button
                        className="px-4 py-2 bg-gray-700 text-white rounded"
                        onClick={() => setPage(1)}
                        disabled={page === 1}
                    >
                        First
                    </button>

                    {/* Previous Page Button */}
                    <button
                        className="px-4 py-2 bg-gray-700 text-white rounded"
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </button>

                    {/* Page Numbers */}
                    <div className="flex gap-2 overflow-x-auto px-2">
                        {visiblePages.map((pageNum, idx) => {
                            if (pageNum === -1) return <span key={`prev-${idx}`} className="px-2">...</span>
                            if (pageNum === -2) return <span key={`next-${idx}`} className="px-2">...</span>
                            return (
                                <button
                                    key={pageNum}
                                    className={`px-3 py-1 rounded ${
                                        pageNum === page
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-700 text-white'
                                    }`}
                                    onClick={() => setPage(pageNum)}
                                >
                                    {pageNum}
                                </button>
                            )
                        })}
                    </div>

                    {/* Next Page Button */}
                    <button
                        className="px-4 py-2 bg-gray-700 text-white rounded"
                        onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={page === totalPages}
                    >
                        Next
                    </button>

                    {/* Last Page Button */}
                    <button
                        className="px-4 py-2 bg-gray-700 text-white rounded"
                        onClick={() => setPage(totalPages)}
                        disabled={page === totalPages}
                    >
                        Last
                    </button>
                </div>
            </div>
        </div>
    )
}
