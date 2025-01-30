'use client'

import React, { useState, useEffect } from 'react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import { Container } from '@/ui/container'
import Loader from '@/ui/loader'

import {
    bulkCreateSeasonsAction,
    bulkCreateTeamsAction,
    bulkCreatePlayersAction,
    fetchTableDataAction,
    generateRoundRobinMatches,
    bulkCreateMatchesWithParticipationsAction, // NEW server action
} from './actions'
import { SeasonOption } from '@/dashboard/types'
import { getAllSeasons } from '@/dashboard/actions'

type AdminTab = 'SEASONS' | 'TEAMS' | 'PLAYERS' | 'MATCHES' | 'ROUNDROBIN'

/** Entities for DataView: We'll map them to the same table names, but let's rename for clarity: */
const DATA_TABLES = [
    {value: 'SEASON', label: 'Seasons'},
    {value: 'TEAM', label: 'Teams'},
    {value: 'PLAYER', label: 'Players'},
    {value: 'MATCH', label: 'Matches'},
]

/** Main Admin Dashboard Page */
export default function AdminDashboardPage() {
    const [currentTab, setCurrentTab] = useState<AdminTab>('SEASONS')

    // Logs
    const [logEntries, setLogEntries] = useState<{ tab: AdminTab; itemId: string; payload: any; createdAt: string }[]>([])

    // CSV states
    const [creatingBulk, setCreatingBulk] = useState(false)
    const [csvText, setCsvText] = useState('')

    // ---------------------------------------
    // No preview. We'll parse CSV on create.
    // ---------------------------------------
    function parseCSV(text: string) {
        const lines = text.trim().split('\n')
        if (!lines.length) throw new Error('No CSV data found.')
        const parsed: string[][] = []
        for (const line of lines) {
            const columns = line.split(',').map((c) => c.trim())
            parsed.push(columns)
        }
        return parsed
    }

    async function handleCreateCSV() {
        setCreatingBulk(true)
        const toastId = toast.loading(`Bulk Creating ${currentTab.toLowerCase()}...`)
        try {
            const parsed = parseCSV(csvText)
            if (!parsed.length) {
                toast.dismiss(toastId)
                toast.error('Nothing to create.')
                setCreatingBulk(false)
                return
            }

            let result: any[] = []
            switch (currentTab) {
                case 'SEASONS':
                    result = await bulkCreateSeasonsAction(parsed)
                    break
                case 'TEAMS':
                    result = await bulkCreateTeamsAction(parsed)
                    break
                case 'PLAYERS':
                    result = await bulkCreatePlayersAction(parsed)
                    break
                case 'MATCHES':
                    // Our new CSV-based matches creation with participations
                    result = await bulkCreateMatchesWithParticipationsAction(parsed)
                    break
                case 'ROUNDROBIN':
                    // This tab won't do CSV. We'll handle it separately below
                    break
            }

            toast.success('Bulk creation successful')
            toast.dismiss(toastId)

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
            setCsvText('')
        } catch (err) {
            toast.dismiss(toastId)
            setCreatingBulk(false)
            console.error('Bulk creation error:', err)
            toast.error('Error in bulk creation')
        }
    }

    // CSV placeholders
    const bulkExamples: Record<AdminTab, string> = {
        SEASONS:
            'name,shortName,startDate,endDate\n' +
            'Spring 2025,S25,2025-03-01,2025-06-01\n' +
            'Summer 2025,SU25,2025-06-02,2025-09-01\n' +
            'Fall 2025,F25,2025-09-02,2025-12-01\n',
        TEAMS:
            'seasonId,name,logo\n' +
            'season-uuid-1,Lions,lions.png\n' +
            'season-uuid-1,Tigers,tigers.png\n' +
            'season-uuid-2,Sharks,sharks.png\n',
        PLAYERS:
        // [name, phone, size, position, seasonId, teamId, number, isCaptain]
            'name,phone,shirtSize,pantsSize,position,seasonId,teamId,number,isCaptain\n' +
            'John Doe,1234567890,MEDIUM,MEDIUM,PG,season-uuid-1,team-uuid-1,23,true\n' +
            'Jane Smith,0987654321,LARGE,X_LARGE,SG,season-uuid-1,team-uuid-2,45,false\n' +
            'Mike Johnson,1122334455,X_LARGE,XX_LARGE,C,season-uuid-2,team-uuid-3,12,false\n',
        ROUNDROBIN: '',
        MATCHES:
        // [homeTeamId, awayTeamId, seasonId, dateString, location]
            'homeTeamId,awayTeamId,seasonId,dateString,location\n' +
            'team-uuid-1,team-uuid-2,season-uuid-1,2025-03-10,location_one\n' +
            'team-uuid-3,team-uuid-4,season-uuid-1,2025-03-15,location_one\n' +
            'team-uuid-5,team-uuid-6,season-uuid-2,2025-03-20,location_two\n',
    }

    return (
        <Container
            color="orange"
            title="Admin Dashboard"
            className="w-full h-full text-white flex flex-col pb-0 gap-y-4 overflow-y-hidden"
        >
            {/* ==================================== */}
            {/* HEADER WITH TABS */}
            {/* ==================================== */}
            <div className="flex flex-col h-1/3 w-full bg-lul-grey/20 rounded-md p-4 overflow-y-hidden">
                <div className="flex pb-1.5 mb-2 border-b border-lul-orange">
                    <h1 className="flex-1 flex flex-col justify-end text-lg text-white uppercase font-bold">
                        {currentTab === 'ROUNDROBIN'
                            ? 'Generate Round-Robin Matches'
                            : `Bulk ${currentTab} Creation via CSV`}
                    </h1>
                    <div className="flex items-start gap-x-3">
                        {(['SEASONS', 'TEAMS', 'PLAYERS', 'MATCHES', 'ROUNDROBIN'] as AdminTab[])
                            .map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => {
                                        setCurrentTab(tab)
                                        setCreatingBulk(false)
                                        setCsvText('')
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

                {/* ==================================== */}
                {/* CONTENT */}
                {/* ==================================== */}
                <div className="flex-1 flex-grow flex overflow-y-auto">
                    {/* 1) If tab is SEASONS, TEAMS, PLAYERS, MATCHES => show CSV area & logs */}
                    {(['SEASONS', 'TEAMS', 'PLAYERS', 'MATCHES'] as AdminTab[]).includes(currentTab) && !creatingBulk && (
                        <div className="w-full flex flex-1 overflow-y-auto gap-x-4">
                            {/* LEFT: CSV text area */}
                            <div className="flex flex-col w-1/2">
                                <textarea
                                    value={csvText}
                                    onChange={(e) => setCsvText(e.target.value)}
                                    className="h-full w-full bg-lul-black/20 rounded-md p-2 text-sm resize-none"
                                    placeholder={`EXAMPLE\n${bulkExamples[currentTab]}`}
                                />
                                {/* CREATE BUTTON */}
                                <div className="mt-2 flex justify-center">
                                    <button
                                        onClick={handleCreateCSV}
                                        className="w-full px-6 py-1.5 bg-lul-green hover:bg-lul-green/80 text-white uppercase text-sm font-bold rounded"
                                    >
                                        Create
                                    </button>
                                </div>
                            </div>

                            {/* RIGHT: LOGS */}
                            <div className="w-1/2 bg-lul-grey/20 rounded-md p-2 border border-lul-light-grey flex flex-col">
                                <h2 className="text-lul-orange text-md font-bold uppercase mb-2">
                                    Logs
                                </h2>
                                {logEntries.filter(e => e.tab === currentTab).length === 0 ? (
                                    <div className="text-lul-light-grey text-sm font-bold uppercase w-full h-full flex justify-center items-center">
                                        No items created yet for {currentTab}
                                    </div>
                                ) : (
                                    <ul className="flex flex-col gap-y-2 text-sm overflow-y-scroll">
                                        {logEntries
                                            .filter(e => e.tab === currentTab)
                                            .map((entry, idx) => (
                                                <li key={idx} className="bg-lul-black/20 p-2 rounded-md">
                                                    <p className="text-lul-green font-bold">
                                                        {entry.tab} [ID={entry.itemId}] @ {entry.createdAt}
                                                    </p>
                                                    <pre className="text-lul-light-grey mt-1">
                              {JSON.stringify(entry.payload, null, 2)}
                            </pre>
                                                </li>
                                            ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 2) Show loader if creating */}
                    {(['SEASONS', 'TEAMS', 'PLAYERS', 'MATCHES'] as AdminTab[]).includes(currentTab) && creatingBulk && <Loader/>}

                    {/* 3) If tab is ROUNDROBIN => show round-robin panel (no CSV) */}
                    {currentTab === 'ROUNDROBIN' && <RoundRobinTabPanel/>}
                </div>
            </div>

            {/* ==================================== */}
            {/* DATA VIEW (table listing) */}
            {/* ==================================== */}
            <DataViewPanel/>
        </Container>
    )
}

/** Round Robin tab: just a season dropdown + button to run generateRoundRobinMatches. */
function RoundRobinTabPanel() {
    const [loading, setLoading] = useState(false)
    const [seasonId, setSeasonId] = useState('')
    const [seasons, setSeasons] = useState<SeasonOption[]>([])

    useEffect(() => {
        async function loadSeasons() {
            try {
                setLoading(true)
                const seasonOptions: SeasonOption[] = await getAllSeasons()
                setSeasons(seasonOptions)
                setLoading(false)
            } catch (err) {
                setLoading(false)
                toast.error('Error loading seasons')
                console.error(err)
            }
        }

        loadSeasons()
    }, [])

    async function handleGenerate() {
        if (!seasonId) {
            toast.error('Please select a Season.')
            return
        }
        setLoading(true)
        const tid = toast.loading('Generating round-robin matches...')
        try {
            const res = await generateRoundRobinMatches(seasonId)
            toast.dismiss(tid)
            if (res?.msg) toast.success(res.msg)
            setLoading(false)
        } catch (err) {
            toast.dismiss(tid)
            toast.error('Error generating matches')
            console.error(err)
            setLoading(false)
        }
    }

    if (loading) return <Loader/>

    return (
        <div className="flex flex-col h-full items-center justify-center gap-y-4">
            <p className="text-sm text-lul-light-grey">
                Select a season, then click "Generate" to create a single round-robin schedule
                (each team plays every other team once), plus automatically create
                participations/stats=0 for all players in those teams.
            </p>

            <div className="flex items-center gap-x-2">
                <label className="uppercase text-sm font-bold">Season:</label>
                <select
                    className="bg-lul-black/20 px-3 py-1 rounded text-white"
                    value={seasonId}
                    onChange={(e) => setSeasonId(e.target.value)}
                >
                    <option value="">-- Select --</option>
                    {seasons.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>
                    ))}
                </select>
            </div>

            <button
                onClick={handleGenerate}
                className="px-6 py-2 bg-lul-green text-white uppercase text-sm font-bold rounded"
            >
                Generate
            </button>
        </div>
    )
}

/**
 * DataViewPanel: pinned at the bottom, always visible
 * We do a small component that chooses a table, a page, a search,
 * fetches from server, and displays. (Unmodified from your snippet)
 */
function DataViewPanel() {
    const [loading, setLoading] = useState<boolean>(false)
    const [selectedTable, setSelectedTable] = useState('SEASON')
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')

    const [items, setItems] = useState<any[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const pageSize = 20

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

    useEffect(() => {
        loadData(selectedTable, page, search)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTable, page, search])

    const totalPages = Math.ceil(totalCount / pageSize) || 1

    return (
        <div className="relative flex flex-col flex-1 flex-grow gap-y-3 w-full bg-lul-dark-grey p-4 text-white transition-all duration-300 rounded h-1/2">
            <h1 className="w-full flex flex-col justify-end text-lg text-white uppercase font-bold border-b border-lul-orange ">
                Data View
            </h1>
            <div className="flex gap-x-3">
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

                <div className="w-full h-full flex justify-end items-end text-lul-light-grey text-sm uppercase gap-x-2 font-bold">
                    <div className="-mb-1 text-xl text-white">{totalCount}</div>
                    <div>Total Rows</div>
                </div>

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

            {loading && <Loader/>}

            {!loading && (
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
                                    <th
                                        key={k}
                                        className="bg-lul-dark-grey px-2 py-1 text-lul-orange text-left sticky -top-2"
                                    >
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
            )}
        </div>
    )
}
