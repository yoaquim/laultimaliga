import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { ERRORS } from '@/lib/utils'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    // Only allow POST or PUT, for example
    if (req.method !== 'POST') {
        return NextResponse.json({error: ERRORS.METHOD_NOT_ALLOWED}, {status: 405})
    }

    try {
        const supabase = await createClient()
        const {
            data: {user: supabaseUser},
            error: supabaseError,
        } = await supabase.auth.getUser()

        if (supabaseError || !supabaseUser) {
            console.error(ERRORS.AUTH.USER_NOT_FOUND_IN_SUPABASE_SESSION, supabaseError)
            return NextResponse.json({error: ERRORS.AUTH.NOT_AUTHENTICATED}, {status: 401})
        }

        // 1) Parse playerId from request body or query
        const {playerId} = await req.json()
        if (!playerId) {
            return NextResponse.json({error: ERRORS.PLAYER.PLAYER_ID_REQUIRED}, {status: 400})
        }

        // 2) Find the Player & its user
        const player = await prisma.player.findUnique({
            where: {id: playerId},
            include: {
                user: true, // So we can check if user.email=null, phone, etc.
            },
        })

        if (!player) {
            return NextResponse.json({error: ERRORS.PLAYER.PLAYER_NOT_FOUND}, {status: 404})
        }

        // 3) Check if this player is truly "unclaimed":
        //    i.e. the user row has email=null
        if (player.user.email !== null) {
            return NextResponse.json({error: ERRORS.PLAYER.PLAYER_NOT_UNCLAIMED,}, {status: 400})
        }

        // 4) Optionally confirm that the "unclaimed user" phone matches
        //    the CURRENT supabase user’s phone
        //    (But if your flow doesn't require matching phone again, skip)
        const currentSupabaseUserId = supabaseUser.id
        // We'll load the "real" user in Prisma by supabaseUser.id:
        const realUser = await prisma.user.findUnique({where: {id: currentSupabaseUserId}})

        if (!realUser) {
            return NextResponse.json({error: ERRORS.PLAYER.PRISMA_USER_NOT_FOUND}, {status: 400})
        }

        // If you want to ensure the phone matches
        if (player.user.phone !== realUser.phone) {
            return NextResponse.json({error: ERRORS.PLAYER.PLAYER_PHONE_NUMBER_DOESNT_MATCH,}, {status: 400})
        }

        // 5) Reassign the Player to the "real user"
        //    We'll store the old userId to remove or ignore afterward
        const oldUserId = player.userId

        // Update the player row
        await prisma.player.update({
            where: {id: playerId},
            data: {
                userId: realUser.id,
            },
        })

        // 6) (Optional) Delete the old partial user row
        // If you want to keep that user row for auditing, skip this step
        await prisma.user.delete({
            where: {id: oldUserId},
        })

        // 7) Done!
        return NextResponse.json({
            message: 'Successfully claimed the player profile.',
            newPlayerUserId: realUser.id,
        }, {status: 200})
    } catch (err: any) {
        console.error(ERRORS.PLAYER.ERROR_CLAIMING_PLAYER, err)
        return NextResponse.json({error: ERRORS.ISE}, {status: 500})
    }
}
