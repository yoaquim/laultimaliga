'use server'

import { PrismaClient } from '@prisma/client'
import { createClient } from '@/lib/supabase/server'
import { ERRORS, DOMAIN } from '@/lib/utils'

const prisma = new PrismaClient()

async function userExists(email: string) {
    return prisma.user.findUnique({where: {email}})
}

async function createUser(userSignUpData: any, email: string, name: string, phone: string) {
    await prisma.user.create({
        data: {id: userSignUpData.user?.id, email, name, phone},
    })
}

async function registerUser(email: string, password: string) {
    const supabase = await createClient()
    const emailRedirectTo = `${DOMAIN}/api/auth/confirm`

    const {data, error} = await supabase.auth.signUp({
        email,
        password,
        options: {emailRedirectTo},
    })

    if (error) {
        console.error(ERRORS.ERROR_SIGNING_UP_USER_IN_SUPABASE, error)
        throw new Error(ERRORS.ERROR_SIGNING_UP_USER)
    }

    return data
}

export async function signUpUser(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string

    if (await userExists(email)) {
        throw new Error(ERRORS.USER_ALREADY_EXISTS)
    }

    const userSignUpData = await registerUser(email, password)

    try {
        await createUser(userSignUpData, email, name, phone)
    } catch (error) {
        console.error(ERRORS.ERROR_CREATING_USER_IN_PRISMA, error)
        throw new Error(ERRORS.ERROR_SIGNING_UP_USER)
    }
}
