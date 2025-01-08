export const DOMAIN: string = process.env.NODE_ENV === 'production'
    ? 'laultimaliga.com'
    : 'localhost:3000'

export const DEFAULT_URL_WHEN_AUTHENTICATED = '/dashboard/matches'
export const DEFAULT_URL_WHEN_NOT_AUTHENTICATED = '/sign-in'

export const ERRORS = {
    INVALID_EMAIL_OR_PASSWORD: 'Invalid email or password',
    USER_ALREADY_EXISTS: 'A user with this email already exists.',
    ERROR_CREATING_USER_IN_PRISMA: 'Error creating user in prisma.',
    ERROR_SIGNING_UP_USER: 'Error signing up user.',
    ERROR_SIGNING_UP_USER_IN_SUPABASE: 'Error signing up user in Supabase',
    INVALID_CREDENTIALS: 'Invalid credentials',
}