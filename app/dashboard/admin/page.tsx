'use client'

import React, { useState, useEffect } from 'react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import { Container } from '@/ui/container'
import {
    bulkCreateSeasonsAction,
    bulkCreateTeamsAction,
    bulkCreatePlayersAction,
    bulkCreateMatchesAction,
    bulkCreateParticipationsAction,
    fetchTableDataAction,
} from './actions'
import Loader from '@/ui/loader'

type AdminTab =
    | 'SEASONS'
    | 'TEAMS'
    | 'PLAYERS'
    | 'MATCHES'
    | 'PARTICIPATIONS'

/** Entities for DataView: We'll map them to the same table names, but let's rename to keep consistent: */
const DATA_TABLES = [
    {value: 'SEASON', label: 'Seasons'},
    {value: 'TEAM', label: 'Teams'},
    {value: 'PLAYER', label: 'Players'},
    {value: 'MATCH', label: 'Matches'},
    {value: 'PARTICIPATION', label: 'PlayerMatchParticipation'},
]

/** Main Admin Dashboard */
export default function AdminDashboardPage() {
    // Tab for single-entity creation
    const [currentTab, setCurrentTab] = useState<AdminTab>('SEASONS')

    // Log of recent creations
    const [logEntries, setLogEntries] = useState<
        { tab: AdminTab; itemId: string; payload: any; createdAt: string }[]
    >([])

    // CSV states
    const [creatingBulk, setCreatingBulk] = useState<boolean>(false)
    const [csvText, setCsvText] = useState('')
    const [csvParsed, setCsvParsed] = useState<any[]>([])
    const [bulkPreview, setBulkPreview] = useState(false)

    // Toggles whether logs or preview is shown
    const [showLogs, setShowLogs] = useState(false)

    // -------------------------------
    // Bulk CSV
    // -------------------------------
    function handlePreviewCSV() {
        try {
            setBulkPreview(false)
            const lines = csvText.trim().split('\n')
            if (!lines.length) throw new Error('No CSV data found.')
            const parsed: any[] = []
            for (const line of lines) {
                const columns = line.split(',').map((c) => c.trim())
                parsed.push(columns)
            }
            setCsvParsed(parsed)
            setBulkPreview(true)
        } catch (error) {
            console.error('CSV parse error:', error)
            toast.error(String(error))
        }
    }

    async function handleCreateCSV() {
        setCreatingBulk(true)
        const toastId = toast.loading(`Bulk Creating ${currentTab.toLowerCase()}...`)
        try {
            if (!csvParsed.length) {
                toast.dismiss(toastId)
                toast.error('Nothing to create. Preview first.')
                setCreatingBulk(false)
                return
            }

            debugger
            let result: any[] = []
            switch (currentTab) {
                case 'SEASONS':
                    result = await bulkCreateSeasonsAction(csvParsed)
                    break
                case 'TEAMS':
                    result = await bulkCreateTeamsAction(csvParsed)
                    break
                case 'PLAYERS':
                    result = await bulkCreatePlayersAction(csvParsed)
                    break
                case 'MATCHES':
                    result = await bulkCreateMatchesAction(csvParsed)
                    break
                case 'PARTICIPATIONS':
                    result = await bulkCreateParticipationsAction(csvParsed)
                    break
            }

            toast.success('Bulk creation successful')
            toast.dismiss(toastId)

            // Add to logs
            setLogEntries((prev) => [
                ...prev,
                {
                    tab: currentTab,
                    itemId: 'bulk',
                    payload: result,
                    createdAt: new Date().toISOString(),
                },
            ])

            setCreatingBulk(false)
            setBulkPreview(false)
            setCsvParsed([])
            setCsvText('')
            setShowLogs(true) // automatically show logs now that we created
        } catch (err) {
            toast.dismiss(toastId)
            setCreatingBulk(false)
            console.error('Bulk creation error:', err)
            toast.error('Error in bulk creation')
        }
    }

    // Updated CSV examples (removed PSDETAILS):
    const bulkExamples: Record<AdminTab, string> = {
        SEASONS:
            'name,shortName,startDate,endDate\n' +
            'Spring 2025,S25,2025-03-01,2025-06-01\n' +
            'Summer 2025,SU25,2025-06-02,2025-09-01\n' +
            'Fall 2025,F25,2025-09-02,2025-12-01\n',
        TEAMS:
            'seasonId,name,logo\n' +
            'season-uuid-1,Lions,season-name/logo.png\n' +
            'season-uuid-1,Tigers,season-name/logo.png\n' +
            'season-uuid-2,Sharks,season-name/logo.png\n',
        PLAYERS:
        // [name, phone, size, position, seasonId, teamId, number]
            'name,phone,size,position,seasonId,teamId,number\n' +
            'John Doe,1234567890,MEDIUM,PG,season-uuid-1,team-uuid-1,23\n' +
            'Jane Smith,0987654321,LARGE,SG,season-uuid-1,team-uuid-2,45\n' +
            'Mike Johnson,1122334455,X_LARGE,C,season-uuid-2,team-uuid-3,12\n',
        MATCHES:
            'homeTeamId,awayTeamId,seasonId,dateString\n' +
            'team-uuid-1,team-uuid-2,season-uuid-1,2025-03-10\n' +
            'team-uuid-3,team-uuid-4,season-uuid-1,2025-03-15\n' +
            'team-uuid-5,team-uuid-6,season-uuid-2,2025-03-20\n',
        PARTICIPATIONS:
            'playerId,matchId\n' +
            'player-uuid-1,match-uuid-1\n' +
            'player-uuid-2,match-uuid-1\n' +
            'player-uuid-3,match-uuid-2\n',
    }

    // --------------------------------
    // RENDER
    // --------------------------------
    return (
        <Container
            color="orange"
            title="Admin Dashboard"
            className="w-full h-full text-white flex flex-col pb-0 gap-y-4 overflow-y-hidden"
        >
            {/* ==================================== */}
            {/* BULK CSV CREATION */}
            {/* ==================================== */}
            <div className="flex flex-col h-1/3 w-full bg-lul-grey/20 rounded-md p-4">
                {/* HEADER WITH TABS */}
                <div className="flex pb-1.5 mb-2 border-b border-lul-orange">
                    <h1 className="flex-1 flex flex-col justify-end text-lg text-white uppercase font-bold">
                        Bulk {currentTab} Creation via CSV
                    </h1>
                    <div className="flex justify-between items-start gap-x-3">
                        {(
                            [
                                'SEASONS',
                                'TEAMS',
                                'PLAYERS',
                                'MATCHES',
                                'PARTICIPATIONS',
                            ] as AdminTab[]
                        ).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => {
                                    setCurrentTab(tab)
                                    setCsvText('')
                                    setBulkPreview(false)
                                    setCsvParsed([])
                                    setShowLogs(false)
                                }}
                                className={clsx(
                                    'px-4 h-fit py-1 font-semibold uppercase text-sm rounded',
                                    currentTab === tab
                                        ? 'bg-lul-orange text-white'
                                        : 'bg-lul-grey/20'
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* CSV & PREVIEW/LOGS */}
                {!creatingBulk && (
                    <div className="w-full h-full flex justify-between gap-x-4">
                        {/* LEFT: CSV text area */}
                        <div className="flex w-1/2">
                              <textarea
                                  value={csvText}
                                  onChange={(e) => {
                                      setCsvText(e.target.value)
                                      handlePreviewCSV()
                                  }}
                                  className="w-full bg-lul-black/20 rounded-md p-2 text-sm resize-none"
                                  placeholder={`EXAMPLE\n${bulkExamples[currentTab]}`}
                              />
                        </div>

                        {/* RIGHT: Preview or Logs (toggled) */}
                        <div className="w-1/2 bg-lul-grey/20 rounded-md p-2 border border-lul-light-grey flex flex-col">
                            <div className="h-full flex-grow">
                                {showLogs ? (
                                    // LOGS
                                    <div className="flex flex-col flex-1">
                                        <h2 className="text-lul-orange text-md font-bold uppercase mb-2">
                                            Logs
                                        </h2>
                                        {logEntries.length === 0 ? (
                                            <div className="text-lul-light-grey text-sm font-bold uppercase w-full h-full flex justify-center items-center">
                                                No items have been created yet
                                            </div>
                                        ) : (
                                            <ul className="flex flex-grow flex-col gap-y-2 text-sm overflow-y-scroll">
                                                {logEntries.map((entry, idx) => (
                                                    <li key={idx} className="bg-lul-black/20 p-2 rounded-md">
                                                        <p className="text-lul-green font-bold">
                                                            {entry.tab} [ID={entry.itemId}] @{' '}
                                                            {entry.createdAt}
                                                        </p>
                                                        <pre className="text-lul-light-grey mt-1">{JSON.stringify(entry.payload, null, 2)}</pre>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ) : (
                                    // PREVIEW
                                    <div className="flex-1">
                                        {csvParsed.length > 0 ? (
                                            csvParsed.map((row, idx) => (
                                                <div key={idx} className="text-sm text-lul-light-grey border-b border-lul-grey/40 py-1">
                                                    {JSON.stringify(row)}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex h-full items-center justify-center uppercase text-lul-orange font-semibold text-sm">
                                                Preview Here
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* BUTTONS: Toggle logs, and Create */}
                            <div className="mt-2 flex justify-center gap-x-3">
                                <button
                                    onClick={() => setShowLogs(!showLogs)}
                                    className="h-fit px-4 py-1 bg-lul-blue text-white uppercase text-sm font-bold rounded"
                                >
                                    {showLogs ? 'Show Preview' : 'Show Logs'}
                                </button>
                                <button
                                    onClick={handleCreateCSV}
                                    className="h-fit px-6 py-1 bg-lul-green text-white uppercase text-sm font-bold rounded"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {creatingBulk && <Loader/>}
            </div>

            {/* ==================================== */}
            {/* DATA VIEW (table listing) */}
            {/* ==================================== */}
            <DataViewPanel/>
        </Container>
    )
}

/**
 * DataViewPanel: pinned at the bottom, always visible
 * We do a small component that chooses a table, a page, a search,
 * fetches from server, and displays.
 */
function DataViewPanel() {
    const [loading, setLoading] = useState<boolean>(false)
    // state for pagination
    const [selectedTable, setSelectedTable] = useState('SEASON')
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')

    // fetched data
    const [items, setItems] = useState<any[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const pageSize = 20 // customize

    // method to load data
    async function loadData(table: string, pageN: number, searchVal: string) {
        try {
            setLoading(true)
            const res = await fetchTableDataAction({
                table,
                page: pageN,
                pageSize,
                search: searchVal || undefined,
            })
            if (res) {
                setItems(res.items)
                setTotalCount(res.totalCount)
            }
            setLoading(false)
        } catch (err) {
            setLoading(false)
            toast.error('Error loading data')
            console.error(err)
        }
    }

    // onMount or changes, load data
    useEffect(() => {
        loadData(selectedTable, page, search)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTable, page, search])

    const totalPages = Math.ceil(totalCount / pageSize) || 1

    return (
        <div className="relative flex flex-col flex-1 flex-grow gap-y-3 w-full bg-lul-dark-grey p-4 text-white transition-all duration-300 rounded h-1/2">
            {/* ==================================== */}
            {/* TITLE */}
            {/* ==================================== */}
            <h1 className="w-full flex flex-col justify-end text-lg text-white uppercase font-bold border-b border-lul-orange ">
                Data View
            </h1>
            {/* ==================================== */}
            {/* HEADER */}
            {/* ==================================== */}
            <div className="flex gap-x-3">
                {/* ==================================== */}
                {/* TABLE SELECTION */}
                {/* ==================================== */}
                <div className="flex flex-col items-center gap-y-1">
                    <label htmlFor="data-view-table" className="text-xs self-start uppercase font-bold">
                        Table
                    </label>
                    <select
                        id="data-view-table"
                        disabled={loading}
                        className="bg-lul-black/20 px-2 py-1 rounded"
                        value={selectedTable}
                        onChange={(e) => {
                            setPage(1)
                            setSelectedTable(e.target.value)
                        }}>
                        {DATA_TABLES.map((t) => (
                            <option key={t.value} value={t.value}>
                                {t.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* ==================================== */}
                {/* SEARCH */}
                {/* ==================================== */}
                <div className="flex flex-col items-center gap-y-1">
                    <label htmlFor="data-view-search" className="text-xs self-start uppercase font-bold">
                        Search
                    </label>
                    <input
                        id="data-view-search"
                        disabled={loading}
                        className="bg-lul-black/20 px-2 py-1 rounded"
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setPage(1)
                            setSearch(e.target.value)
                        }}
                    />
                </div>

                {/* ==================================== */}
                {/* TOTAL ROWS */}
                {/* ==================================== */}
                <div className="w-full h-full flex justify-end items-end text-lul-light-grey text-sm uppercase gap-x-2 font-bold">
                    <div className="-mb-1 text-xl text-white">{totalCount}</div>
                    <div>Total Rows</div>
                </div>

                {/* ==================================== */}
                {/* PAGE CONTROLS */}
                {/* ==================================== */}
                <div className="flex flex-col self-end gap-y-1">
                    <div className="self-end text-lul-light-grey gap-x-2 font-bold">
                        <p className="uppercase text-xs">
                            Page <span className="px-1 text-base text-white">{page}</span>of{' '}
                            <span className="px-1 text-base text-white">{totalPages}</span>
                        </p>
                    </div>

                    <div className="self-end flex gap-x-2">
                        <button
                            className="px-3 py-1 bg-lul-yellow text-sm rounded disabled:opacity-50 uppercase font-bold"
                            disabled={loading || page <= 1}
                            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        >
                            Prev
                        </button>
                        <button
                            className="px-3 py-1 bg-lul-blue text-sm rounded disabled:opacity-50 uppercase font-bold"
                            disabled={loading || page >= totalPages}
                            onClick={() => setPage((prev) => prev + 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* ==================================== */}
            {/* LOADING */}
            {/* ==================================== */}
            {loading && <Loader/>}

            {/* ==================================== */}
            {/* TABLE */}
            {/* ==================================== */}
            {!loading && (
                <>
                    <div className="h-full overflow-y-auto bg-lul-black/20 rounded-md p-2">
                        {items.length === 0 ? (
                            <p className="text-lul-light-grey uppercase text-sm font-bold text-center w-full">
                                No rows found.
                            </p>
                        ) : (
                            <table className="h-full w-full text-sm normal-case">
                                <thead>
                                <tr>
                                    {Object.keys(items[0]).map((k) => (
                                        <th key={k} className="bg-lul-dark-grey px-2 py-1 text-lul-orange text-left sticky -top-2">
                                            {k}
                                        </th>
                                    ))}
                                </tr>
                                </thead>

                                <tbody>
                                {items.map((row, idx) => (
                                    <tr
                                        key={idx}
                                        className={`hover:bg-lul-orange hover:text-lul-dark-grey hover:font-semibold ${
                                            idx % 2 === 0
                                                ? 'bg-lul-black/10'
                                                : 'bg-lul-black/20'
                                        }`}
                                    >
                                        {Object.entries(row).map(([k, val]) => {
                                            let displayVal = val
                                            if (typeof val === 'object' && val !== null) {
                                                displayVal = JSON.stringify(val)
                                            }
                                            const display = String(displayVal)
                                            return (
                                                <td
                                                    key={k}
                                                    className="px-2 py-1 cursor-pointer"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(display)
                                                        toast('Copied value to clipboard', {icon: '✍️'})
                                                    }}
                                                >
                                                    {display}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
