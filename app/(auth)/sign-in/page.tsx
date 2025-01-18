'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInUser } from './actions'
import Spinner from '@/ui/spinner'
import { DOMAIN } from '@/lib/utils'
import { IoEye, IoEyeOff } from 'react-icons/io5'
import Link from 'next/link'

function SignInForm({onSubmit, loading, error,}: { onSubmit: (formData: FormData) => Promise<void>, loading: boolean, error: string | null }) {
    const [passwordShown, setPasswordShown] = useState<boolean>(false)

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
                    className="py-1 px-2 rounded-md text-white bg-lul-black/50 border-lul-light-grey"
                />
            </div>

            {/* PASSWORD FIELD */}
            <div className="flex flex-col gap-y-1">
                <label htmlFor="password" className="text-white text-sm uppercase font-semibold">Password</label>
                <div className="flex">
                    <input
                        id="password"
                        name="password"
                        type={passwordShown ? 'text' : 'password'}
                        placeholder="Enter your password"
                        required
                        className="flex-1 py-2 px-2 rounded-md text-white bg-lul-black/50 border-lul-light-grey rounded-r-none"
                    />
                    <div className="flex flex-col justify-center item-center border border-l-0 border-lul-light-grey bg-lul-black/50 rounded-r-md px-3 py-1 cursor-pointer">
                        {!passwordShown && <IoEye className="text-xl text-white" onClick={() => setPasswordShown(true)}/>}
                        {passwordShown && <IoEyeOff className="text-xl text-white" onClick={() => setPasswordShown(false)}/>}
                    </div>
                </div>

                {/* FORGOT PASSWORD */}
                <Link href="/reset-password" className="text-lul-blue flex justify-end items-center font-medium">
                    Forgot Password?
                </Link>
            </div>

            {/* ERROR MESSAGE */}
            {error && <p className="font-semibold text-center text-lul-red">{error}</p>}

            {/* SUBMIT BUTTON */}
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
            <p className="text-center  text-lul-light-grey">
                Don&#39;t have an account?{' '}
                <Link href="/sign-up" className="text-lul-blue font-semibold">
                    Sign Up
                </Link>
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
        const {data, errors} = await signInUser(formData)

        if (errors) {
            setError(errors[0].message)
            setLoading(false)
        } else if (data) {
            const x = `${DOMAIN}${data[0].redirectTo}`
            console.log(`DOMAIN: ${x}`)
            router.push(x)
        }
    }

    return <SignInForm onSubmit={handleSubmit} loading={loading} error={error}/>
}
