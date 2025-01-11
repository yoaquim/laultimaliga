export const DOMAIN: string = process.env.NODE_ENV === 'production'
    ? 'laultimaliga.com'
    : 'localhost:3000'

export const DEFAULT_URL_WHEN_AUTHENTICATED = `/dashboard/matches`
export const DEFAULT_URL_WHEN_NOT_AUTHENTICATED = '/sign-in'

export const ERRORS = {
    INVALID_EMAIL_OR_PASSWORD: 'Invalid email or password',
    USER_ALREADY_EXISTS: 'A user with this email already exists.',
    ERROR_CREATING_USER_IN_PRISMA: 'Error creating user in prisma.',
    ERROR_SIGNING_UP_USER: 'Error signing up user.',
    ERROR_SIGNING_UP_USER_IN_SUPABASE: 'Error signing up user in Supabase',
    ERROR_VERIFYING_EMAIL: 'Error verifying email:',
    EMAIL_VERIFICATION_FAILED: 'Email verification failed',
    EMAIL_VERIFICATION_FAILED_TOKEN_INVALID: 'Email verification failed Token is missing or invalid',
    INVALID_CREDENTIALS: 'Invalid credentials',
}

export const EMPTY_MESSAGES = {
    MATCH_DOES_NOT_EXIST: 'This Match does not exist.',
    TEAM_DOES_NOT_EXIST: 'This Team does not exist.',
    NO_MATCHES: 'There aren\'t any matches yet.',
    NO_TEAMS: 'There aren\'t any teams yet.',
    NO_PLAYERS: 'There aren\'t any players yet.',
}