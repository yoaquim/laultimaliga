'use client'

import React, { useState } from 'react'
import clsx from 'clsx'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { DateField } from '@/ui/uniforms'
import { JSONSchemaType } from 'ajv'
import { AutoFields, AutoForm, ErrorsField, SubmitField } from '@/ui/uniforms'
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
} from './actions'

// ----------------------------------------------
// The Admin Dashboard Page
// ----------------------------------------------
export default function AdminDashboardPage() {
    const router = useRouter()

    // Tab + Logging states
    const [currentTab, setCurrentTab] = useState<AdminTab>('SEASONS')
    const [logEntries, setLogEntries] = useState<{ tab: AdminTab; itemId: string; payload: any; createdAt: string }[]>([])

    // CSV states
    const [csvText, setCsvText] = useState('')
    const [csvParsed, setCsvParsed] = useState<any[]>([])
    const [bulkPreview, setBulkPreview] = useState(false)

    // 1) Single-Entity Create schemas for each tab
    // Minimal fields, adjust as needed.
    const formSchemas: Record<AdminTab, JSONSchemaType<SECSchemaType> | null> = {
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
                size: {
                    type: 'string',
                    title: 'Size',
                    enum: ['SMALL', 'MEDIUM', 'LARGE', 'X_LARGE', 'XX_LARGE'],
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

    // ----------------------------------------------
    // Single-entity creation logic
    // ----------------------------------------------
    async function handleCreateSingle(data: any) {
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
            if (created?.id) {
                // push into the ephemeral log
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
            console.error('Error creating item:', err)
            toast.error('Error creating item')
        } finally {
        }
    }

    // ----------------------------------------------
    // Bulk CSV
    // ----------------------------------------------
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
        const toastId = toast.loading(`Bulk Creating ${currentTab.toLowerCase()}s...`)
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
            setBulkPreview(false)
            setCsvParsed([])
            setCsvText('')
            toast.dismiss(toastId)
            // router.refresh();
        } catch (err) {
            toast.dismiss(toastId)
            console.error('Bulk creation error:', err)
            toast.error('Error in bulk creation')
        }
    }

    // Build a uniforms JSONSchemaBridge if not in the LOG tab
    const currentSchema = formSchemas[currentTab]
    let schemaBridge: any = null
    if (currentSchema) {
        schemaBridge = createSchemaBridge(currentSchema)
    }

    // ----------------------------------------------
    // RENDER
    // ----------------------------------------------
    return (
        <div className="w-full h-full text-white flex flex-col gap-y-4 p-4">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>

            {/* Tabs */}
            <div className="flex gap-x-4 mb-4">
                {(
                    [
                        'SEASONS',
                        'TEAMS',
                        'PLAYERS',
                        'MATCHES',
                        'PSDETAILS',
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

            <div className="flex flex-row gap-4 flex-1">
                {/* Main create area */}
                <div className="flex-1 flex flex-col gap-8">
                    {/* Single Entity Creation */}
                    {currentTab !== null && currentTab in formSchemas && formSchemas[currentTab] ? (
                        <div className="bg-lul-grey/20 rounded-md p-4">
                            <h2 className="text-xl font-bold uppercase mb-4 text-lul-yellow">
                                Create {currentTab}
                            </h2>
                            <AutoForm
                                schema={schemaBridge}
                                onSubmit={(model) => handleCreateSingle(model)}
                            >
                                <div className="w-full flex flex-col items-center gap-y-4 text-lul-black">
                                    <AutoFields/>
                                    <ErrorsField className="text-lul-red"/>
                                    <SubmitField
                                        value={`Create ${currentTab}`}
                                        className="px-4 py-2 bg-lul-blue text-white uppercase text-sm font-bold rounded-md hover:bg-lul-blue/70 transition-colors"
                                    />
                                </div>
                            </AutoForm>
                        </div>
                    ) : null}

                    {/* Bulk CSV Form */}
                    <div className="bg-lul-grey/20 rounded-md p-4 flex-1">
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
                            <div className="mt-4 bg-lul-dark-grey rounded-md p-2 max-h-40 overflow-y-auto">
                                <h3 className="text-md font-semibold text-lul-yellow mb-2">Preview:</h3>
                                {csvParsed.map((row, idx) => (
                                    <div
                                        key={idx}
                                        className="text-xs text-lul-light-grey border-b border-lul-grey/40 py-1"
                                    >
                                        {JSON.stringify(row)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Log panel */}
                <div className="w-1/3 bg-lul-black/30 rounded-md p-4 h-[70vh] overflow-y-auto">
                    <h2 className="text-xl font-bold uppercase text-lul-yellow mb-2">
                        Recent Creations
                    </h2>
                    {logEntries.length === 0 ? (
                        <p className="text-lul-light-grey text-sm">
                            No items have been created yet.
                        </p>
                    ) : (
                        <ul className="flex flex-col gap-y-2 text-sm">
                            {logEntries.map((entry, idx) => (
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
        </div>
    )
}
