'use server'

import { createClient } from '@/lib/supabase/server'
import { DEFAULT_URL_WHEN_AUTHENTICATED, ERRORS, jsonResponse, SUPABASE_ERROR_TABLE } from '@/lib/utils'
import { StatusCodes } from 'http-status-codes'
import { BackendResponse } from '@/lib/types'

export async function signInUser(formData: FormData): Promise<BackendResponse<{ success: boolean, redirectTo: string }>> {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        return jsonResponse({
            data: null,
            errors: [new Error(ERRORS.AUTH.INVALID_CREDENTIALS)],
            status: StatusCodes.BAD_REQUEST
        })
    }

    const supabase = await createClient()
    const {error} = await supabase.auth.signInWithPassword({email, password})

    if (error) {
        const code = error.code as string
        const message = SUPABASE_ERROR_TABLE[code] || error.message
        return jsonResponse({
            data: null,
            errors: [{message, error}],
            status: StatusCodes.UNAUTHORIZED
        })
    }

    return jsonResponse({
        data: [{success: true, redirectTo: DEFAULT_URL_WHEN_AUTHENTICATED}],
        errors: null,
        status: StatusCodes.OK
    })
}
