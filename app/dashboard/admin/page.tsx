'use client'

import React, { useState, useEffect } from 'react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import { JSONSchemaType } from 'ajv'
import { AutoForm, AutoFields, ErrorsField, SubmitField } from '@/ui/uniforms'
import { DateField } from '@/ui/uniforms'
import createSchemaBridge from './single-entity-creator-validator'

import {
    createSeasonAction,
    createTeamAction,
    createPlayerAction,
    createMatchAction,
    createPSDetailsAction,
    createParticipationAction,
    bulkCreateSeasonsAction,
    bulkCreateTeamsAction,
    bulkCreatePlayersAction,
    bulkCreateMatchesAction,
    bulkCreatePSDetailsAction,
    bulkCreateParticipationsAction,
    fetchTableDataAction,
} from './actions'
import Loader from '@/ui/loader'
import { Size, Position } from '@prisma/client'


/** Entities for DataView: We'll map them to the same table names, but let's rename to keep consistent: */
const DATA_TABLES = [
    {value: 'SEASON', label: 'Seasons'},
    {value: 'TEAM', label: 'Teams'},
    {value: 'PLAYER', label: 'Players'},
    {value: 'MATCH', label: 'Matches'},
    {value: 'PSDETAILS', label: 'PlayerSeasonDetails'},
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

    // Single Creation states
    const [creatingSingle, setCreatingSingle] = useState<boolean>(false)

    // CSV states
    const [creatingBulk, setCreatingBulk] = useState<boolean>(false)
    const [csvText, setCsvText] = useState('')
    const [csvParsed, setCsvParsed] = useState<any[]>([])
    const [bulkPreview, setBulkPreview] = useState(false)

    // Single-entity schemas
    const formSchemas: Record<AdminTab, JSONSchemaType<SECSchemaType>> = {
        SEASONS: {
            title: 'Season',
            type: 'object',
            required: ['name', 'shortName', 'startDate', 'endDate'],
            properties: {
                name: {type: 'string', title: 'Name'},
                shortName: {type: 'string', title: 'Short Name'},
                startDate: {
                    type: 'string',
                    format: 'date',
                    title: 'Start Date',
                    uniforms: {component: DateField},
                },
                endDate: {
                    type: 'string',
                    format: 'date',
                    title: 'End Date',
                    uniforms: {component: DateField},
                },
            },
        },
        TEAMS: {
            title: 'Team',
            type: 'object',
            required: ['name', 'seasonId'],
            properties: {
                seasonId: {type: 'string', title: 'Season ID'},
                name: {type: 'string', title: 'Team Name'},
                logo: {type: 'string', title: 'Logo Path'},
            },
        },
        PLAYERS: {
            title: 'Player',
            type: 'object',
            required: ['name', 'phone', 'size'],
            properties: {
                name: {type: 'string', title: 'Full Name'},
                phone: {type: 'string', title: 'Phone'},
                size: {
                    type: 'string',
                    title: 'Size',
                    enum: Object.keys(Size)
                },
                position: {
                    type: 'string',
                    title: 'Position',
                    enum: Object.keys(Position)
                },
            },
        },
        MATCHES: {
            title: 'Match',
            type: 'object',
            required: ['homeTeamId', 'awayTeamId', 'seasonId', 'date'],
            properties: {
                homeTeamId: {type: 'string', title: 'Home Team ID'},
                awayTeamId: {type: 'string', title: 'Away Team ID'},
                seasonId: {type: 'string', title: 'Season ID'},
                date: {
                    type: 'string',
                    format: 'date',
                    title: 'Date',
                    uniforms: {component: DateField},
                },
            },
        },
        PSDETAILS: {
            title: 'PlayerSeasonDetails',
            type: 'object',
            required: ['playerId', 'seasonId', 'number'],
            properties: {
                playerId: {type: 'string', title: 'Player ID'},
                seasonId: {type: 'string', title: 'Season ID'},
                teamId: {type: 'string', title: 'Team ID'},
                number: {type: 'number', title: 'Jersey Number'},
            },
        },
        PARTICIPATIONS: {
            title: 'PlayerMatchParticipation',
            type: 'object',
            required: ['playerId', 'matchId'],
            properties: {
                playerId: {type: 'string', title: 'Player ID'},
                matchId: {type: 'string', title: 'Match ID'},
            },
        },
    }

    // Build the uniform schema for the current tab
    const currentSchema = formSchemas[currentTab]
    let schemaBridge: any = null
    if (currentSchema) {
        schemaBridge = createSchemaBridge(currentSchema)
    }

    // -------------------------------
    // Single Create
    // -------------------------------
    async function handleCreateSingle(data: any) {
        setCreatingSingle(true)
        const toastId = toast.loading(`Creating ${currentTab.toLowerCase()}...`)
        try {
            let created: any
            switch (currentTab) {
                case 'SEASONS':
                    created = await createSeasonAction(data)
                    break
                case 'TEAMS':
                    created = await createTeamAction(data)
                    break
                case 'PLAYERS':
                    created = await createPlayerAction(data)
                    break
                case 'MATCHES':
                    created = await createMatchAction(data)
                    break
                case 'PSDETAILS':
                    created = await createPSDetailsAction(data)
                    break
                case 'PARTICIPATIONS':
                    created = await createParticipationAction(data)
                    break
            }

            toast.dismiss(toastId)
            toast.success('Created successfully!')
            setCreatingSingle(false)
            if (created?.id) {
                // push into ephemeral log
                setLogEntries((prev) => [
                    ...prev,
                    {
                        tab: currentTab,
                        itemId: created.id,
                        payload: data,
                        createdAt: new Date().toLocaleString(),
                    },
                ])
            }
        } catch (err) {
            toast.dismiss(toastId)
            setCreatingSingle(false)
            console.error('Error creating item:', err)
            toast.error('Error creating item')
        }
    }

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
            toast('Preview Rendered', {icon: '🚧'})
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
                return
            }

            switch (currentTab) {
                case 'SEASONS':
                    await bulkCreateSeasonsAction(csvParsed)
                    break
                case 'TEAMS':
                    await bulkCreateTeamsAction(csvParsed)
                    break
                case 'PLAYERS':
                    await bulkCreatePlayersAction(csvParsed)
                    break
                case 'MATCHES':
                    await bulkCreateMatchesAction(csvParsed)
                    break
                case 'PSDETAILS':
                    await bulkCreatePSDetailsAction(csvParsed)
                    break
                case 'PARTICIPATIONS':
                    await bulkCreateParticipationsAction(csvParsed)
                    break
            }

            toast.success('Bulk creation successful')
            toast.dismiss(toastId)
            setCreatingBulk(false)
            setBulkPreview(false)
            setCsvParsed([])
            setCsvText('')
        } catch (err) {
            toast.dismiss(toastId)
            setCreatingBulk(false)
            console.error('Bulk creation error:', err)
            toast.error('Error in bulk creation')
        }
    }

    const bulkExamples: Record<AdminTab, string> = {
        SEASONS: 'name,shortName,startDate,endDate\n' +
            'Spring 2025,S25,2025-03-01,2025-06-01\n' +
            'Summer 2025,SU25,2025-06-02,2025-09-01\n' +
            'Fall 2025,F25,2025-09-02,2025-12-01\n',
        TEAMS: 'seasonId,name,logo\n' +
            'season-uuid-1,Lions ,season-name/logo.png\n' +
            'season-uuid-1,Tigers,season-name/logo.png\n' +
            'season-uuid-2,Sharks,season-name/logo.png\n',
        PLAYERS: 'name,phone,position,size,userId\n' +
            'John Doe,1234567890,PG,MEDIUM,user-uuid-1\n' +
            'Jane Smith,0987654321,SG,LARGE,user-uuid-2\n' +
            'Mike Johnson,1122334455,C,X_LARGE,user-uuid-3\n',
        MATCHES: 'status,date,homeTeamId,awayTeamId,seasonId,homeScore,awayScore,winnerId\n' +
            'SCHEDULED,2025-03-10,team-uuid-1,team-uuid-2,season-uuid-1,0,0,\n' +
            'ONGOING,2025-03-15,team-uuid-3,team-uuid-4,season-uuid-1,40,35,\n' +
            'COMPLETED,2025-03-20,team-uuid-5,team-uuid-6,season-uuid-2,70,80,team-uuid-6\n',
        PSDETAILS: 'playerId,seasonId,teamId,number\n' +
            'player-uuid-1,season-uuid-1,team-uuid-1,23\n' +
            'player-uuid-2,season-uuid-1,team-uuid-2,45\n' +
            'player-uuid-3,season-uuid-2,team-uuid-3,12\n',
        PARTICIPATIONS: 'playerId,matchId\n' +
            'player-uuid-1,match-uuid-1\n' +
            'player-uuid-2,match-uuid-1\n' +
            'player-uuid-3,match-uuid-2\n'
    }
    // --------------------------------
    // RENDER
    // --------------------------------
    return (
        <div className="w-full h-full text-white flex flex-col py-8 gap-y-6 overflow-y-hidden">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>

            {/* ==================================== */}
            {/* TABS */}
            {/* ==================================== */}
            <div className="w-full flex justify-center gap-x-6">
                {(['SEASONS', 'TEAMS', 'PLAYERS', 'MATCHES', 'PSDETAILS', 'PARTICIPATIONS',] as AdminTab[]
                ).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => {
                            setCurrentTab(tab)
                            setCsvText('')
                            setBulkPreview(false)
                            setCsvParsed([])
                        }}
                        className={clsx(
                            'px-4 py-2 font-semibold uppercase text-sm rounded',
                            currentTab === tab ? 'bg-lul-blue text-black' : 'bg-lul-grey/20'
                        )}>
                        {tab}
                    </button>
                ))}
            </div>

            <div className="h-full flex flex-col gap-y-6">
                {/* ==================================== */}
                {/* CREATE ENTITIES */}
                {/* ==================================== */}

                <div className="w-full max-h-1/3 h-1/3 flex flex-row gap-x-4">
                    {/* ==================================== */}
                    {/* SINGLE CREATION */}
                    {/* ==================================== */}
                    <div className="h-full w-1/2 bg-lul-dark-grey rounded-md p-4 overflow-y-hidden">
                        <h1 className="text-xl font-bold uppercase mb-4 text-lul-orange">Create {currentTab}</h1>

                        <div className="w-full h-full flex justify-center pb-12">
                            {formSchemas[currentTab] && !creatingSingle && (
                                <div className="w-full -h-full flex flex-col gap-y-4 text-lul-black overflow-y-scroll">
                                    <AutoForm
                                        schema={schemaBridge}
                                        onSubmit={(model) => handleCreateSingle(model)}>
                                        <div className="w-full flex justify-center">
                                            <div className="w-2/3 flex flex-col gap-y-3 overflow-y-scroll h-full">
                                                <AutoFields/>
                                                <ErrorsField className="text-lul-red"/>
                                                <div className="w-full flex justify-center">
                                                    <SubmitField
                                                        value={`Submit`}
                                                        className="w-full px-4 py-2 mt-2 bg-lul-blue text-white uppercase text-sm font-bold rounded hover:bg-lul-blue/70 transition-colors cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </AutoForm>
                                </div>
                            )}
                            {creatingSingle && <Loader/>}
                        </div>
                    </div>


                    {/* ==================================== */}
                    {/* BULK CSV CREATION */}
                    {/* ==================================== */}
                    <div className="w-1/2 flex flex-col bg-lul-grey/20 rounded-md p-4 flex-1">

                        <h2 className="text-xl font-bold uppercase mb-2 text-lul-orange">Bulk {currentTab} via CSV</h2>

                        {!creatingBulk && <>
                            <p className="text-xs text-lul-light-grey mb-2">Paste CSV lines, then Preview, then Create if valid.</p>
                            <textarea
                                value={csvText}
                                onChange={(e) => setCsvText(e.target.value)}
                                className="flex flex-grow h-full w-full bg-lul-black/20 rounded-md p-2 text-sm resize-none"
                                placeholder={`EXAMPLE\n${bulkExamples[currentTab]}`}
                            />

                            {bulkPreview && (
                                <div className="mt-4 bg-lul-dark-grey rounded-md p-2 max-h-40 overflow-y-auto">
                                    <h3 className="text-md font-semibold text-lul-orange mb-2 uppercase">Preview</h3>
                                    {csvParsed.map((row, idx) => (
                                        <div
                                            key={idx}
                                            className="text-sm text-lul-light-grey border-b border-lul-grey/40 py-1"
                                        >
                                            {JSON.stringify(row)}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-4 flex justify-center gap-x-6">
                                <button onClick={handlePreviewCSV} className="h-fit px-4 py-1 bg-lul-blue text-white uppercase text-sm font-bold rounded">
                                    Preview
                                </button>
                                <button onClick={handleCreateCSV} className="h-fit px-6 py-1 bg-lul-green text-white uppercase text-sm font-bold rounded">
                                    Create
                                </button>
                            </div>
                        </>}

                        {creatingBulk && <Loader/>}
                    </div>
                </div>

                {/* ==================================== */}
                {/* LOG WINDOW */}
                {/* ==================================== */}
                <div className="w-full max-h-1/3 h-1/3 flex flex-col bg-lul-dark-grey rounded p-4">
                    <h2 className="text-xl font-bold uppercase text-lul-orange ">
                        LOGS
                    </h2>

                    {logEntries.length === 0
                        ? (
                            <div className="text-lul-light-grey text-sm font-bold uppercase w-full h-full flex justify-center items-center">
                                No items have been created yet
                            </div>
                        )
                        : (
                            <ul className="flex flex-col gap-y-2 text-sm overflow-y-scroll">
                                {logEntries.map((entry, idx) => (
                                    <li key={idx} className="bg-lul-black/20 p-2 rounded-md">
                                        <p className="text-lul-green font-bold">
                                            {entry.tab} [ID={entry.itemId}] @ {entry.createdAt}
                                        </p>
                                        <pre className="text-lul-light-grey mt-1">{JSON.stringify(entry.payload, null, 2)}</pre>
                                    </li>
                                ))}
                            </ul>
                        )}
                </div>

                {/* ==================================== */}
                {/* DATA VIEW */}
                {/* ==================================== */}
                <DataViewPanel/>
            </div>
        </div>
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
    const pageSize = 10 // customize

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
        <div className="relative flex  flex-col  gap-y-4 w-full bg-lul-dark-grey p-4 text-white transition-all duration-300 rounded max-h-1/3 h-1/3">
            <h2 className="text-lg font-bold uppercase text-lul-orange">Data View</h2>

            {/* Controls */}
            <div className="w-full flex items-center gap-x-4 mb-4">
                <div className="flex flex-col items-center gap-y-1">
                    <label htmlFor="data-view-table" className="text-xs self-start uppercase font-bold">Table</label>
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
                    <label htmlFor="data-view-search" className="text-xs self-start uppercase font-bold">Search</label>
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

                <div className="w-full h-full self-end flex flex-grow justify-end items-end text-lul-light-grey text-sm uppercase gap-x-2 font-bold">
                    <div className="-mb-1 text-xl text-white">{totalCount}</div>
                    <div>Total Rows</div>
                </div>

                <div className="flex flex-col self-end gap-y-1">
                    <div className="self-end text-lul-light-grey gap-x-2 font-bold">
                        <p className="uppercase text-xs">Page <span className="px-1 text-base text-white">{page}</span>of <span className="px-1 text-base text-white">{totalPages}</span></p>
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

            {!loading && <>
                {/* Table */}
                <div className="max-h-60 overflow-y-auto bg-lul-black/20 rounded-md p-2">
                    {items.length === 0 ? (
                        <p className="text-lul-light-grey uppercase text-sm font-bold text-center w-full">No rows found.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                            <tr>
                                {/* We'll just display first few keys or all keys */}
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
                                    className={idx % 2 === 0 ? 'bg-lul-black/10' : 'bg-lul-black/20'}
                                >
                                    {Object.entries(row).map(([k, val]) => {
                                        let displayVal = val
                                        if (typeof val === 'object' && val !== null) {
                                            displayVal = JSON.stringify(val)
                                        }
                                        const display = String(displayVal)
                                        return (
                                            <td key={k} className="px-2 py-1 cursor-pointer" onClick={() => {
                                                navigator.clipboard.writeText(display)
                                                toast('Copied value to clipboard', {icon: '✍️'})
                                            }}>
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
            </>}
        </div>
    )
}
