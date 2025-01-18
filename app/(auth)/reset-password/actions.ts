'use server'

import { createClient } from '@/lib/supabase/server'
import { DOMAIN, jsonResponse, SUPABASE_ERROR_TABLE } from '@/lib/utils'
import { BackendResponse } from '@/lib/types'
import { StatusCodes } from 'http-status-codes'

export async function resetPassword(formData: FormData): Promise<BackendResponse<{ success: boolean, redirectTo: string }>> {
    const email = formData.get('email') as string
    const redirectTo = `${DOMAIN}/api/auth/confirm`

    const supabase = await createClient()
    const {error} = await supabase.auth.resetPasswordForEmail(email, {redirectTo})

    if (error) {
        const code = error.code as string
        const message = SUPABASE_ERROR_TABLE[code] || error.message
        return jsonResponse({
            data: null,
            errors: [{message, error}],
            status: StatusCodes.UNPROCESSABLE_ENTITY
        })
    }

    return jsonResponse({
        data: [{success: true, redirectTo}],
        errors: null,
        status: StatusCodes.OK
    })
}
