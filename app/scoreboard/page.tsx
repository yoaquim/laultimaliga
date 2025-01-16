'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { BUCKET_ENDPOINT, formatTimeElapsed, TEAM_LOGO_URL_BUILDER } from '@/lib/utils'
import Score from '@/ui/score'

function Scoreboard() {
    const searchParams = useSearchParams()
    const homeTeamLogo = searchParams.get('homeTeamLogo')
    const awayTeamLogo = searchParams.get('awayTeamLogo')
    const homeTeamScore = parseInt(searchParams.get('homeTeamScore') || '0')
    const awayTeamScore = parseInt(searchParams.get('awayTeamScore') || '0')
    const time = parseInt(searchParams.get('time') || '720')
    const [currentHomeScore, setCurrentHomeScore] = useState(homeTeamScore)
    const [currentAwayScore, setCurrentAwayScore] = useState(awayTeamScore)
    const [timeRemaining, setTimeRemaining] = useState(time)
    const [timerRunning, setTimerRunning] = useState(false)

    useEffect(() => {
        if (timeRemaining === 0 && timerRunning) {
            console.log('BUZZING')
            const buzzer = new Audio(`${BUCKET_ENDPOINT}/assets/buzzer.wav`)
            buzzer.play().catch((err) => console.error('Error playing buzzer sound:', err))
        }
    }, [timeRemaining, timerRunning])

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null

        if (timerRunning) {
            interval = setInterval(() => {
                setTimeRemaining((prev) => Math.max(0, prev - 1))
            }, 1000)
        } else if (!timerRunning && interval) {
            clearInterval(interval)
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [timerRunning])


    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const {type, timeRemaining, homeScore, awayScore, running} = event.data
            if (type === 'UPDATE_SCORE') {
                setCurrentHomeScore(homeScore)
                setCurrentAwayScore(awayScore)
            }
            if (type === 'SYNC_TIMER') {
                setTimeRemaining(timeRemaining) // Sync timeRemaining
            }
            if (type === 'TIMER_CONTROL') {
                setTimerRunning(running) // Start/stop timer
            }
        }
        window.addEventListener('message', handleMessage)

        return () => window.removeEventListener('message', handleMessage)
    }, [])

    return (
        <div className="h-screen w-screen p-10 flex flex-col items-center justify-center bg-lul-dark-grey text-white ">
            <div className="relative flex flex-col items-center justify-center w-full p-4 h-full bg-white border-8 border-white rounded-3xl">
                <div className="flex flex-col items-center justify-center w-full h-full border-8 bg-lul-dark-grey border-white rounded-3xl">

                    <div className="h-full w-full flex xl:justify-between 3xl:px-52 xl:p-8 items-center 3xl:gap-x-0 gap-x-32">

                        {/* HOME SCORE */}
                        <div className="h-full flex flex-col justify-center items-center gap-y-1">
                            {homeTeamLogo && <img src={TEAM_LOGO_URL_BUILDER(homeTeamLogo)} alt="team-logo" className="3xl:h-52 xl:h-44 h-24"/>}
                            <h1 className="3xl:mt-8 3xl:px-40 mt-4 leading-none font-bold bg-lul-black/70 p-8 rounded-3xl text-scoreboard 3xl:text-scoreboard-3xl xl:text-scoreboard-xl text-lul-yellow">
                                <Score value={currentHomeScore}/>
                            </h1>
                            <h3 className="text-white uppercase text-5xl xl:text-8xl font-bold">Home</h3>
                        </div>

                        {/* TIMER */}
                        <div className="leading-none bottom-8 3xl:bottom-14 text-time 3xl:text-timer-3xl xl:text-timer-xl font-bold text-lul-red">
                            <Score value={formatTimeElapsed(timeRemaining)}/>
                        </div>

                        {/* AWAY SCORE */}
                        <div className="flex flex-col justify-center items-center gap-y-1">
                            {awayTeamLogo && <img src={TEAM_LOGO_URL_BUILDER(awayTeamLogo)} alt="team-logo" className="3xl:h-52 xl:h-44 h-24"/>}
                            <h1 className="3xl:mt-8 3xl:px-40  mt-4 leading-none bg-lul-black/70 rounded-3xl p-8 font-bold text-scoreboard 3xl:text-scoreboard-3xl xl:text-scoreboard-xl text-lul-yellow">
                                <Score className="leading-none h-fit" value={currentAwayScore}/>
                            </h1>
                            <h3 className="text-white uppercase text-5xl xl:text-8xl font-bold">Away</h3>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    )
}

export default function Page() {
    return (
        <Suspense><Scoreboard/></Suspense>
    )
}