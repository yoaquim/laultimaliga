import ProfileStats from '@/ui/profile-stats'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { InfoCard } from '@/ui/info-card'
import Link from 'next/link'

export default async function Page() {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()

    if (user) {
        const player = await prisma.player.findUnique({where: {userId: user.id}})
        if (player) return <ProfileStats playerId={player.id}/>
        else return (
            <div className="h-full flex flex-col justify-center items-center">
                <InfoCard title="You Don't Have a Player Profile" color="red" className="lg:-mt-40 flex flex-col gap-y-2">
                    <div>
                        You don't have a player profile linked to your user.
                    </div>
                    <div>
                        If an admin signed you up as a player, you can claim your player profile in <Link href="/dashboard/settings" className="text-lul-blue">settings</Link>.
                    </div>
                </InfoCard>

            </div>
        )
    }

    return 'There was en error fetching your profile'
}
