'use client'

import React, { useState, useEffect } from 'react'
import clsx from 'clsx'
import { createSeasonAction, createTeamAction, createPlayerAction, createMatchAction } from './actions'
import { bulkCreateSeasonsAction, bulkCreateTeamsAction, bulkCreatePlayersAction, bulkCreateMatchesAction } from './actions'
import Shimmer from '@/ui/shimmer'
import { useRouter } from 'next/navigation'

/** Tab definitions */
type AdminTab = 'seasons' | 'teams' | 'players' | 'matches';

/**
 * The main Admin Dashboard page:
 *  - Four tabs: Seasons, Teams, Players, Matches
 *  - Each tab: single-create form, bulk CSV input
 */
export default function AdminDashboardPage() {
    const router = useRouter()

    // UI states
    const [currentTab, setCurrentTab] = useState<AdminTab>('seasons')

    // Single-create forms local states:
    const [seasonName, setSeasonName] = useState('')
    const [seasonShortName, setSeasonShortName] = useState('')
    const [seasonStart, setSeasonStart] = useState('')
    const [seasonEnd, setSeasonEnd] = useState('')

    const [teamName, setTeamName] = useState('')
    const [teamSeasonId, setTeamSeasonId] = useState('')

    const [playerName, setPlayerName] = useState('')
    const [playerPhone, setPlayerPhone] = useState('')
    const [playerSize, setPlayerSize] = useState('MEDIUM')

    const [matchHomeTeamId, setMatchHomeTeamId] = useState('')
    const [matchAwayTeamId, setMatchAwayTeamId] = useState('')
    const [matchSeasonId, setMatchSeasonId] = useState('')
    const [matchDate, setMatchDate] = useState('')

    // Bulk CSV states
    const [csvText, setCsvText] = useState('')
    const [csvParsed, setCsvParsed] = useState<any[]>([])

    // Loading and success feedback
    const [loading, setLoading] = useState(false)
    const [bulkPreview, setBulkPreview] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')

    /**
     * Handler for creating (single) item
     * Calls the server action, then refreshes or shows success.
     */
    async function handleCreateSingle() {
        try {
            setLoading(true)
            setSuccessMessage('')

            if (currentTab === 'seasons') {
                await createSeasonAction({
                    name: seasonName,
                    shortName: seasonShortName,
                    startDate: seasonStart,
                    endDate: seasonEnd,
                })
            } else if (currentTab === 'teams') {
                await createTeamAction({
                    name: teamName,
                    seasonId: teamSeasonId,
                })
            } else if (currentTab === 'players') {
                await createPlayerAction({
                    name: playerName,
                    phone: playerPhone,
                    size: playerSize,
                })
            } else if (currentTab === 'matches') {
                await createMatchAction({
                    homeTeamId: matchHomeTeamId,
                    awayTeamId: matchAwayTeamId,
                    seasonId: matchSeasonId,
                    date: matchDate,
                })
            }

            setSuccessMessage('Created successfully!')
            // Reset relevant fields
            if (currentTab === 'seasons') {
                setSeasonName('')
                setSeasonShortName('')
                setSeasonStart('')
                setSeasonEnd('')
            } else if (currentTab === 'teams') {
                setTeamName('')
                setTeamSeasonId('')
            } else if (currentTab === 'players') {
                setPlayerName('')
                setPlayerPhone('')
                setPlayerSize('MEDIUM')
            } else if (currentTab === 'matches') {
                setMatchHomeTeamId('')
                setMatchAwayTeamId('')
                setMatchSeasonId('')
                setMatchDate('')
            }

        } catch (error) {
            console.error('Error creating single item:', error)
            alert('Error creating item. Check console/logs.')
        } finally {
            setLoading(false)
            // Optionally refresh page or revalidate if needed
            router.refresh()
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
            setSuccessMessage('')
        } catch (error) {
            console.error('CSV parse error:', error)
            alert(error)
        }
    }

    /**
     * Actually create the data from CSV
     */
    async function handleCreateCSV() {
        try {
            setLoading(true)
            setSuccessMessage('')
            if (!csvParsed.length) {
                alert('Nothing to create. Preview first.')
                return
            }

            if (currentTab === 'seasons') {
                await bulkCreateSeasonsAction(csvParsed)
            } else if (currentTab === 'teams') {
                await bulkCreateTeamsAction(csvParsed)
            } else if (currentTab === 'players') {
                await bulkCreatePlayersAction(csvParsed)
            } else if (currentTab === 'matches') {
                await bulkCreateMatchesAction(csvParsed)
            }

            setSuccessMessage('Bulk creation successful!')
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

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <Shimmer/>
            </div>
        )
    }

    return (
        <div className="w-full h-full text-white flex flex-col gap-y-4 p-4">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>

            {/* Tabs */}
            <div className="flex gap-x-4 mb-4">
                {(['seasons', 'teams', 'players', 'matches'] as AdminTab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => {
                            setCurrentTab(tab)
                            setSuccessMessage('')
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

            {/* Success message */}
            {successMessage && (
                <div className="bg-lul-green text-black rounded-md px-4 py-2 font-semibold">
                    {successMessage}
                </div>
            )}

            {/* The content for the selected tab */}
            <div className="flex flex-col lg:flex-row gap-8">
                {/* LEFT: Single creation form */}
                <div className="flex-1 bg-lul-grey/20 rounded-md p-4">
                    <h2 className="text-xl font-bold uppercase mb-2 text-lul-yellow">
                        Create {currentTab} (single)
                    </h2>

                    {currentTab === 'seasons' && (
                        <div className="flex flex-col gap-y-2">
                            <label className="text-sm">
                                Name:
                                <input
                                    type="text"
                                    value={seasonName}
                                    onChange={(e) => setSeasonName(e.target.value)}
                                    className="w-full bg-lul-black/20 ml-2 px-2 py-1 rounded-md"
                                />
                            </label>
                            <label className="text-sm">
                                Short Name:
                                <input
                                    type="text"
                                    value={seasonShortName}
                                    onChange={(e) => setSeasonShortName(e.target.value)}
                                    className="w-full bg-lul-black/20 ml-2 px-2 py-1 rounded-md"
                                />
                            </label>
                            <label className="text-sm">
                                Start Date:
                                <input
                                    type="date"
                                    value={seasonStart}
                                    onChange={(e) => setSeasonStart(e.target.value)}
                                    className="w-full bg-lul-black/20 ml-2 px-2 py-1 rounded-md"
                                />
                            </label>
                            <label className="text-sm">
                                End Date:
                                <input
                                    type="date"
                                    value={seasonEnd}
                                    onChange={(e) => setSeasonEnd(e.target.value)}
                                    className="w-full bg-lul-black/20 ml-2 px-2 py-1 rounded-md"
                                />
                            </label>

                            <button
                                onClick={handleCreateSingle}
                                className="mt-4 px-4 py-2 bg-lul-green text-black font-bold rounded-md hover:bg-lul-red transition-colors"
                            >
                                Create Season
                            </button>
                        </div>
                    )}

                    {currentTab === 'teams' && (
                        <div className="flex flex-col gap-y-2">
                            <label className="text-sm">
                                Team Name:
                                <input
                                    type="text"
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    className="w-full bg-lul-black/20 ml-2 px-2 py-1 rounded-md"
                                />
                            </label>
                            <label className="text-sm">
                                Season ID:
                                <input
                                    type="text"
                                    value={teamSeasonId}
                                    onChange={(e) => setTeamSeasonId(e.target.value)}
                                    className="w-full bg-lul-black/20 ml-2 px-2 py-1 rounded-md"
                                />
                            </label>
                            <button
                                onClick={handleCreateSingle}
                                className="mt-4 px-4 py-2 bg-lul-green text-black font-bold rounded-md hover:bg-lul-red transition-colors"
                            >
                                Create Team
                            </button>
                        </div>
                    )}

                    {currentTab === 'players' && (
                        <div className="flex flex-col gap-y-2">
                            <label className="text-sm">
                                Full Name:
                                <input
                                    type="text"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    className="w-full bg-lul-black/20 ml-2 px-2 py-1 rounded-md"
                                />
                            </label>
                            <label className="text-sm">
                                Phone:
                                <input
                                    type="text"
                                    value={playerPhone}
                                    onChange={(e) => setPlayerPhone(e.target.value)}
                                    className="w-full bg-lul-black/20 ml-2 px-2 py-1 rounded-md"
                                />
                            </label>
                            <label className="text-sm">
                                Size:
                                <select
                                    value={playerSize}
                                    onChange={(e) => setPlayerSize(e.target.value)}
                                    className="bg-lul-black/20 ml-2 px-2 py-1 rounded-md"
                                >
                                    <option value="SMALL">SMALL</option>
                                    <option value="MEDIUM">MEDIUM</option>
                                    <option value="LARGE">LARGE</option>
                                    <option value="X_LARGE">X_LARGE</option>
                                    <option value="XX_LARGE">XX_LARGE</option>
                                </select>
                            </label>
                            <button
                                onClick={handleCreateSingle}
                                className="mt-4 px-4 py-2 bg-lul-green text-black font-bold rounded-md hover:bg-lul-red transition-colors"
                            >
                                Create Player
                            </button>
                        </div>
                    )}

                    {currentTab === 'matches' && (
                        <div className="flex flex-col gap-y-2">
                            <label className="text-sm">
                                Home Team ID:
                                <input
                                    type="text"
                                    value={matchHomeTeamId}
                                    onChange={(e) => setMatchHomeTeamId(e.target.value)}
                                    className="w-full bg-lul-black/20 ml-2 px-2 py-1 rounded-md"
                                />
                            </label>
                            <label className="text-sm">
                                Away Team ID:
                                <input
                                    type="text"
                                    value={matchAwayTeamId}
                                    onChange={(e) => setMatchAwayTeamId(e.target.value)}
                                    className="w-full bg-lul-black/20 ml-2 px-2 py-1 rounded-md"
                                />
                            </label>
                            <label className="text-sm">
                                Season ID:
                                <input
                                    type="text"
                                    value={matchSeasonId}
                                    onChange={(e) => setMatchSeasonId(e.target.value)}
                                    className="w-full bg-lul-black/20 ml-2 px-2 py-1 rounded-md"
                                />
                            </label>
                            <label className="text-sm">
                                Date:
                                <input
                                    type="date"
                                    value={matchDate}
                                    onChange={(e) => setMatchDate(e.target.value)}
                                    className="w-full bg-lul-black/20 ml-2 px-2 py-1 rounded-md"
                                />
                            </label>
                            <button
                                onClick={handleCreateSingle}
                                className="mt-4 px-4 py-2 bg-lul-green text-black font-bold rounded-md hover:bg-lul-red transition-colors"
                            >
                                Create Match
                            </button>
                        </div>
                    )}
                </div>

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
