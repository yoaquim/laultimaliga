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
        <>
            {/* Header */}
                <h1 className="text-left lg:mt-0 py-4 mt-4 text-xl font-medium text-white">Sign In</h1>


            {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="w-full mx-auto p-6 bg-lul-grey/20 rounded-sm shadow-md space-y-6"
                >
                    {/* Email Field */}
                    <div className="flex flex-col">
                        <label htmlFor="email" className="text-white">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="email@example.com"
                            required
                            className="p-2 rounded-sm bg-white text-black"
                        />
                    </div>

                    {/* Password Field */}
                    <div className="flex flex-col">
                        <label htmlFor="password" className="text-white">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Enter your password"
                            required
                            className="p-2 rounded-sm bg-white text-black"
                        />
                    </div>

                    {/* Error Message */}
                    {error && <p className="text-center text-lul-red">{error}</p>}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 text-white bg-lul-blue rounded-sm text-lg font-medium hover:bg-lul-blue/80 transition"
                    >
                        {loading ? <Spinner/> : 'Sign In'}
                    </button>

                    {/* Redirect to Sign Up */}
                    <p className="text-center text-lul-light-grey">
                        Don&#39;t have an account?{' '}
                        <a href="/sign-up" className="text-lul-blue font-medium">
                            Sign Up
                        </a>
                    </p>
                </form>
        </>
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
            router.push(redirectTo) // Redirect on successful sign-in
        } catch (err: any) {
            setError(err.message || 'Invalid email or password')
        } finally {
            setLoading(false)
        }
    }

    return <SignInForm onSubmit={handleSubmit} loading={loading} error={error}/>
}
