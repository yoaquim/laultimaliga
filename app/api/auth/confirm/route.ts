import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EmailOtpType } from '@supabase/auth-js'
import { DEFAULT_URL_WHEN_AUTHENTICATED, ERRORS, jsonNextResponse, jsonResponse, SUPABASE_ERROR_TABLE } from '@/lib/utils'
import { prisma } from '@/lib/prisma'
import { StatusCodes } from 'http-status-codes'

export async function GET(request: Request) {
    const url = new URL(request.url)
    const token_hash = url.searchParams.get('token_hash')
    const type: EmailOtpType | null = url.searchParams.get('type') as EmailOtpType

    if (token_hash && type) {
        const supabase = await createClient()
        const {error: otpError} = await supabase.auth.verifyOtp({type, token_hash})
        const {data, error: userError} = await supabase.auth.getUser()
        const error = otpError || userError

        if (error) {
            console.error(ERRORS.AUTH.ERROR_VERIFYING_EMAIL, error)
            const message = SUPABASE_ERROR_TABLE[error.code as string] || error.message
            return jsonNextResponse({data: null, errors: [{message}], status: StatusCodes.UNPROCESSABLE_ENTITY})
        }

        if (!data?.user) {
            const error = {message: ERRORS.AUTH.USER_NOT_FOUND_IN_SUPABASE_SESSION}
            console.error(error)
            return jsonNextResponse({data: null, errors: [error]})
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

                return redirect(`/settings?email-changed=true`)

            default:
                return jsonNextResponse({data: null, errors: [{message: ERRORS.AUTH.UNKNOWN_AUTH_FLOW}], status: 400})
        }
    }

    return redirect('/sign-in')
}
