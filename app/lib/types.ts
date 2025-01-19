import { User as SupabaseUser } from '@supabase/auth-js/dist/module/lib/types'
import { Session } from '@supabase/auth-js'
import { StatusCodes } from 'http-status-codes'

export type LulColor = 'blue' | 'green' | 'red' | 'yellow' | 'orange'

export interface FunctionResponse<T> {
    data: T | T[] | null
    error: BackendError | null
}

export interface SupabaseDataResponse {
    user: SupabaseUser | null,
    session: Session | null
}

export interface BackendError {
    message: string,
    error?: Error
    status?: StatusCodes
}

export interface BackendResponse<T> {
    data: T[] | null
    errors: Error[] | BackendError[] | null
    message?: string
    status?: StatusCodes
}
