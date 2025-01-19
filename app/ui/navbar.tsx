'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'
import { getIsAdmin } from '@/dashboard/actions'
import { IoBasketballSharp } from 'react-icons/io5'
import { MdAdminPanelSettings } from 'react-icons/md'
import { VscSignOut } from 'react-icons/vsc'
import { RiTeamFill, RiShieldUserFill, RiIdCardFill } from 'react-icons/ri'
import { GiSettingsKnobs } from 'react-icons/gi'
import { useState, useEffect } from 'react'

export default function Navbar({className}: { className?: string }) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const [userIsAdmin, setUserIsAdmin] = useState<boolean | null>(null)

    useEffect(() => {
        async function fetchAdminStatus() {
            try {
                const isAdmin = await getIsAdmin()
                setUserIsAdmin(isAdmin)
            } catch (error) {
                console.error('Error fetching admin status:', error)
            }
        }

        fetchAdminStatus()
    }, [])

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
        {name: 'Profile', href: `/dashboard/profile`, icon: RiIdCardFill},
        {name: 'Settings', href: `/dashboard/settings`, icon: GiSettingsKnobs},
        {name: 'Admin', href: '/dashboard/admin', icon: MdAdminPanelSettings, adminOnly: true},
    ]

    return (
        <nav
            className={clsx(
                'fixed bottom-0 w-full flex border-t border-white py-2 px-6 bg-lul-black z-50 uppercase',
                'lg:relative lg:w-auto lg:flex-col lg:h-screen lg:px-3 lg:py-8 lg:border-r lg:border-t-0',
                className
            )}>
            <img src="/alt-logo-lul.svg" alt="Logo" className="h-16 lg:flex hidden"/>

            {/* Links */}
            <div
                className={clsx(
                    'w-full flex flex-row flex-1 justify-around items-center gap-x-10 overflow-x-scroll',
                    'lg:flex-col lg:justify-start lg:gap-y-10 lg:py-8 lg:overflow-x-auto'
                )}>
                {links
                    .filter((link) => !link.adminOnly || userIsAdmin)
                    .map((link, i) => {
                        return (
                            <Link
                                key={i}
                                href={link.href}
                                className={clsx(
                                    'flex flex-col justify-center items-center px-2 lg:px-0 text-lul-blue min-h-16 min-w-16 ',
                                    {
                                        'bg-lul-blue text-white rounded-md': pathname.startsWith(link.href),
                                    }
                                )}
                            >
                                <div className="flex flex-col items-center justify-center w-full h-full gap-y-2">
                                    <link.icon className="text-xl lg:text-2xl"/>
                                    <span className="text-xs font-semibold text-white">{link.name}</span>
                                </div>
                            </Link>)
                    })}

                <div className="lg:hidden flex flex-col items-center gap-y-1 text-lul-blue antialiased cursor-pointer" onClick={handleSignOut}>
                    <VscSignOut className="text-2xl"/>
                    <span className="text-xs font-semibold text-white">Signout</span>
                </div>
            </div>

            <div className="hidden lg:flex flex-col items-center gap-y-1 text-lul-blue antialiased cursor-pointer" onClick={handleSignOut}>
                <VscSignOut className="text-2xl"/>
                <span className="text-xs font-semibold text-white">Signout</span>
            </div>
        </nav>
    )
}
