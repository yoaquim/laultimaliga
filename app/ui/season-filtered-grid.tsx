import { ChangeEvent, JSX, ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import Empty from '@/ui/empty'
import Loader from '@/ui/loader'
import { SeasonOption } from '@/dashboard/types'
import { getAllSeasons } from '@/dashboard/actions'
import { BiSolidChevronDownSquare } from 'react-icons/bi'
import { jersey10 } from '@/ui/fonts'
import FakeSelect from '@/ui/fake-select'

interface CommonProps<T> {
    title: string
    fetchData: (page: number, seasonId: string) => Promise<{ data: T[]; totalPages: number }>
    renderItem: (item: T) => ReactNode
}

interface EmptyProps {
    title: string
    empty: string
}

// Overloaded function types
export function SeasonFilteredGrid(props: EmptyProps): JSX.Element
export function SeasonFilteredGrid<T>(props: CommonProps<T>): JSX.Element

export function SeasonFilteredGrid<T>(props: CommonProps<T> | EmptyProps) {
    const isEmpty = 'empty' in props
    const [page, setPage] = useState(1)
    const [data, setData] = useState<T[]>([])
    const [totalPages, setTotalPages] = useState(1)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isFetching, setIsFetching] = useState(false)

    // New state variable to indicate that initial load is complete.
    const [hasLoaded, setHasLoaded] = useState(false)

    // State for season filtering
    const [seasons, setSeasons] = useState<SeasonOption[]>([])
    const [selectedSeasonId, setSelectedSeasonId] = useState<string>('')

    // Refs for container & sentinel element for infinite scrolling
    const containerRef = useRef<HTMLDivElement>(null)
    const sentinelRef = useRef<HTMLDivElement>(null)
    const observerRef = useRef<IntersectionObserver | null>(null)

    // Load seasons on mount
    useEffect(() => {
        async function loadSeasons() {
            try {
                const seasonOptions: SeasonOption[] = await getAllSeasons()
                setSeasons(seasonOptions)
                // Default to the first season (assumed latest)
                if (seasonOptions.length > 0) {
                    setSelectedSeasonId(seasonOptions[0].id)
                }
            } catch (err) {
                console.error('Error fetching seasons', err)
            }
        }

        loadSeasons()
    }, [])

    // Fetch page data whenever page or selectedSeasonId changes
    useEffect(() => {
        if (isEmpty) return
        if (!selectedSeasonId) return

        async function fetchPageData() {
            if (page === 1) setLoading(true)
            setError(null)
            try {
                const {data: newData, totalPages: newTotalPages} = await (props as CommonProps<T>).fetchData(page, selectedSeasonId)
                setData((prev) => (page === 1 ? newData : [...prev, ...newData]))
                setTotalPages(newTotalPages)
            } catch (err) {
                setError('Failed to fetch data.')
            } finally {
                setLoading(false)
                setIsFetching(false)
                if (page === 1) {
                    setHasLoaded(true)
                }
            }
        }

        fetchPageData()
    }, [page, selectedSeasonId, props, isEmpty])

    // Reset page to 1 when the selected season changes.
    useEffect(() => {
        setPage(1)
    }, [selectedSeasonId])

    // Set up IntersectionObserver for infinite scrolling
    const observerCallback = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            if (entries[0].isIntersecting && page < totalPages && !loading && !isFetching) {
                setIsFetching(true)
                setPage((prev) => prev + 1)
            }
        },
        [page, totalPages, loading, isFetching]
    )

    useEffect(() => {
        if (observerRef.current) observerRef.current.disconnect()
        if (isEmpty || loading || isFetching || page >= totalPages) return
        if (containerRef.current && containerRef.current.scrollHeight <= containerRef.current.clientHeight) return

        observerRef.current = new IntersectionObserver(observerCallback, {
            root: null,
            rootMargin: '200px',
            threshold: 0.1,
        })

        if (sentinelRef.current) {
            observerRef.current.observe(sentinelRef.current)
        }
        return () => {
            if (observerRef.current) observerRef.current.disconnect()
        }
    }, [observerCallback, isEmpty, loading, isFetching, page, totalPages, data])

    if (isEmpty) {
        return (
            <div className="h-full flex flex-col pt-6">
                <div className="text-2xl font-bold uppercase border-lul-blue border-b">
                    {(props as EmptyProps).title || 'Default Title'}
                </div>
                <Empty message={(props as EmptyProps).empty}/>
            </div>
        )
    }

    // While loading the first page, show Loader.
    const isLoading = loading && page === 1
    // Always show the dropdown once seasons have loaded and the initial load is complete.
    const shouldShowDropdown = seasons.length > 0 && hasLoaded

    return (
        <div className="h-full flex flex-col pt-6">
            {/* Title */}
            <div className="text-2xl font-bold uppercase border-lul-blue border-b">
                {(props as CommonProps<T>).title}
            </div>

            {/* Season Filter Dropdown */}
            {shouldShowDropdown && (
                <FakeSelect
                    collection={seasons}
                    selectedId={selectedSeasonId}
                    setSelected={setSelectedSeasonId}
                    className="py-4"
                />
            )}

            {/* Grid Content */}
            <div ref={containerRef} className="flex-1 flex-col items-center justify-center overflow-y-auto">
                {isLoading && <Loader/>}

                {!isLoading && data.length === 0 && (
                    <div className="lg:-mt-20 w-full flex flex-col justify-center items-center h-full">
                        Nothing here...yet
                    </div>
                )}

                {!isLoading && (
                    <>
                        <div className="w-full 2xl:grid-cols-4 lg:grid-cols-3 grid grid-cols-1 gap-6 items-stretch">
                            {data.map((item) => (props as CommonProps<T>).renderItem(item))}
                        </div>
                        {/* Sentinel for infinite scrolling */}
                        <div ref={sentinelRef} className="h-2"/>
                    </>
                )}
            </div>

            {/* Loader for infinite scroll */}
            {isFetching && (
                <div className="flex justify-center my-4">
                    <Loader/>
                </div>
            )}
        </div>
    )
}
