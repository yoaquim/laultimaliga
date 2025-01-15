'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInUser } from './actions'
import Spinner from '@/ui/spinner'

function SignInForm({onSubmit, loading, error,}: {
    onSubmit: (formData: FormData) => Promise<void>
    loading: boolean
    error: string | null
}) {

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        await onSubmit(formData)
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full mx-auto px-6 py-4 bg-lul-grey/20 rounded-md shadow-md space-y-6">

            <h1 className="text-left text-xl font-bold text-white uppercase border-b border-lul-blue">Sign In</h1>

            {/* EMAIL FIELD */}
            <div className="flex flex-col gap-y-1">
                <label htmlFor="email" className="text-white text-sm uppercase font-semibold">Email</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="email@example.com"
                    required
                    className="py-1 px-2 rounded-md text-white bg-lul-black/50"
                />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-y-1">
                <label htmlFor="password" className="text-white text-sm uppercase font-semibold">Password</label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                    className="py-1 px-2 rounded-md text-white bg-lul-black/50"
                />
            </div>

            {/* Error Message */}
            {error && <p className="text-center text-lul-red">{error}</p>}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={loading}
                className="w-full py-2 text-white bg-lul-blue uppercase text-sm rounded-md font-medium hover:bg-lul-blue/80 transition"
            >
                {loading
                    ?
                    <div className="flex justify-center items-center gap-x-4">
                        <div className="w-4 h-4">
                            <Spinner/>
                        </div>
                        Signing In...
                    </div>
                    : 'Sign In'
                }
            </button>

            {/* Redirect to Sign Up */}
            <p className="text-center text-sm  font-semibold text-lul-light-grey uppercase">
                Don&#39;t have an account?{' '}
                <a href="/sign-up" className="text-lul-blue font-bold">
                    Sign Up
                </a>
            </p>
        </form>
    )
}

export default function SignInPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)
        setError(null)

        try {
            const {redirectTo} = await signInUser(formData) // Invoke server action
            router.push(redirectTo)
        } catch (err: any) {
            setError(err.message || 'Invalid email or password')
        }
    }

    return <SignInForm onSubmit={handleSubmit} loading={loading} error={error}/>
}
