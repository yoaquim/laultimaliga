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
    const [userId, setUserId] = useState<string | null>(null)

    useEffect(() => {
        async function fetchUser() {
            const {data: {user}} = await supabase.auth.getUser()
            if (user) setUserId(user.id)
        }

        fetchUser()
    }, [])

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
        {name: 'Profile', href: `/dashboard/players/${userId}`, icon: RiIdCardFill},
        {name: 'Settings', href: `/dashboard/settings`, icon: GiSettingsKnobs},
        {name: 'Admin', href: '/dashboard/admin', icon: MdAdminPanelSettings, adminOnly: true},
    ]

    return (
        <nav
            className={clsx(
                'fixed bottom-0 w-full flex border-t border-white py-3 px-6 bg-lul-black/95',
                'lg:relative lg:w-fit lg:flex-col lg:h-screen lg:px-3 lg:py-8 lg:border-r lg:border-t-0',
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
                        let isActive
                        if (link.name === 'Players') {
                            isActive = pathname.startsWith(link.href) && pathname !== `${link.href}/${userId}`
                        } else isActive = pathname.startsWith(link.href)

                        return (
                            <Link
                                key={i}
                                href={link.href}
                                className={clsx(
                                    'flex flex-col items-center gap-y-1 text-lul-blue antialiased',
                                    {
                                        'bg-lul-blue text-white p-2 rounded-md': isActive
                                    }
                                )}
                            >
                                <link.icon className="text-2xl"/>
                                <span className="text-xs text-white">{link.name}</span>

                            </Link>
                        )
                    })}

                <div className="lg:hidden flex flex-col items-center gap-y-1 text-lul-blue antialiased" onClick={handleSignOut}>
                    <VscSignOut className="text-2xl"/>
                    <span className="text-xs text-white">Signout</span>
                </div>
            </div>

            <div className="flex flex-col items-center gap-y-1 text-lul-blue antialiased" onClick={handleSignOut}>
                <VscSignOut className="text-2xl"/>
                <span className="text-xs text-white">Signout</span>
            </div>
        </nav>
    )
}
