import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EmailOtpType } from '@supabase/auth-js'
import { DEFAULT_URL_WHEN_AUTHENTICATED, ERRORS } from '@/lib/utils'

export async function GET(request: Request) {
    const url = new URL(request.url)
    const token_hash = url.searchParams.get('token_hash')
    const type: EmailOtpType | null = url.searchParams.get('type') as EmailOtpType

    if (token_hash && type) {
        const supabase = await createClient()
        const {error} = await supabase.auth.verifyOtp({type, token_hash})

        if (error) {
            console.error(ERRORS.AUTH.ERROR_VERIFYING_EMAIL, error)
            return new Response(ERRORS.AUTH.EMAIL_VERIFICATION_FAILED, {status: 400})
        }

        return redirect(DEFAULT_URL_WHEN_AUTHENTICATED)
    }

    return redirect('/sign-in')
}
