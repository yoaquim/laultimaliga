import ProfileStats from '@/ui/profile-stats'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { InfoCard } from '@/ui/info-card'
import Link from 'next/link'
import { Container } from '@/ui/container'

export default async function Page() {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()

    if (user) {
        const player = await prisma.player.findUnique({where: {userId: user.id}})
        if (player) return <ProfileStats playerId={player.id}/>
        else return (
            <Container title="Player Profile">
                <div className="flex justify-center mt-16">
                    <InfoCard style="exalted" title="You Don't Have a Player Profile" color="red" className="flex flex-col gap-y-2">
                        <div>
                            You don't have a player profile linked to your user.
                        </div>
                        <div>
                            If an admin signed you up as a player, you can claim your player profile under <Link href="/dashboard/settings" className="text-lul-blue">settings</Link>.
                        </div>
                    </InfoCard>
                </div>
            </Container>
        )
    }

    return 'There was en error fetching your profile'
}
