'use client'

import Spinner from '@/ui/spinner'
import { FormEvent, useState } from 'react'
import { resetPassword } from './actions'

export default function Page() {
    const [loading, setLoading] = useState<boolean>(false)
    const [success, setSuccess] = useState<boolean>(false)
    const [error, setError] = useState<string>('')

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        setLoading(true)
        const {errors} = await resetPassword(formData)
        if (errors) setError(errors[0].message)
        else setSuccess(true)
    }

    if (!success) return (
        <form
            onSubmit={handleSubmit}
            className="w-full mx-auto px-6 py-4 bg-lul-grey/20 rounded-md shadow-md space-y-6">

            <h1 className="text-left text-xl font-bold text-white uppercase border-b border-lul-blue">
                Reset your Password
            </h1>

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
                        Resetting Password...
                    </div>
                    : 'Reset Password'
                }
            </button>
        </form>
    )

    return (
        <p className="w-full text-white font-medium text-center">
            If an account with that email exists, an email will be sent with instructions on how to reset your password.
        </p>
    )
}