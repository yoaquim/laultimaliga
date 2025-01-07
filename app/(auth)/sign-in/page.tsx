'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInUser } from './actions'
import Spinner from '@/ui/spinner'


function SignInForm({onSubmit, loading, error,}:
                    {
                        onSubmit: (formData: FormData) => Promise<void>
                        loading: boolean
                        error: string | null
                    }
) {
    return (
        <form
            onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                await onSubmit(formData)
            }}
            className="lg:w-1/3 lg:mx-0 w-5/6 flex flex-col space-y-4 px-8 py-8 border border-white rounded-sm text-lul-grey font-medium"
        >
            <div className="flex flex-col space-y-2">
                <label htmlFor="email" className="font-medium text-white">Email</label>
                <input
                    className="p-2 bg-white rounded-sm"
                    type="email"
                    name="email"
                    placeholder="email@example.com"
                    required
                />
            </div>

            <div className="flex flex-col space-y-2">
                <label htmlFor="password" className="font-medium text-white">Password</label>
                <input
                    className="p-2 bg-white rounded-sm"
                    type="password"
                    name="password"
                    required
                />
            </div>

            {error && (
                <p className="w-full text-center text-lul-red">{error}</p>
            )}

            <div className="w-full">
                <button
                    type="submit"
                    className="w-full mt-4 py-3 bg-lul-blue text-white rounded-sm text-sm"
                >
                    {true ? <Spinner/> : 'Sign In'}
                </button>
            </div>

            <p className="text-lul-light-grey text-center">
                Don&#39;t have an account?{' '}
                <a href="/sign-up" className="text-lul-blue font-medium">Sign Up</a>
            </p>
        </form>
    )
}

export default function Page() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)
        setError(null)

        try {
            const {redirectTo} = await signInUser(formData) // Invoke the server action
            router.push(redirectTo)
        } catch (err: any) {
            setError(err.message || 'Unknown error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <SignInForm onSubmit={handleSubmit} loading={loading} error={error}/>
    )
}
