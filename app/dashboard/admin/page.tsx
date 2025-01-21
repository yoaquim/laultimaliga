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
} from './actions'
import { SeasonOption } from '@/dashboard/types'
import { getAllSeasons } from '@/dashboard/actions'

type AdminTab =
    | 'SEASONS'
    | 'TEAMS'
    | 'PLAYERS'
    | 'MATCHES'

/** Entities for DataView: We'll map them to the same table names, but let's rename to keep consistent: */
const DATA_TABLES = [
    {value: 'SEASON', label: 'Seasons'},
    {value: 'TEAM', label: 'Teams'},
    {value: 'PLAYER', label: 'Players'},
    {value: 'MATCH', label: 'Matches'},
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
            setCsvParsed([])
            setCsvText('')
        } catch (err) {
            toast.dismiss(toastId)
            setCreatingBulk(false)
            console.error('Bulk creation error:', err)
            toast.error('Error in bulk creation')
        }
    }

    // Updated CSV examples
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
        // [name, phone, size, position, seasonId, teamId, number,isCaptain]
            'name,phone,size,position,seasonId,teamId,number,isCaptain\n' +
            'John Doe,1234567890,MEDIUM,PG,season-uuid-1,team-uuid-1,23,true\n' +
            'Jane Smith,0987654321,LARGE,SG,season-uuid-1,team-uuid-2,45,false\n' +
            'Mike Johnson,1122334455,X_LARGE,C,season-uuid-2,team-uuid-3,12,false\n',
        MATCHES:
            'homeTeamId,awayTeamId,seasonId,dateString\n' +
            'team-uuid-1,team-uuid-2,season-uuid-1,2025-03-10\n' +
            'team-uuid-3,team-uuid-4,season-uuid-1,2025-03-15\n' +
            'team-uuid-5,team-uuid-6,season-uuid-2,2025-03-20\n',
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
            {/* TOP PANEL (Tabs) */}
            {/* ==================================== */}
            <div className="flex flex-col h-1/3 w-full bg-lul-grey/20 rounded-md p-4">
                {/* HEADER WITH TABS */}
                <div className="flex pb-1.5 mb-2 border-b border-lul-orange">
                    <h1 className="flex-1 flex flex-col justify-end text-lg text-white uppercase font-bold">
                        {/* Title changes if we are in MATCHES or PARTICIPATIONS */}
                        {currentTab === 'MATCHES'
                            ? 'Generate Round-Robin Matches'
                            : `Bulk ${currentTab} Creation via CSV`}
                    </h1>
                    <div className="flex justify-between items-start gap-x-3">
                        {(['SEASONS', 'TEAMS', 'PLAYERS', 'MATCHES'] as AdminTab[])
                            .map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => {
                                        setCurrentTab(tab)
                                        setCsvText('')
                                        setCsvParsed([])
                                        setCreatingBulk(false)
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

                {/* CONTENT: 3 CSV tabs or 2 custom tabs */}
                <div className="flex-1 w-full">
                    {/* 1) If tab is one of [SEASONS, TEAMS, PLAYERS] => show CSV panel */}
                    {['SEASONS', 'TEAMS', 'PLAYERS', 'MATCHES'].includes(currentTab)
                        && (currentTab === 'SEASONS'
                            || currentTab === 'TEAMS'
                            || currentTab === 'PLAYERS') && !creatingBulk && (
                            <div className="w-full h-full flex justify-between gap-x-4">
                                {/* CSV TEXT AREA */}
                                <div className="flex w-1/2">
                                      <textarea
                                          value={csvText}
                                          onChange={(e) => setCsvText(e.target.value)}
                                          className="w-full bg-lul-black/20 rounded-md p-2 text-sm resize-none"
                                          placeholder={`EXAMPLE\n${bulkExamples[currentTab]}`}
                                      />
                                </div>

                                {/* LOGS */}
                                <div className="w-1/2 bg-lul-grey/20 rounded-md p-2 border border-lul-light-grey flex flex-col overflow-hidden">
                                    <div className="h-full flex-grow flex flex-col">
                                        <div className="flex flex-col flex-1">
                                            <h2 className="text-lul-orange text-md font-bold uppercase mb-2">
                                                Logs
                                            </h2>
                                            {logEntries.filter(e =>
                                                ['SEASONS', 'TEAMS', 'PLAYERS'].includes(e.tab)
                                            ).length === 0 ? (
                                                <div className="text-lul-light-grey text-sm font-bold uppercase w-full h-full flex justify-center items-center">
                                                    No items have been created yet
                                                </div>
                                            ) : (
                                                <ul className="flex flex-col gap-y-2 text-sm overflow-y-auto flex-grow">
                                                    {logEntries
                                                        .filter(e => ['SEASONS', 'TEAMS', 'PLAYERS'].includes(e.tab))
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

                                    {/* BUTTONS: Toggle logs, and Create */}
                                    <div className="mt-2 flex justify-center gap-x-3">
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

                    {/* Show loader if creating for those first 3 tabs */}
                    {['SEASONS', 'TEAMS', 'PLAYERS'].includes(currentTab) && creatingBulk && <Loader/>}

                    {/* 2) If tab is MATCHES => Show "round-robin" panel (no CSV) */}
                    {currentTab === 'MATCHES' && <MatchesTabPanel/>}
                </div>
            </div>

            {/* ==================================== */}
            {/* DATA VIEW (table listing) */}
            {/* ==================================== */}
            <DataViewPanel/>
        </Container>
    )
}

/** The Matches tab: let's let admin pick a Season and generate a single round robin. */
function MatchesTabPanel() {
    const [loading, setLoading] = useState(false)
    const [seasons, setSeasons] = useState<SeasonOption[]>([])
    const [selectedSeason, setSelectedSeason] = useState('')

    // On mount, fetch seasons
    useEffect(() => {
        async function loadSeasons() {
            try {
                setLoading(true)
                // You can fetch from your own route or the same page's /api
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
        if (!selectedSeason) {
            toast.error('Please select a Season first.')
            return
        }
        setLoading(true)
        const tid = toast.loading('Generating round-robin matches...')
        try {
            const res = await generateRoundRobinMatches(selectedSeason)
            toast.dismiss(tid)
            if (res?.msg) {
                toast.success(res.msg)
            } else {
                toast.success(
                    `Created ${res.createdMatches} matches + ${res.createdParticipations} participations.`
                )
            }
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
        <div className="flex flex-col gap-y-4 h-full items-center justify-center">
            <p className="text-sm text-lul-light-grey">
                Select a season, then click "Create Matches" to generate a single
                round-robin schedule (each team plays every other team once),
                plus automatically create player participations/stats=0.
            </p>

            {/* Season dropdown */}
            <div className="w-full flex flex-col items-center gap-x-2">
                <label className="uppercase text-sm font-bold">Season:</label>
                <select
                    className="w-1/4 bg-lul-black/20 px-3 py-1 rounded text-white"
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(e.target.value)}
                >
                    <option value="">-- Select --</option>
                    {seasons.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Button */}
            <button
                onClick={handleGenerate}
                className="px-6 py-2 bg-lul-green text-white uppercase text-sm font-bold rounded"
            >
                Create Matches
            </button>
        </div>
    )
}

/** The Participations tab:
 *  Example: either let the user manually add a single participation,
 *  or show a message that everything was created automatically with matches.
 */
function ParticipationsTabPanel() {
    const [loading, setLoading] = useState(false)
    const [players, setPlayers] = useState<any[]>([])
    const [matches, setMatches] = useState<any[]>([])
    const [selectedPlayer, setSelectedPlayer] = useState('')
    const [selectedMatch, setSelectedMatch] = useState('')

    // Example data load:
    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true)
                const [pRes, mRes] = await Promise.all([
                    fetch('/api/players'),
                    fetch('/api/matches'),
                ])
                const [pData, mData] = await Promise.all([pRes.json(), mRes.json()])
                setPlayers(pData)
                setMatches(mData)
                setLoading(false)
            } catch (err) {
                setLoading(false)
                toast.error('Error loading players/matches')
                console.error(err)
            }
        }

        loadData()
    }, [])

    async function handleAddParticipation() {
        if (!selectedPlayer || !selectedMatch) {
            toast.error('Select both a Player and a Match first.')
            return
        }
        setLoading(true)
        const tid = toast.loading('Adding participation...')
        try {
            // minimal example: calling your own POST route
            // You can also do a direct server action, etc.
            const res = await fetch('/api/participations', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({playerId: selectedPlayer, matchId: selectedMatch}),
            })
            const data = await res.json()
            toast.dismiss(tid)
            if (res.ok) {
                toast.success(`Participation created (id=${data.id})`)
            } else {
                toast.error('Error creating participation')
            }
            setLoading(false)
        } catch (err) {
            toast.dismiss(tid)
            toast.error('Error creating participation')
            console.error(err)
            setLoading(false)
        }
    }

    if (loading) return <Loader/>

    return (
        <div className="flex flex-col gap-y-4 h-full items-center justify-center">
            <p className="text-sm text-lul-light-grey">
                This tab optionally lets you add a single Player-Match participation
                in case you need to fix or add extra records. Typically, the
                "Matches" tab already creates them automatically.
            </p>

            <div className="flex gap-x-4">
                {/* Player dropdown */}
                <div className="flex flex-col">
                    <label className="uppercase text-xs font-bold">Player</label>
                    <select
                        className="bg-lul-black/20 px-3 py-1 rounded text-white"
                        value={selectedPlayer}
                        onChange={(e) => setSelectedPlayer(e.target.value)}
                    >
                        <option value="">-- select player --</option>
                        {players.map((p: any) => (
                            <option key={p.id} value={p.id}>
                                {p.user?.name ?? 'Unknown'} (ID={p.id.slice(0, 8)})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Match dropdown */}
                <div className="flex flex-col">
                    <label className="uppercase text-xs font-bold">Match</label>
                    <select
                        className="bg-lul-black/20 px-3 py-1 rounded text-white"
                        value={selectedMatch}
                        onChange={(e) => setSelectedMatch(e.target.value)}
                    >
                        <option value="">-- select match --</option>
                        {matches.map((m: any) => (
                            <option key={m.id} value={m.id}>
                                Match {m.id.slice(0, 8)}
                                {m.homeTeamId && ` [Home=${m.homeTeamId.slice(0, 4)}]`}
                                {m.awayTeamId && ` vs [Away=${m.awayTeamId.slice(0, 4)}]`}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <button
                onClick={handleAddParticipation}
                className="px-6 py-2 bg-lul-green text-white uppercase text-sm font-bold rounded"
            >
                Add Participation
            </button>
        </div>
    )
}

/**
 * DataViewPanel: pinned at the bottom, always visible
 * We do a small component that chooses a table, a page, a search,
 * fetches from server, and displays.
 * [Unchanged from your code, included below verbatim]
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
