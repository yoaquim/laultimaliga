import Link from 'next/link'

export default function Page() {
    return (
        <main className="h-screen w-screen flex flex-col justify-center items-center bg-gradient-to-br from-lul-black to-lul-black/95">
            <header className="flex items-center gap-9">
                <img src="/alt-logo-lul.svg" alt="Remix" className="h-24"/>
                <h1 className="leading text-4xl text-white uppercase font-bold">La Ultima Liga</h1>
                <img src="/alt-logo-lul.svg" alt="Remix" className="h-24"/>
            </header>

            <div className="mt-10 flex space-x-4">
                <Link href="/sign-up" className="py-2 px-8 uppercase font-bold bg-lul-blue text-white rounded-md antialiased">Sign Up</Link>
                <Link href="/sign-in" className="py-2 px-8 uppercase font-bold text-white border border-white rounded-md antialiased">Log In</Link>
            </div>
        </main>
    )
}
