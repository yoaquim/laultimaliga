'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { DOMAIN, ERRORS, standardizePhoneNumber } from '@/lib/utils'

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
 * updateNameAction:
 * Updates the user's name in Prisma.
 */
export async function updateName({userId, name,}: { userId: string, name: string }) {
    if (!name) throw new Error('Name cannot be empty.')

    return await prisma.user.update({
        where: {id: userId},
        data: {name},
    })
}

/**
 * updatePhoneAction:
 * Updates the user's phone number in Prisma.
 */
export async function updatePhone({userId, phone,}: { userId: string, phone: string }) {
    if (!phone) throw new Error('Phone cannot be empty.')

    return await prisma.user.update({
        where: {id: userId},
        data: {phone: standardizePhoneNumber(phone)},
    })
}

/**
 * updateEmailAction:
 * Updates the user's email in Supabase and Prisma.
 */
export async function updateEmail({userId, newEmail,}: { userId: string, newEmail: string }) {
    if (!newEmail) throw new Error('Email cannot be empty.')

    const supabase = await createClient()

    const emailRedirectTo = `${DOMAIN}/api/auth/update-email`
    const {error} = await supabase.auth.updateUser({
        email: newEmail,
    }, {emailRedirectTo})

    if (error) {
        console.error(ERRORS.AUTH.EMAIL_UPDATE_FAILED, error)
        throw new Error(error.message)
    }

    return await prisma.user.update({
        where: {id: userId},
        data: {newEmail},
    })
}


/**
 * updatePasswordAction:
 * Updates the user's password in Supabase.
 */
export async function updatePassword({userId, newPassword,}: { userId: string, newPassword: string }) {
    if (!newPassword) throw new Error('Password cannot be empty')

    const supabase = await createClient()
    const {data, error} = await supabase.auth.updateUser({password: newPassword,})

    if (error) {
        console.error(ERRORS.AUTH.PASSWORD_UPDATE_FAILED, error)
        throw new Error(error.message)
    }

    return data
}

/**
 * updateProfilePicAction:
 * Updates the user's profile picture in Prisma.
 */
export async function updateProfilePic({userId, image}: { userId: string, image: string }) {
    if (!image) throw new Error('Image cannot be empty.')

    return await prisma.user.update({
        where: {id: userId},
        data: {image},
    })
}

