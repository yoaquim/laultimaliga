import Link from 'next/link'

export default function Page() {
    return (
        <main className="flex flex-col h-screen w-screen items-center justify-center bg-lul-black font-roboto font-extralight">

            <header className="flex flex-col items-center gap-9">
                <h1 className="leading text-4xl text-white">
                    La Ultima Liga
                </h1>
                <div className="w-64">
                    <img src="/alt-logo-lul.svg" alt="Remix" className="w-full"/>
                </div>
            </header>

            <div className="mt-10 flex space-x-4">
                <Link href="/sign-up" className="py-3 px-8 bg-lul-blue text-white rounded-sm">Sign Up</Link>
                <Link href="/sign-in" className="py-3 px-8 text-white border border-white rounded-sm">Log In</Link>
            </div>
        </main>
    )
}
