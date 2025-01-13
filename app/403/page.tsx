import Link from 'next/link'
import { DEFAULT_URL_WHEN_AUTHENTICATED } from '@/lib/utils'

export default function ForbiddenPage() {
    return (
        <div className="h-screen flex flex-col justify-center items-center bg-lul-black">
            <h1 className="text-4xl font-bold text-white">Forbidden</h1>
            <p className="mt-4 text-sm uppercase font-bold text-lul-blue">You don't have access to this page</p>
            <Link href={DEFAULT_URL_WHEN_AUTHENTICATED} className="mt-6 px-4 py-2 text-sm font-bold text-white bg-lul-blue rounded hover:bg-blue-700 transition uppercase">
                Go to Home
            </Link>
        </div>
    )
}