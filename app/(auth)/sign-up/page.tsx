'use client'

import { FormEvent, useState } from 'react'
import { signUpUser } from '@/(auth)/sign-up/actions'
import Spinner from '@/ui/spinner'
import { User } from '@prisma/client'
import { BackendResponse } from '@/lib/types'
import { IoEye, IoEyeOff } from 'react-icons/io5'

function SignUpSuccess() {
    return (
        <p className="w-full text-white font-medium text-center">
            We&#39;ve sent a confirmation email to the address provided.
            <br/>
            Follow the instructions there to continue.
        </p>
    )
}

function SignUpForm({
                        onSubmit,
                        loading,
                        error,
                    }: {
    onSubmit: (formData: FormData) => Promise<void>
    loading: boolean
    error: string | null
}) {
    const [passwordShown, setPasswordShown] = useState<boolean>(false)

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        await onSubmit(formData)
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full mx-auto px-6 py-4 bg-lul-grey/20 rounded-md shadow-md space-y-6"
        >
            <h1 className="text-left text-xl font-bold text-white uppercase border-b border-lul-blue">
                Sign Up
            </h1>

            {/* EMAIL FIELD */}
            <div className="flex flex-col gap-y-1">
                <label htmlFor="email" className="text-white text-sm uppercase font-semibold">
                    Email
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="email@example.com"
                    required
                    className="py-2 px-2 rounded-md text-white bg-lul-black/50 border-white"
                />
            </div>

            {/* NAME FIELD */}
            <div className="flex flex-col gap-y-1">
                <label htmlFor="name" className="text-white text-sm uppercase font-semibold">
                    Name
                </label>
                <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Juan Doe"
                    required
                    className="py-2 px-2 rounded-md text-white bg-lul-black/50 border-white"
                />
            </div>

            {/* PHONE FIELD */}
            <div className="flex flex-col gap-y-1">
                <label htmlFor="phone" className="text-white text-sm uppercase font-semibold">
                    Phone
                </label>
                <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="787-555-6789"
                    required
                    className="py-2 px-2 rounded-md text-white bg-lul-black/50 border-white"
                />
            </div>

            {/* PASSWORD FIELD */}
            <div className="flex flex-col gap-y-1">
                <label htmlFor="password" className="text-white text-sm uppercase font-semibold">
                    Password
                </label>
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
            </div>

            {/* ERROR MESSAGE */}
            {error && <p className="text-center text-sm text-lul-red">{error}</p>}

            {/* SUBMIT BUTTON */}
            <button
                type="submit"
                disabled={loading}
                className="w-full py-2 text-white bg-lul-blue uppercase text-sm rounded-md font-medium hover:bg-lul-blue/80 transition"
            >
                {loading ? (
                    <div className="flex justify-center items-center gap-x-4">
                        <div className="w-4 h-4">
                            <Spinner/>
                        </div>
                        Signing Up...
                    </div>
                ) : (
                    'Sign Up'
                )}
            </button>

            {/* REDIRECT TO SIGN IN */}
            <p className="text-center text-lul-light-grey ">
                Have an account?{' '}
                <a href="/sign-in" className="text-lul-blue font-semibold">
                    Sign In
                </a>
            </p>
        </form>
    )
}

export default function SignUpPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)
        setError(null)
        // @ts-ignore
        const {errors}: BackendResponse<User> = await signUpUser(formData)
        if (errors) {
            setLoading(false)
            setError(errors[0].message)
        } else setSuccess(true)
    }

    if (success) return <SignUpSuccess/>
    return <SignUpForm onSubmit={handleSubmit} loading={loading} error={error}/>
}
