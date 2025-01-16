import Link from 'next/link'
import { Prisma } from '@prisma/client'
import { TEAM_LOGO_URL_BUILDER } from '@/lib/utils'
import clsx from 'clsx'
import Score from '@/ui/score'

// --------------------------------------------------
// Types
// --------------------------------------------------
type MatchWithTeams = Prisma.MatchGetPayload<{
    include: {
        season: true
        homeTeam: true
        awayTeam: true
    }
}>

interface Props {
    match: MatchWithTeams
    noTopRadius?: boolean
}

export default function MatchCard({match, noTopRadius}: Props) {
    const dateStr = new Date(match.date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    })

    // Show scoreboard if Ongoing or Completed
    const isScoreVisible = match.status === 'COMPLETED'
    // We'll color the scoreboard green if ONGOING, blue if COMPLETED
    const scoreColor =
        match.status === 'ONGOING' ? 'text-lul-green' : 'text-lul-blue'

    return (
        <Link
            key={match.id}
            href={`/dashboard/matches/${match.id}`}
            className={clsx('w-full relative flex flex-col h-full p-4 pb-2.5 bg-lul-grey/20 rounded-md hover:bg-lul-grey/30 transition cursor-pointer gap-y-4', {
                'rounded-t-none': noTopRadius
            })}
        >
            {/* STATUS BADGE */}
            <div className="mx-auto px-3 py-1 rounded-md text-white text-sm font-bold uppercase" style={{backgroundColor: 'rgba(0,0,0,0.25)'}}>
                <div className={clsx({
                    'text-lul-yellow': match.status === 'SCHEDULED',
                    'text-lul-green': match.status === 'ONGOING',
                    'text-lul-blue': match.status === 'COMPLETED',
                    'text-lul-red': match.status === 'CANCELED',
                })}>
                    {match.status}
                </div>
            </div>

            {/* TEAMS */}
            <div className={clsx('relative -mt-8 flex justify-between items-center')}>

                {/*HOME TEAM*/}
                <div className="w-1/3 flex flex-col justify-start items-center">
                    <h1 className="w-full text-white text-base text-center font-bold uppercase">HOME</h1>
                    <img src={TEAM_LOGO_URL_BUILDER(match.homeTeam.logo)} alt="team-logo" className="h-24"/>
                </div>

                {/* BALL */}
                {!isScoreVisible &&
                    <div className="w-1/3 flex items-center justify-center">
                        {match.status === 'CANCELED'
                            ? <div className="w-full text-center text-4xl">❌</div>
                            : (<img src="/ball.svg" alt="ball" className="w-8"/>)
                        }
                    </div>
                }

                {/* SCORE */}
                {isScoreVisible &&
                    <div className={clsx('mt-9 absolute inset-0 flex px-10 justify-center gap-x-1 text-4xl font-bold rounded text-white')
                    }>
                        <div className={clsx({
                            'text-lul-green': match.winnerId === match.homeTeam.id,
                            'text-lul-red': match.winnerId !== match.homeTeam.id
                        })}>
                            <Score value={match.homeScore}/>
                        </div>

                        <div className="mt-1 px-0.5">·</div>

                        <div className={clsx({
                            'text-lul-green': match.winnerId === match.awayTeam.id,
                            'text-lul-red': match.winnerId !== match.awayTeam.id
                        })}>
                            <Score value={match.awayScore}/>
                        </div>
                    </div>
                }

                {/*AWAY TEAM*/}
                <div className="w-1/3 flex flex-col justify-center items-center">
                    <h1 className="w-full text-white text-base text-center font-bold uppercase">AWAY</h1>
                    <img src={TEAM_LOGO_URL_BUILDER(match.awayTeam.logo)} alt="team-logo" className="h-24"/>
                </div>
            </div>

            {/* BOTTOM ROW (DATE & SEASON) */}
            <div className="flex justify-between items-center uppercase">
                <div className="text-lul-light-grey font-bold text-sm">{dateStr}</div>
                <div className="text-lul-blue text-sm font-semibold">
                    {match.season.shortName || match.season.name}
                </div>
            </div>
        </Link>
    )
}