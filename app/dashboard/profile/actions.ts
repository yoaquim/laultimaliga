'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { ERRORS } from '@/lib/utils'

/**
 * fetchUserProfile:
 * 1) Get current Supabase user from session (=> user.id)
 * 2) Load that user from Prisma
 * 3) If user doesn't have a Player, see if there's an UNCLAIMED user
 *    with email=null, phone=the same phone => get that user's Player => "unclaimedPlayer"
 */
export async function fetchUserProfile() {
    const supabase = await createClient()
    const {data: {user}, error} = await supabase.auth.getUser()

    if (error || !user) {
        console.error(ERRORS.AUTH.USER_NOT_FOUND_IN_SUPABASE_SESSION, error)
        return null
    }

    // This is the supabase user ID
    const userId = user.id

    // 1) Find user in Prisma by ID
    const prismaUser = await prisma.user.findUnique({
        where: {id: userId},
        include: {
            Player: {
                include: {
                    totalStats: true,
                    SeasonStats: {
                        include: {season: true},
                    },
                    participations: {
                        include: {
                            match: {
                                include: {season: true},
                            },
                        },
                    },
                },
            },
        },
    })

    if (!prismaUser) {
        // If no matching user row => we might create one now, or return null
        return null
    }

    // If user already has a Player, we don't need an unclaimed
    let unclaimedPlayer = null

    // 2) If this user doesn't have a Player, see if there's an unclaimed user row with the same phone
    //    "unclaimed" means "email=null" (and presumably is a partial/dummy user),
    //    plus we find the Player that references that user.
    if (!prismaUser.Player) {
        // We'll try to find a user with email=null, same phone, that has a Player row
        const dummyUser = await prisma.user.findFirst({
            where: {
                email: null,
                phone: prismaUser.phone,
                // maybe also isClaimed = false if you add that column
            },
            include: {
                Player: {
                    include: {
                        totalStats: true,
                        SeasonStats: {include: {season: true}},
                        participations: {
                            include: {
                                match: {
                                    include: {season: true},
                                },
                            },
                        },
                    },
                },
            },
        })

        // If found, that's the "unclaimed" scenario
        if (dummyUser?.Player) {
            unclaimedPlayer = dummyUser.Player
        }
    }

    // Return everything
    return {sessionUser: prismaUser, unclaimedPlayer}
}
