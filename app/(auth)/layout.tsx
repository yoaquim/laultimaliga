import { ReactNode } from 'react'

function AuthHeader() {
    return (
        <div className="lg:w-1/3 lg:flex-row lg:items-center lg:relative lg:space-y-0 w-full flex flex-col items-center space-y-4">
            <img src="/alt-logo-lul.svg" alt="La Ultima Liga" className="lg:absolute lg:float-left w-16"/>
            <h1 className="w-full text-4xl font-extralight text-center text-white">La Ultima Liga</h1>
        </div>

    )
}

export default function AuthLayout({children}: { children: ReactNode }) {
    return (
        <div className="flex flex-col h-screen w-screen items-center justify-center bg-lul-black">
            <div className="flex flex-col h-full w-full justify-center items-center space-y-10">
                <AuthHeader/>
                {children}
            </div>
        </div>
    )
}