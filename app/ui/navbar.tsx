'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import clsx from 'clsx'
import { IoBasketballSharp, IoSettingsSharp } from 'react-icons/io5'
import { RiTeamFill, RiShieldUserFill, RiIdCardFill } from 'react-icons/ri'
import { createClient } from '@/lib/supabase/client'

export default function Navbar({className}: { className?: string }) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut()
            router.push('/sign-in')
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
        <nav
            className={clsx(
                'w-full flex border-t border-white py-3 px-6',
                'lg:w-fit lg:flex-col lg:h-screen lg:px-4 lg:py-8 lg:border-r lg:border-t-0',
                className
            )}
        >
            <img src="/alt-logo-lul.svg" alt="Logo" className="h-16 lg:flex hidden"/>


            {/* Links */}
            <div className={clsx(
                'w-full flex flex-row flex-1 justify-around items-center gap-x-10 overflow-x-scroll',
                'lg:flex-col lg:justify-start lg:gap-y-10 lg:py-8 lg:overflow-x-auto'
            )}>
                {/*<div className="">*/}
                {links.map((link, i) => (
                    <Link
                        key={i}
                        href={link.href}
                        className={clsx(
                            'flex flex-col items-center gap-y-1 text-lul-blue',
                            {
                                'bg-lul-blue text-white p-2 rounded-md': pathname.startsWith(link.href),
                            }
                        )}
                    >
                        <link.icon className="text-2xl"/>
                        <span className="text-xs text-white">{link.name}</span>
                    </Link>
                ))}
            </div>

            {/* Sign Out */}
            <button
                onClick={handleSignOut}
                className="hidden lg:block text-lul-blue text-sm mt-auto lg:pt-4"
            >
                Sign Out
            </button>
        </nav>
    )
}
