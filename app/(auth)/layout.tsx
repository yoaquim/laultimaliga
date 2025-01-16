import { ReactNode } from 'react'

function AuthHeader() {
    return (
        <div className="lg:w-1/3 lg:items-center lg:relative lg:space-y-0 w-full px-8 flex justify-between items-center space-y-4">
            <img src="/alt-logo-lul.svg" alt="La Ultima Liga" className="w-14"/>
            <h1 className="w-full text-2xl font-bold text-center text-white uppercase">La Ultima Liga</h1>
            <img src="/alt-logo-lul.svg" alt="La Ultima Liga" className="w-14"/>
        </div>

    )
}

export default function AuthLayout({children}: { children: ReactNode }) {
    return (
        <div className="h-screen w-screen flex flex-col justify-center items-center bg-gradient-to-br from-lul-black to-lul-black/95">
            <div className="-mt-40 flex flex-col items-center w-full">
                <AuthHeader/>

                <div className="lg:w-1/3 w-full mt-10 px-8 flex flex-col items-center">
                    <div className="w-full flex flex-col">
                        {children}
                    </div>

                    <div className="w-full mt-6 flex justify-between text-lul-light-grey text-sm normal-case">
                        <span>© La Ultima Liga, LLC</span>
                        <span>Privacy Policy</span>
                        <span>Terms of Service</span>
                    </div>
                </div>
            </div>
        </div>
    )
}