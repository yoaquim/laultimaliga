import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { EmailOtpType } from '@supabase/auth-js'
import { DEFAULT_URL_WHEN_AUTHENTICATED } from '@/lib/utils'

export async function GET(request: Request) {
    const url = new URL(request.url)
    const token_hash = url.searchParams.get('token_hash')
    const type: EmailOtpType | null = url.searchParams.get(
        'type'
    ) as EmailOtpType

    if (token_hash && type) {
        const supabase = await createClient()
        const {error} = await supabase.auth.verifyOtp({type, token_hash})

        if (error) {
            console.error('Error verifying email:', error)
            return new Response('Email verification failed', {status: 400})
        }

        return NextResponse.redirect(DEFAULT_URL_WHEN_AUTHENTICATED)
    }

    return new Response(
        'Email verification failed: Token is missing or invalid',
        {status: 400}
    )
}
