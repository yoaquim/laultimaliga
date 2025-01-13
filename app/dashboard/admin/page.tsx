'use client'

import React, { useState } from 'react'
import clsx from 'clsx'
import { useRouter } from 'next/navigation'
import { JSONSchemaType } from 'ajv'
import toast from 'react-hot-toast'
import Loader from '@/ui/loader'
import { createSeasonAction, createTeamAction, createPlayerAction, createMatchAction } from './actions'
import { bulkCreateSeasonsAction, bulkCreateTeamsAction, bulkCreatePlayersAction, bulkCreateMatchesAction } from './actions'
import { SingleEntityCreator } from './single-entity-creator'
import { DateField } from '@/ui/uniforms'
import { Size } from '@prisma/client'

/**
 * The main Admin Dashboard page:
 *  - Four tabs: Seasons, Teams, Players, Matches
 *  - Each tab: single-create form, bulk CSV input
 */
export default function AdminDashboardPage() {
    const router = useRouter()

    // UI states
    const [currentTab, setCurrentTab] = useState<AdminTab>('SEASONS')

    // Bulk CSV states
    const [csvText, setCsvText] = useState('')
    const [csvParsed, setCsvParsed] = useState<any[]>([])

    // Loading and success feedback
    const [loading, setLoading] = useState(false)
    const [bulkPreview, setBulkPreview] = useState(false)

    // Schemas
    const formSchemas: Record<AdminTab, JSONSchemaType<SECSchemaType>> = {
        SEASONS: {
            title: 'Season',
            type: 'object',
            required: ['name', 'shortName', 'startDate', 'endDate'],
            properties: {
                name: {type: 'string', title: 'Name'},
                shortName: {type: 'string', title: 'Short Name/Abbreviation'},
                startDate: {type: 'string', format: 'date', title: 'Start Date', 'uniforms': {'component': DateField}},
                endDate: {type: 'string', format: 'date', title: 'End Date', 'uniforms': {'component': DateField}},
            },
        },
        TEAMS: {
            title: 'Team',
            type: 'object',
            required: ['name', 'seasonId'],
            properties: {
                name: {type: 'string', title: 'Team Name'},
                seasonId: {type: 'string', title: 'Season ID'},
            },
        },
        PLAYERS: {
            title: 'Player',
            type: 'object',
            required: ['name', 'phone', 'size'],
            properties: {
                name: {type: 'string', title: 'Full Name'},
                phone: {type: 'string', title: 'Phone'},
                size: {type: 'string', enum: Object.keys(Size), title: 'Size'},
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
                date: {type: 'string', format: 'date', title: 'Date', 'uniforms': {'component': DateField}},
            },
        },
    }


    /**
     * Handler for creating (single) item
     * Calls the server action, then refreshes or shows success.
     */
    async function handleCreateSingle(data: any) {
        try {
            setLoading(true)
            if (currentTab === 'SEASONS') await createSeasonAction(data)
            if (currentTab === 'TEAMS') await createTeamAction(data)
            if (currentTab === 'PLAYERS') await createPlayerAction(data)
            if (currentTab === 'MATCHES') await createMatchAction(data)

            toast.success('Created successfully')
            router.refresh()
        } catch (error) {
            console.error('Error creating single item:', error)
            toast.error('Error creating item')
        } finally {
            setLoading(false)
        }
    }

    /**
     * Preview CSV -> parse lines
     */
    function handlePreviewCSV() {
        try {
            setBulkPreview(false)
            const lines = csvText.trim().split('\n')
            if (!lines.length) throw new Error('No CSV data found.')
            const parsed: any[] = []
            for (const line of lines) {
                // simplistic CSV parse: split by comma
                const columns = line.split(',').map((c) => c.trim())
                parsed.push(columns)
            }
            setCsvParsed(parsed)
            setBulkPreview(true)
            toast('Preview Rendered', {icon: '🚧'})
        } catch (err) {
            const error = err as Error
            console.error('CSV parse error:', error)
            toast.error(error.message)
        }
    }

    /**
     * Actually create the data from CSV
     */
    async function handleCreateCSV() {
        try {
            setLoading(true)
            if (!csvParsed.length) {
                alert('Nothing to create. Preview first.')
                return
            }

            if (currentTab === 'SEASONS') {
                await bulkCreateSeasonsAction(csvParsed)
            } else if (currentTab === 'TEAMS') {
                await bulkCreateTeamsAction(csvParsed)
            } else if (currentTab === 'PLAYERS') {
                await bulkCreatePlayersAction(csvParsed)
            } else if (currentTab === 'MATCHES') {
                await bulkCreateMatchesAction(csvParsed)
            }

            toast.success('Bulk creation successful')
            setBulkPreview(false)
            setCsvParsed([])
            setCsvText('')
            router.refresh()
        } catch (error) {
            console.error('Bulk creation error:', error)
            alert('Error in bulk creation. Check console/logs.')
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <Loader/>

    return (
        <div className="w-full h-full text-white flex flex-col gap-y-4 p-4">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>

            {/* Tabs */}
            <div className="flex gap-x-4 mb-4">
                {(['SEASONS', 'TEAMS', 'PLAYERS', 'MATCHES'] as AdminTab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => {
                            setCurrentTab(tab)
                            setCsvText('')
                            setBulkPreview(false)
                            setCsvParsed([])
                        }}
                        className={clsx(
                            'px-4 py-2 font-semibold uppercase',
                            currentTab === tab ? 'bg-lul-green text-black' : 'bg-lul-grey/20'
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* The content for the selected tab */}
            <div className="flex flex-col lg:flex-row gap-8">

                {/* LEFT: Single creation form */}
                <SingleEntityCreator
                    schema={formSchemas[currentTab]}
                    entityName={currentTab}
                    onSubmit={handleCreateSingle}/>


                {/* RIGHT: Bulk CSV form */}
                <div className="flex-1 bg-lul-grey/20 rounded-md p-4">
                    <h2 className="text-xl font-bold uppercase mb-2 text-lul-yellow">
                        Bulk {currentTab} via CSV
                    </h2>
                    <p className="text-xs text-lul-light-grey mb-2">
                        Paste CSV lines, then Preview, then Create if valid.
                    </p>
                    <textarea
                        value={csvText}
                        onChange={(e) => setCsvText(e.target.value)}
                        className="w-full h-40 bg-lul-black/20 rounded-md p-2 text-sm"
                        placeholder={`Example for ${currentTab}...`}
                    />
                    <div className="flex gap-x-2 mt-2">
                        <button
                            onClick={handlePreviewCSV}
                            className="px-4 py-2 bg-lul-blue text-white font-bold rounded-md"
                        >
                            Preview
                        </button>
                        <button
                            onClick={handleCreateCSV}
                            className="px-4 py-2 bg-lul-green text-black font-bold rounded-md"
                        >
                            Create
                        </button>
                    </div>

                    {bulkPreview && (
                        <div className="mt-4 bg-lul-dark-grey rounded-md p-2 max-h-60 overflow-y-auto">
                            <h3 className="text-md font-semibold text-lul-yellow mb-2">Preview:</h3>
                            {csvParsed.map((row, idx) => (
                                <div key={idx} className="text-xs text-lul-light-grey border-b border-lul-grey/40 py-1">
                                    {JSON.stringify(row)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
