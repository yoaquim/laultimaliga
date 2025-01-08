import { ReactNode } from 'react'

function AuthHeader() {
    return (
        <div className="lg:w-1/3 lg:flex-row lg:items-center lg:relative lg:space-y-0 w-full flex flex-col items-center space-y-4">
            <img src="/alt-logo-lul.svg" alt="La Ultima Liga" className="lg:absolute lg:float-left w-16"/>
            <h1 className="w-full text-4xl font-bold text-center text-white">La Ultima Liga</h1>
        </div>

    )
}

export default function AuthLayout({children}: { children: ReactNode }) {
    return (
        <div className="lg:pt-24 h-screen w-screen pt-10 flex flex-col items-center bg-gradient-to-br from-lul-black to-lul-grey">
            <AuthHeader/>

            <div className="lg:mt-16 lg:w-1/3 w-full mt-10 px-8 flex flex-col items-center">
                <div className="w-full flex flex-col">
                    {children}
                </div>

                <div className="w-full mt-6 flex justify-between text-lul-light-grey text-sm">
                    <span>© La Ultima Liga, LLC</span>
                    <span>Privacy Policy</span>
                    <span>Terms of Service</span>
                </div>
            </div>
        </div>
    )
}