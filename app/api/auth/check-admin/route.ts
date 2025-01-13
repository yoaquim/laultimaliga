import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/rba'
import { ERRORS } from '@/lib/utils'

export async function GET() {
    try {
        // Check if the user is an admin
        const userIsAdmin = await isAdmin()

        if (!userIsAdmin) {
            console.error(ERRORS.RBA.UNAUTHORIZED_ACCESS_ATTEMPT)
            return NextResponse.json({error: 'Forbidden'}, {status: 403})
        }

        return NextResponse.json({isAdmin: true}, {status: 200})
    } catch (err) {
        // Handle any unexpected errors, including unauthorized access
        console.error(ERRORS.AUTH.ERROR_CHECKING_ADMIN_STATUS, err)

        // Parse error message for known unauthorized errors
        if (err instanceof Error) {
            try {
                const parsedError = JSON.parse(err.message)
                if (parsedError.status === 403) {
                    return NextResponse.json({error: parsedError.message}, {status: 403})
                }
            } catch (parseError) {
                // If error message isn't JSON-parsable, fall back to internal server error
                console.error(ERRORS.AUTH.ERROR_PARSING_ADMIN_STATUS, parseError)
            }
        }

        return NextResponse.json({error: ERRORS.AUTH.ERROR_CHECKING_ADMIN_STATUS}, {status: 500})
    }
}
