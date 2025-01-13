'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'
import { getIsAdmin } from '@/dashboard/actions'
import { IoBasketballSharp } from 'react-icons/io5'
import { MdAdminPanelSettings } from 'react-icons/md'
import { RiTeamFill, RiShieldUserFill, RiIdCardFill } from 'react-icons/ri'
import { useState, useEffect } from 'react'

export default function Navbar({className}: { className?: string }) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const [userIsAdmin, setUserIsAdmin] = useState(false)

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
        {name: 'Profile', href: '/dashboard/profile', icon: RiIdCardFill},
        {name: 'Admin', href: '/dashboard/admin', icon: MdAdminPanelSettings, adminOnly: true},
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
            <div
                className={clsx(
                    'w-full flex flex-row flex-1 justify-around items-center gap-x-10 overflow-x-scroll',
                    'lg:flex-col lg:justify-start lg:gap-y-10 lg:py-8 lg:overflow-x-auto'
                )}
            >
                {links
                    .filter((link) => !link.adminOnly || userIsAdmin)
                    .map((link, i) => (
                        <Link
                            key={i}
                            href={link.href}
                            className={clsx(
                                'flex flex-col items-center gap-y-1 text-lul-blue antialiased',
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
