'use client'

import { ReactNode, useState } from 'react'
import Spinner from '@/ui/spinner'
import { signUpUser } from '@/(auth)/sign-up/actions'

function SignUpSuccess() {
    return (
        <p className="lg:w-1/3 lg:px-0 w-full px-12 text-white font-medium text-center">
            We&#39;ve sent a confirmation email to the address provided.
            <br/>
            Follow the instructions there to continue.
        </p>
    )
}

function SignUpError({error}: { error: string | null }) {
    return error ? <p className="w-full text-center text-lul-red">{error}</p> : null
}

function SignUpForm({loading, children}: { loading: boolean, children: ReactNode }) {
    // const sizes: string[] = ['SMALL', 'MEDIUM', 'LARGE', 'X_LARGE', 'XX_LARGE']
    return (
        <form
            action={signUpUser}
            className="lg:w-1/3 lg:mx-0 w-5/6 flex flex-col space-y-4 px-8 py-8 border border-white rounded-sm text-lul-grey font-medium">

            <div className="flex flex-col space-y-2">
                <label htmlFor="email" className="font-medium text-white">Email</label>
                <input className="p-2 bg-white rounded-sm" type="email" name="email" placeholder="email@example.com" required/>
            </div>

            <div className="flex flex-col space-y-2">
                <label htmlFor="name" className="font-medium text-white">Name</label>
                <input className="p-2 bg-white rounded-sm" type="text" name="name" placeholder="Juan Doe" required/>
            </div>
            <div className="flex flex-col space-y-2">
                <label htmlFor="phone" className="font-medium text-white">Phone</label>
                <input className="p-2 bg-white rounded-sm" type="tel" name="phone" placeholder="787-555-6789" required/>
            </div>

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

            <div className="flex flex-col space-y-2">
                <label htmlFor="password" className="font-medium text-white">Password</label>
                <input className="p-2 bg-white rounded-sm" type="password" name="password" required/>
            </div>

            {children}

            <div className="w-full">
                <button type="submit" className="w-full mt-4 py-3 bg-lul-blue text-white rounded-sm text-sm">
                    {
                        loading
                            ?
                            <div className="h-full">
                                <Spinner/>
                            </div>
                            : 'Continue'
                    }
                </button>
            </div>


            <p className="text-lul-light-grey text-center">
                Have an account? <a href="/sign-in" className="text-lul-blue font-medium">Sign In</a>
            </p>
        </form>
    )
}


export default function Page() {
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)
        setError(null)

        try {
            await signUpUser(formData) // Call server action explicitly
            setSuccess(true)
        } catch (err: any) {
            setError(err.message || 'Unknown error occurred')
        } finally {
            setLoading(false)
        }
    }

    if (success) return <SignUpSuccess/>

    return (
        <SignUpForm loading={loading}>
            <SignUpError error={error}/>
        </SignUpForm>
    )
}
