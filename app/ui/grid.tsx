import { JSX, ReactNode, useEffect, useRef, useState } from 'react'
import Empty from '@/ui/empty'
import Loader from '@/ui/loader'

interface CommonProps<T> {
    title: string
    fetchData: (page: number) => Promise<{ data: T[]; totalPages: number }>
    renderItem: (item: T) => ReactNode
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
    const [isFetching, setIsFetching] = useState(false)

    // Ref for the scrollable content container and the sentinel element
    const containerRef = useRef<HTMLDivElement>(null)
    const sentinelRef = useRef<HTMLDivElement>(null)
    const observerRef = useRef<IntersectionObserver | null>(null)

    // Fetch data only if fetchData is provided (for non-empty version)
    useEffect(() => {
        if (isEmpty) return

        async function fetchPageData() {
            if (page === 1) setLoading(true)
            setError(null)
            try {
                const {data: newData, totalPages: newTotalPages} = await (props as CommonProps<T>).fetchData(page)
                setData((prev) => (page === 1 ? newData : [...prev, ...newData]))
                setTotalPages(newTotalPages)
            } catch (err) {
                setError('Failed to fetch data.')
            } finally {
                setLoading(false)
                setIsFetching(false)
            }
        }

        fetchPageData()
    }, [page, props, isEmpty])

    // Set up and manage the IntersectionObserver on the sentinel element.
    useEffect(() => {
        // Disconnect the old observer if any
        if (observerRef.current) {
            observerRef.current.disconnect()
        }

        // Do nothing if empty, loading, already fetching, or reached end
        if (isEmpty || loading || isFetching || page >= totalPages) return

        // If containerRef exists and its content is NOT scrollable, do not attach the observer.
        if (containerRef.current && containerRef.current.scrollHeight <= containerRef.current.clientHeight) {
            return
        }

        // Create the observer
        observerRef.current = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsFetching(true)
                    setPage((prev) => prev + 1)
                }
            },
            {
                root: null, // Use viewport as root
                rootMargin: '200px',
                threshold: 0.1,
            }
        )

        // Attach the observer to the sentinel element, if it exists
        if (sentinelRef.current) {
            observerRef.current.observe(sentinelRef.current)
        }

        // Cleanup on unmount or when dependencies change
        return () => {
            if (observerRef.current) observerRef.current.disconnect()
        }
    }, [isEmpty, loading, isFetching, page, totalPages, data])

    if (loading && page === 1) return <Loader/>

    if (isEmpty) {
        return (
            <div className="h-full flex flex-col pt-6">
                <div className="text-2xl font-bold uppercase border-lul-blue border-b">
                    {props.title || 'Default Title'}
                </div>
                <Empty message={(props as EmptyProps).empty}/>
            </div>
        )
    }

    if (data.length === 0) {
        return (
            <div className="h-full flex flex-col pt-6">
                <div className="text-2xl font-bold uppercase border-lul-blue border-b">
                    {props.title || 'Default Title'}
                </div>
                <Empty message="No items yet"/>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col pt-6">
            <div className="text-2xl font-bold uppercase border-lul-blue border-b">
                {(props as CommonProps<T>).title}
            </div>

            <div
                ref={containerRef}
                className="pt-6 flex-1 flex-col items-center justify-center overflow-y-auto"
            >
                <div className="w-full 2xl:grid-cols-4 lg:grid-cols-3 grid grid-cols-1 gap-6 items-stretch">
                    {(props as CommonProps<T>).renderItem
                        ? data.map((item) => (props as CommonProps<T>).renderItem(item))
                        : props.children}
                </div>
                {/* Sentinel for infinite scrolling */}
                <div ref={sentinelRef} className="h-2"/>
            </div>

            {/* Show a Loader below the grid when fetching more data */}
            {isFetching && (
                <div className="flex justify-center my-4">
                    <Loader/>
                </div>
            )}
        </div>
    )
}
