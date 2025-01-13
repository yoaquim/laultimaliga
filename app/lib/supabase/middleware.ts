import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { DEFAULT_URL_WHEN_AUTHENTICATED, DEFAULT_URL_WHEN_NOT_AUTHENTICATED, DOMAIN, ERRORS } from '@/lib/utils'
import { isAdmin } from '@/lib/rba'

const PUBLIC_PATHS = [
    '/sign-in',
    '/sign-up',
    '/auth'
]

const PRIVATE_PATHS = [
    '/dashboard',
]

const ADMIN_PATHS = [
    '/admin',
    '/dashboard/admin',
]

let ADMIN_CACHE: { [userId: string]: boolean } = {}

async function checkAdminCached(request: Request, userId: string): Promise<boolean> {
    if (ADMIN_CACHE[userId] !== undefined) {
        return ADMIN_CACHE[userId]
    }
    const adminCheck = await fetch(`${DOMAIN}/api/auth/check-admin`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || '',
        },
    })
    const {isAdmin} = await adminCheck.json()

    ADMIN_CACHE[userId] = isAdmin
    return isAdmin
}

export async function updateSession(request: NextRequest) {
    const {pathname} = request.nextUrl
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({name, value, options}) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({name, value, options}) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Do not run code between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    // IMPORTANT: DO NOT REMOVE auth.getUser()

    const {data: {user}} = await supabase.auth.getUser()

    const isPublicPath = pathname === '/' || PUBLIC_PATHS.some((path) => pathname.startsWith(path))
    const isPrivatePath = PRIVATE_PATHS.some((path) => pathname.startsWith(path))
    const isAdminPath = ADMIN_PATHS.some((path) => pathname.startsWith(path))

    // Redirect unauthenticated users trying to access private paths
    if (!user && !isPublicPath) {
        const url = request.nextUrl.clone()
        url.pathname = DEFAULT_URL_WHEN_NOT_AUTHENTICATED
        return NextResponse.redirect(url)
    }

    // Redirect authenticated users trying to access public paths
    if (user && !isPrivatePath) {
        const url = request.nextUrl.clone()
        url.pathname = DEFAULT_URL_WHEN_AUTHENTICATED
        return NextResponse.redirect(url)
    }

    // Enforce admin-only access for admin paths
    if (user && isAdminPath) {
        try {
            const isAdmin = checkAdminCached(request, user.id)
            if (!isAdmin) {
                console.error(ERRORS.AUTH.UNAUTHORIZED_ACCESS(pathname))
                const url = request.nextUrl.clone()
                url.pathname = '/403'
                return NextResponse.redirect(url)
            }
        } catch (error) {
            console.error(ERRORS.AUTH.ERROR_CHECKING_ADMIN_STATUS, error)
            const url = request.nextUrl.clone()
            url.pathname = '/403'
            return NextResponse.redirect(url)
        }
    }
    // IMPORTANT: You *must* return the supabaseResponse object as it is.
    // If you're creating a new response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!
    // 4. Finally:
    //    return myNewResponse
    // If this is not done, you may be causing the browser and server to go out
    // of sync and terminate the user's session prematurely!

    return supabaseResponse
}