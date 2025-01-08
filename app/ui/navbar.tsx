'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import clsx from 'clsx'
import { IoBasketballSharp, IoSettingsSharp } from 'react-icons/io5'
import { RiTeamFill, RiShieldUserFill, RiIdCardFill } from 'react-icons/ri'
import { createClient } from '@/lib/supabase/client'

export default function Navbar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut()
            router.push('/sign-in') // Redirect to the sign-in page after signing out
        } catch (error) {
            console.error('Error signing out:', error)
        }
    }

    const links = [
        {name: 'Matches', href: '/dashboard/matches', icon: IoBasketballSharp},
        {name: 'Teams', href: '/dashboard/teams', icon: RiTeamFill},
        {name: 'Players', href: '/dashboard/players', icon: RiShieldUserFill},
        {name: 'Profile', href: '/dashboard/profile', icon: RiIdCardFill},
        {name: 'Settings', href: '/dashboard/settings', icon: IoSettingsSharp},
    ]

    return (
        <nav className="lg:flex lg:flex-col lg:items-center lg:h-screen lg:w-fit lg:px-4 lg:py-8 lg:border-r lg:border-t-0 lg:left-0 lg:absolute bg-lul-black fixed bottom-0 w-full px-4 border-t border-white z-10">
            <img src="/alt-logo-lul.svg" alt="Logo" className="h-16 lg:flex hidden"/>

            <div className="lg:flex lg:flex-col lg:justify-normal lg:h-full lg:mt-10 lg:py-2 lg:space-y-10 lg:overflow-y-scroll flex justify-between h-fit w-full py-4 gap-x-10 overflow-x-scroll scroll-m-6 scroll-smooth">
                {links.map((link, i) => (
                    <Link
                        key={i}
                        href={link.href}
                        className={clsx(
                            'flex flex-col justify-center items-center gap-y-2 min-w-[64px] text-lul-blue',
                            {
                                'bg-lul-blue p-2 rounded text-white': pathname.startsWith(link.href),
                            }
                        )}
                    >
                        <div className="text-3xl">
                            <link.icon className="antialiased"/>
                        </div>
                        <p className="text-white text-xs antialiased">{link.name}</p>
                    </Link>
                ))}
            </div>

            <button
                onClick={handleSignOut}
                className="mt-10 text-lul-blue text-sm self-end align-bottom antialiased lg:block hidden"
            >
                Sign Out
            </button>
        </nav>
    )
}
