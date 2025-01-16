import ProfileStats from '@/ui/profile-stats'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export default async function Page() {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()

    if (user) {
        const player = await prisma.player.findUnique({where: {userId: user.id}})
        if (player) return <ProfileStats playerId={player.id}/>
    }

    return 'There was en error fetching your profile'
}
