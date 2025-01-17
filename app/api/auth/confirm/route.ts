import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EmailOtpType } from '@supabase/auth-js'
import { DEFAULT_URL_WHEN_AUTHENTICATED, ERRORS } from '@/lib/utils'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    const url = new URL(request.url)
    const token_hash = url.searchParams.get('token_hash')
    const type: EmailOtpType | null = url.searchParams.get('type') as EmailOtpType

    if (token_hash && type) {
        const supabase = await createClient()
        const {error: otpError} = await supabase.auth.verifyOtp({type, token_hash})
        const {data, error} = await supabase.auth.getUser()

        if (otpError || error) {
            const err = otpError || error
            console.error(ERRORS.AUTH.ERROR_VERIFYING_EMAIL, err)
            return new Response(ERRORS.AUTH.EMAIL_VERIFICATION_FAILED, {status: 400})
        }

        if (!data?.user) {
            return new Response(ERRORS.AUTH.USER_NOT_FOUND_IN_SUPABASE_SESSION, {status: 400})
        }

        switch (type) {
            case 'signup':
                // Handle signup flow
                return redirect(DEFAULT_URL_WHEN_AUTHENTICATED)

            case 'recovery':
                // Handle password reset flow
                return redirect(`/settings?reset-password=true`)

            case 'email_change':
                // Handle email change confirmation
                if (!data?.user) {
                    return new Response(ERRORS.AUTH.USER_NOT_FOUND_IN_SUPABASE_SESSION, {status: 400})
                }

                // Fetch the user with the old email from your database
                const userId = data.user.id
                const user = await prisma.user.findUnique({where: {id: userId}})

                if (!user) {
                    console.error(ERRORS.AUTH.USER_NOT_FOUND, {userId})
                    return new Response(ERRORS.AUTH.USER_NOT_FOUND, {status: 400})
                }

                // Ensure there's a `newEmail` stored in the database for verification
                if (!user.newEmail) {
                    console.error(ERRORS.AUTH.NO_NEW_EMAIL, {userId})
                    return new Response(ERRORS.AUTH.NO_NEW_EMAIL, {status: 400})
                }

                // Update the email in your database and clear the `newEmail` field
                await prisma.user.update({
                    where: {id: userId},
                    data: {
                        email: user.newEmail,
                        newEmail: null, // Clear the newEmail field
                    },
                })

                return redirect(`/settings?email_changed=true`)

            default:
                return NextResponse.json('Unknown auth flow', {status: 400})
        }
    }

    return redirect('/sign-in')
}
