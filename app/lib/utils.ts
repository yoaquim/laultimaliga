import { User } from '@prisma/client'
import { BackendResponse } from '@/lib/types'
import { NextResponse } from 'next/server'
import { StatusCodes } from 'http-status-codes'

export const DOMAIN: string = process.env.NODE_ENV === 'production' ? 'https://laultimaliga.com' : 'http://localhost:3000'
export const DEFAULT_URL_WHEN_AUTHENTICATED = `/dashboard/settings`
export const DEFAULT_URL_WHEN_NOT_AUTHENTICATED = '/sign-in'
export const BUCKET_ENDPOINT = 'https://opkpwsseguyivdrawleq.supabase.co/storage/v1/object/public/lul'
export const TEAM_LOGO_URL_BUILDER = (path: string) => `${BUCKET_ENDPOINT}/teams/logos/${path}`
export const DEFAULT_PROFILE_PIC_BUILDER = (name: string) => `https://ui-avatars.com/api/?name=${name}`
export const PROFILE_PIC_BUILDER = (user: User) => user.image
    ? `${BUCKET_ENDPOINT}/${user.image}?v=${new Date().getTime()}`
    : DEFAULT_PROFILE_PIC_BUILDER(user.name)

export const EMPTY_MESSAGES = {
    MATCH_DOES_NOT_EXIST: 'This Match does not exist',
    TEAM_DOES_NOT_EXIST: 'This Team does not exist',
    PLAYER_DOES_NOT_EXIST: 'This Player does not exist',
    NO_MATCHES: 'There aren\'t any matches yet',
    NO_TEAMS: 'There aren\'t any teams yet',
    NO_PLAYERS: 'There aren\'t any players yet',
}

export const ERRORS = {
    ISE: 'Internal server error.',
    METHOD_NOT_ALLOWED: 'Method now allowed.',
    AUTH: {
        UNAUTHORIZED_ACCESS: (pathname: string) => `Unauthorized access to admin path: ${pathname}.`,
        USER_NOT_FOUND_IN_DATABASE: (userId: string) => `User with ID ${userId} not found in database.`,
        NOT_AUTHENTICATED: 'Not Authenticated',
        INVALID_EMAIL_OR_PASSWORD: 'Invalid email or password',
        USER_ALREADY_EXISTS: 'A user with this email already exists.',
        ERROR_CREATING_USER_IN_PRISMA: 'Error creating user in prisma.',
        ERROR_SIGNING_UP_USER: 'Error signing up user',
        ERROR_SIGNING_UP_USER_IN_SUPABASE: 'Error signing up user in Supabase.',
        ERROR_VERIFYING_EMAIL: 'Error verifying email.',
        EMAIL_VERIFICATION_FAILED: 'Email verification failed.',
        EMAIL_VERIFICATION_FAILED_TOKEN_INVALID: 'Email verification failed. Token is missing or invalid.',
        INVALID_CREDENTIALS: 'Invalid credentials.',
        ERROR_CHECKING_ADMIN_STATUS: 'Error checking admin status',
        ERROR_PARSING_ADMIN_STATUS: 'Error parsing admin status error',
        SUPABASE_AUTH_ERROR: 'Supabase authentication error.',
        USER_NOT_FOUND_IN_SUPABASE_SESSION: 'No user found in Supabase session.',
        UNAUTHORIZED_ACCESS_ATTEMPT: 'Unauthorized access attempt. Admin privileges are required.',
        PASSWORD_UPDATE_FAILED: 'Couldn\'t update password',
        EMAIL_UPDATE_FAILED: 'Couldn\'t update email',
        USER_NOT_FOUND: 'User not found',
        NO_NEW_EMAIL: 'No new email',
        UNKNOWN_AUTH_FLOW: 'Unknown auth flow',
    },
    MATCH: {
        ERROR_UPDATING_MATCH_STATUS: 'Error updating match status.',
        ERROR_UPDATING_STATS: 'Error updating stats.',
    },
    PLAYER: {
        PLAYER_ID_REQUIRED: 'playerId is required.',
        PLAYER_NOT_FOUND: 'Player not found.',
        PLAYER_NOT_UNCLAIMED: 'This player is not unclaimed. Already has an email or a claimed user.',
        PRISMA_USER_NOT_FOUND: 'Cannot find a corresponding Prisma user for the current session user.',
        PLAYER_PHONE_NUMBER_DOESNT_MATCH: 'Phone numbers do not match. Cannot claim this player.',
        ERROR_CLAIMING_PLAYER: 'Error claiming player',
    },
    SETTINGS: {
        ERROR_LOADING_PROFILE: 'Error loading profile',
        FAILED_TO_LOAD_PROFILE: 'Failed to load profile',
        NO_FILE_SELECTED: 'No File Selected',
        USER_PROFILE_NOT_LOADED: 'User profile not loaded',
        FAILED_TO_CLAIM_PLAYER_PROFILE: 'Couldn\'t claim player profile',
    }
}

export const SUPABASE_ERROR_TABLE: Record<string, string> = {
    'weak_password': 'Passwords need to be at least 10 characters long, and should include uppercase, lowercase, digits, and special characters ',
    'email_address_invalid': 'This email address cannot be used to signup',
    'email_exists': 'A user with this email already exists',
    'email_not_confirmed': 'You must confirm your email address before signing in',
    'reauthentication_needed': 'You need to sign out and sign in again',
    'user_already_exists': 'A user with this information already exists',
}

export function jsonResponse<T>(payload: BackendResponse<T>) {
    return JSON.parse(JSON.stringify(payload))
}

export function jsonNextResponse<T>(payload: BackendResponse<T>, status?: StatusCodes): NextResponse<BackendResponse<T>> {
    const plainPayload = JSON.parse(JSON.stringify(payload))
    return NextResponse.json(plainPayload, {status})
}

export function formatTimeElapsed(seconds: number) {
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Standardize a phone number string by removing any non-digit characters.
 * For example:
 *   "+1347-510-8940"        => "3475108940"   (if 11 digits starting with 1, drop country code)
 *   "+1-347-510-8940"        => "3475108940"
 *   "+13475108940"           => "3475108940"
 *   "13475108940"            => "3475108940"
 *   "787-393-1474"           => "7873931474"
 *
 * @param phone The input phone number as a string.
 * @returns The standardized phone number containing only digits.
 */
export function standardizePhoneNumber(phone: string): string {
    // Remove all non-digit characters.
    const digitsOnly = phone.replace(/\D/g, '')

    // If the resulting string has 11 digits and begins with "1", drop the first digit.
    if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
        return digitsOnly.slice(1)
    }

    // Otherwise, if we have 10 digits, assume it's already a standard domestic number.
    // (You can add more rules here for different country codes if needed.)
    if (digitsOnly.length === 10) {
        return digitsOnly
    }

    // If the digits length is something else, return the digitsOnly string.
    // You may also choose to throw an error or handle it differently.
    return digitsOnly
}
