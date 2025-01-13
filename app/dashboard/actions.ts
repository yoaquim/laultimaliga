'use server'

import { isAdmin } from '@/lib/rba'

export async function getIsAdmin() {
    return await isAdmin()
}
