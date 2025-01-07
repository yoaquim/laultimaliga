import { PrismaClient } from '@prisma/client'
import Link from 'next/link'

const prisma = new PrismaClient()

export default async function Page() {
    const matches = await prisma.match.findMany({
        where: {
            season: {
                isActive: true,
            },
        },
        include: {
            season: true,
            homeTeam: true,
            awayTeam: true,
        },
    })

    return (
        <div className="lg:mt-4 h-5/6 w-full p-6 mt-10 flex flex-col gap-y-8 bg-lul-black text-white overflow-y-scroll">
            {/* Sticky Header */}
            <div className="flex flex-col lg:flex-row lg:-top-6 items-center justify-between sticky -top-8 z-10 bg-lul-black p-4">
                <h1 className="text-3xl font-bold">Matches</h1>
            </div>

            {/* Matches Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {matches
                    .sort((match1, match2) => new Date(match1.date).getTime() - new Date(match2.date).getTime())
                    .map((match) => (
                        <Link
                            key={match.id}
                            href={`/dashboard/matches/${match.id}`}
                            className="p-4 bg-lul-grey/20 rounded-md hover:bg-lul-grey/30 transition cursor-pointer"
                        >
                            {/* Match Teams */}
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold">
                                    {match.homeTeam.name} vs {match.awayTeam.name}
                                </h2>
                                <p className="text-lul-blue">{match.season.name}</p>
                            </div>

                            {/* Match Date */}
                            <div className="text-center mb-4">
                                <p className="text-lg">Date</p>
                                <p className="text-2xl font-bold">{new Date(match.date).toLocaleDateString()}</p>
                            </div>

                            {/* Match Status */}
                            <div className="text-center">
                                <p className="text-lg">Status</p>
                                <p
                                    className={`text-2xl font-bold ${
                                        match.status === 'SCHEDULED'
                                            ? 'text-lul-yellow'
                                            : match.status === 'ONGOING'
                                                ? 'text-lul-green'
                                                : match.status === 'COMPLETED'
                                                    ? 'text-lul-blue'
                                                    : 'text-lul-red'
                                    }`}
                                >
                                    {match.status}
                                </p>
                            </div>
                        </Link>
                    ))}
            </div>
        </div>
    )
}
