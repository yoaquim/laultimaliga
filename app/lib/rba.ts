import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { Role } from '@prisma/client'
import { ERRORS } from '@/lib/utils'

export async function getUserRole(): Promise<Role | null> {
    const supabase = await createClient()
    const {data: {user}, error} = await supabase.auth.getUser()

    if (error) {
        console.error(ERRORS.AUTH.SUPABASE_AUTH_ERROR, error)
        return null
    }

    if (!user) {
        console.error(ERRORS.AUTH.USER_NOT_FOUND_IN_SUPABASE_SESSION)
        return null
    }

    const dbUser = await prisma.user.findUnique({
        where: {id: user.id},
        select: {role: true},
    })

    if (!dbUser) {
        console.error(ERRORS.AUTH.USER_NOT_FOUND_IN_DATABASE(user.id))
        return null
    }

    return dbUser.role
}

export async function isAdmin() {
    return await getUserRole() === Role.ADMIN
}

export async function requireAdmin() {
    const isNotAdmin = !(await isAdmin())
    if (isNotAdmin) {
        console.error(ERRORS.AUTH.UNAUTHORIZED_ACCESS_ATTEMPT)
        throw new Error(
            JSON.stringify({status: 403, message: ERRORS.AUTH.UNAUTHORIZED_ACCESS('/admin')})
        )
    }

    return true
}
