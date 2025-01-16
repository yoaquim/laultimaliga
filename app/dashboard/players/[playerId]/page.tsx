import ProfileStats from '@/ui/profile-stats'

export default async function Page({params}: { params: Promise<{ playerId: string }> }) {
    const {playerId} = await params
    return <ProfileStats playerId={playerId}/>
}
