'use server'

import { createClient } from '@/lib/supabase/server'
import { ERRORS, DEFAULT_URL_WHEN_AUTHENTICATED } from '@/lib/utils'

export async function signInUser(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        throw new Error(ERRORS.INVALID_CREDENTIALS)
    }

    const supabase = await createClient()
    const {error} = await supabase.auth.signInWithPassword({email, password})

    if (error) throw new Error(ERRORS.INVALID_CREDENTIALS)

    return {success: true, redirectTo: DEFAULT_URL_WHEN_AUTHENTICATED}
}
