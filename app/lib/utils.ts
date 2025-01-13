export const DOMAIN: string = process.env.NODE_ENV === 'production'
    ? 'https://laultimaliga.com'
    : 'http://localhost:3000'

export const DEFAULT_URL_WHEN_AUTHENTICATED = `/dashboard/matches`
export const DEFAULT_URL_WHEN_NOT_AUTHENTICATED = '/sign-in'

export const ERRORS = {
    AUTH: {
        UNAUTHORIZED_ACCESS: (pathname: string) => `Unauthorized access to admin path: ${pathname}.`,
        INVALID_EMAIL_OR_PASSWORD: 'Invalid email or password',
        USER_ALREADY_EXISTS: 'A user with this email already exists.',
        ERROR_CREATING_USER_IN_PRISMA: 'Error creating user in prisma.',
        ERROR_SIGNING_UP_USER: 'Error signing up user.',
        ERROR_SIGNING_UP_USER_IN_SUPABASE: 'Error signing up user in Supabase.',
        ERROR_VERIFYING_EMAIL: 'Error verifying email.',
        EMAIL_VERIFICATION_FAILED: 'Email verification failed.',
        EMAIL_VERIFICATION_FAILED_TOKEN_INVALID: 'Email verification failed. Token is missing or invalid.',
        INVALID_CREDENTIALS: 'Invalid credentials.',
        ERROR_CHECKING_ADMIN_STATUS: 'Error checking admin status',
        ERROR_PARSING_ADMIN_STATUS: 'Error parsing admin status error',
    },
    RBA: {
        SUPABASE_AUTH_ERROR: 'Supabase authentication error.',
        USER_NOT_FOUND_IN_SUPABASE_SESSION: 'No user found in Supabase session.',
        USER_NOT_FOUND_IN_DATABASE: (userId: string) => `User with ID ${userId} not found in database.`,
        UNAUTHORIZED_ACCESS_ATTEMPT: 'Unauthorized access attempt. Admin privileges are required.',
    },
    MATCH: {
        ERROR_UPDATING_MATCH_STATUS: 'Error updating match status.',
        ERROR_UPDATING_STATS: 'Error updating stats.',
    },
}

export const EMPTY_MESSAGES = {
    MATCH_DOES_NOT_EXIST: 'This Match does not exist.',
    TEAM_DOES_NOT_EXIST: 'This Team does not exist.',
    PLAYER_DOES_NOT_EXIST: 'This Player does not exist.',
    NO_MATCHES: 'There aren\'t any matches yet.',
    NO_TEAMS: 'There aren\'t any teams yet.',
    NO_PLAYERS: 'There aren\'t any players yet.',
}
