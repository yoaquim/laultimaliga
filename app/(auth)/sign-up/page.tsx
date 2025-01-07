'use client'

import { FormEvent, useState } from 'react'
import { signUpUser } from '@/(auth)/sign-up/actions'
import Spinner from '@/ui/spinner'

function SignUpSuccess() {
    return (
        <div className="lg:mt-4 h-5/6 w-full p-6 mt-10 flex flex-col items-center justify-center bg-lul-black text-white">
            <p className="lg:w-1/3 w-full px-12 text-white font-medium text-center">
                We&#39;ve sent a confirmation email to the address provided.
                <br/>
                Follow the instructions there to continue.
            </p>
        </div>
    )
}

function SignUpForm({onSubmit, loading, error,}: {
    onSubmit: (formData: FormData) => Promise<void>
    loading: boolean
    error: string | null
}) {
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        await onSubmit(formData)
    }
    // const sizes: string[] = ['SMALL', 'MEDIUM', 'LARGE', 'X_LARGE', 'XX_LARGE']

    return (
        <div className="lg:w-1/3 lg:mt-16 w-full h-5/6 px-6 flex flex-col items-center">

            <h1 className="lg:self-start lg:mt-0 mt-4 py-4 text-xl font-medium text-white text-center">Sign Up</h1>

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

                {/* Name Field */}
                <div className="flex flex-col">
                    <label htmlFor="name" className="text-white">Name</label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Juan Doe"
                        required
                        className="p-2 rounded-sm bg-white text-black"
                    />
                </div>

                {/* Phone Field */}
                <div className="flex flex-col">
                    <label htmlFor="phone" className="text-white">Phone</label>
                    <input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="787-555-6789"
                        required
                        className="p-2 rounded-sm bg-white text-black"
                    />
                </div>

                {/* Size Field */}
                {/*<div className="flex flex-col space-y-2">*/}
                {/*    <label htmlFor="size" className="font-medium text-white">Size</label>*/}
                {/*    <select className="p-2 bg-white rounded-sm" name="size" id="size" required>*/}
                {/*        {sizes.map((size) => (*/}
                {/*            <option key={size} value={size}>*/}
                {/*                {size.replace('_', '-')}*/}
                {/*            </option>*/}
                {/*        ))}*/}
                {/*    </select>*/}
                {/*</div>*/}

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
                    {loading ? <Spinner/> : 'Sign Up'}
                </button>

                {/* Redirect to Sign In */}
                <p className="text-center text-lul-light-grey">
                    Have an account?{' '}
                    <a href="/sign-in" className="text-lul-blue font-medium">
                        Sign In
                    </a>
                </p>
            </form>
        </div>
    )
}

export default function SignUpPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)
        setError(null)

        try {
            await signUpUser(formData)
            setSuccess(true)
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred')
        } finally {
            setLoading(false)
        }
    }

    if (success) return <SignUpSuccess/>

    return <SignUpForm onSubmit={handleSubmit} loading={loading} error={error}/>
}
