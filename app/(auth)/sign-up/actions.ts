'use server'

import { createClient } from '@/lib/supabase/server'
import { DOMAIN, ERRORS, jsonResponse, standardizePhoneNumber } from '@/lib/utils'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { StatusCodes } from 'http-status-codes'
import { User } from '@prisma/client'
import { BackendError, BackendResponse, FunctionResponse, SupabaseDataResponse } from '@/lib/types'

async function userExists(email: string) {
    return prisma.user.findUnique({where: {email}})
}

async function createUser(userSignUpData: any, email: string, name: string, phone: string): Promise<FunctionResponse<User>> {
    try {
        const user: User = await prisma.user.create({
            data: {id: userSignUpData.user?.id, email, name, phone},
        })
        return {data: user, error: null}
    } catch (err) {
        console.error(ERRORS.AUTH.ERROR_CREATING_USER_IN_PRISMA, err)
        const error = {message: ERRORS.AUTH.ERROR_SIGNING_UP_USER}
        return {data: null, error}
    }
}

async function registerUser(email: string, password: string): Promise<FunctionResponse<SupabaseDataResponse>> {
    const supabase = await createClient()
    const emailRedirectTo = `${DOMAIN}/api/auth/confirm`

    const {data, error} = await supabase.auth.signUp({
        email,
        password,
        options: {emailRedirectTo},
    })

    if (error) {
        console.error(ERRORS.AUTH.ERROR_SIGNING_UP_USER_IN_SUPABASE, error)
        const err = {message: error.message}
        return {data: null, error: err}
    }

    return {data, error: null}
}

export async function signUpUser(formData: FormData): Promise<NextResponse<BackendResponse<User>>> {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string
    const phone = standardizePhoneNumber(formData.get('phone') as string)

    if (await userExists(email)) {
        const error: BackendError = {message: ERRORS.AUTH.USER_ALREADY_EXISTS}
        return jsonResponse({data: null, errors: [error]}, {status: StatusCodes.CONFLICT})
    }

    const {data: userSignUpData, error: userSignUpError}: FunctionResponse<SupabaseDataResponse> = await registerUser(email, password)
    if (userSignUpError) {
        const payload: BackendResponse<User> = {
            data: null,
            errors: [userSignUpError],
            status: StatusCodes.CONFLICT
        }
        return jsonResponse(payload, {status: StatusCodes.CONFLICT})
    }

    const {data: createUserResponse, error: createUserError}: FunctionResponse<User> = await createUser(userSignUpData, email, name, phone)
    if (createUserError) {
        const payload: BackendResponse<User> = {
            data: null,
            errors: [createUserError],
            status: StatusCodes.CONFLICT
        }
        return jsonResponse(payload, {status: StatusCodes.CONFLICT})
    }

    return jsonResponse(
        {
            data: createUserResponse,
            errors: null,
            message: 'User created successfully',
            status: StatusCodes.CREATED
        },
        {status: StatusCodes.CREATED}
    )
}
