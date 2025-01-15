import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { Role, User } from '@prisma/client'
import { ERRORS } from '@/lib/utils'

export async function getUser(): Promise<User | null> {
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
        where: {id: user.id}
    })

    if (!dbUser) {
        console.error(ERRORS.AUTH.USER_NOT_FOUND_IN_DATABASE(user.id))
        return null
    }

    return dbUser
}

export async function isAdmin() {
    return (await getUser())?.role === Role.ADMIN
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
