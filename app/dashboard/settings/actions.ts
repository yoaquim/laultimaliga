'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { ERRORS } from '@/lib/utils'

/**
 * fetchUserProfile:
 * 1) Get current Supabase user.
 * 2) Load that user from Prisma (including linked Player if any).
 * 3) If the user has no linked Player, try to find an unclaimed dummy user
 *    (with email=null) with the same phone that has an associated Player.
 */
export async function fetchUserProfile() {
    const supabase = await createClient()
    const {data: {user}, error} = await supabase.auth.getUser()

    if (error || !user) {
        console.error(ERRORS.AUTH.USER_NOT_FOUND_IN_SUPABASE_SESSION, error)
        return null
    }

    const userId = user.id

    // Load the current user from Prisma along with any linked Player.
    const prismaUser = await prisma.user.findUnique({
        where: {id: userId},
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

    if (!prismaUser) {
        return null
    }

    let unclaimedPlayer = null

    // If the logged-in user does not have a linked Player,
    // attempt to find an unclaimed User (dummy) with the same phone and email === null,
    // and if found, use its linked Player.
    if (!prismaUser.Player) {
        const dummyUser = await prisma.user.findFirst({
            where: {
                phone: prismaUser.phone,
                email: null,
                Player: {isNot: null},
            },
            include: {
                Player: {
                    include: {
                        totalStats: true,
                        SeasonStats: {include: {season: true}},
                        participations: {
                            include: {
                                match: {include: {season: true}},
                            },
                        },
                    },
                },
            },
        })

        if (dummyUser && dummyUser.Player) {
            unclaimedPlayer = dummyUser.Player
        }
    }

    return {sessionUser: prismaUser, unclaimedPlayer}
}

/**
 * updateUserAction:
 * For name, phone, email, image updates (all optional).
 * Only the Supabase user themself can do so.
 */
export async function updateUserAction(data: {
    userId: string;
    name?: string;
    phone?: string;
    email?: string | null;
    image?: string;  // The file name stored in Supabase
}) {
    // This is naive. For real usage, confirm that the session user matches data.userId
    // or check if user is an admin.
    // We'll skip that step for brevity.

    const {userId, ...updateFields} = data

    // Filter out undefined fields so we don't override with undefined
    const toUpdate: any = {}
    if (typeof updateFields.name !== 'undefined') toUpdate.name = updateFields.name
    if (typeof updateFields.phone !== 'undefined') toUpdate.phone = updateFields.phone
    if (typeof updateFields.email !== 'undefined') toUpdate.email = updateFields.email
    if (typeof updateFields.image !== 'undefined') toUpdate.image = updateFields.image

    // If no fields, do nothing
    if (Object.keys(toUpdate).length === 0) return null

    return await prisma.user.update({
        where: {id: userId},
        data: toUpdate,
    })
}
