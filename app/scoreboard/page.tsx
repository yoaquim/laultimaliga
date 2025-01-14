'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function Page() {
    const searchParams = useSearchParams()
    const homeTeamScore = searchParams.get('homeTeamScore')
    const awayTeamScore = searchParams.get('awayTeamScore')
    const hts = homeTeamScore ? parseInt(homeTeamScore) : 0
    const ats = awayTeamScore ? parseInt(awayTeamScore) : 0
    const [homeScore, setHomeScore] = useState(hts)
    const [awayScore, setAwayScore] = useState(ats)
    const [timeElapsed, setTimeElapsed] = useState(0)

    useEffect(() => {
        console.log(`HOME TEAM SCORE`, homeTeamScore)
        console.log(`AWAY TEAM SCORE`, awayTeamScore)
        console.log(`HTS`, hts)
        console.log(`ATS`, ats)
        let timer: NodeJS.Timeout

        // Start timer on load
        timer = setInterval(() => {
            setTimeElapsed((prev) => prev + 1)
        }, 1000)

        // Listen for messages from the main window
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'UPDATE_SCORE') {
                setHomeScore(event.data.homeScore)
                setAwayScore(event.data.awayScore)
            }
        }
        window.addEventListener('message', handleMessage)

        return () => {
            clearInterval(timer)
            window.removeEventListener('message', handleMessage)
        }
    }, [])

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-lul-black text-white">
            <div className="text-8xl font-bold text-lime-500">{homeScore} - {awayScore}</div>
            <div className="text-lg font-bold text-red-500 mt-4">
                Time Elapsed: {new Date(timeElapsed * 1000).toISOString().substr(11, 8)}
            </div>
        </div>
    )
}
