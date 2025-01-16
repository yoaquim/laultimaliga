'use client'

import { useState, useEffect, FormEvent, useRef, ChangeEvent } from 'react'
import toast from 'react-hot-toast'
import Loader from '@/ui/loader'
import { DOMAIN, ERRORS, PROFILE_PIC_BUILDER } from '@/lib/utils'
import { fetchUserProfile, updateUserAction } from './actions'
import { createClient } from '@/lib/supabase/client'
import { Container } from '@/ui/container'
import Spinner from '@/ui/spinner'
import clsx from 'clsx'
import Link from 'next/link'

export default function SettingsPage() {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<any>(null)

    // For updating user fields
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState<string | null>(null)

    // For uploading a new profile pic
    const [uploadingPic, setUploadingPic] = useState(false)

    useEffect(() => {
        async function loadProfile() {
            setLoading(true)
            try {
                const data = await fetchUserProfile()
                setProfile(data)
                if (data?.sessionUser) {
                    setName(data.sessionUser.name || '')
                    setPhone(data.sessionUser.phone || '')
                    setEmail(data.sessionUser.email || null)
                }
            } catch (error) {
                console.error(ERRORS.SETTINGS.ERROR_LOADING_PROFILE, error)
                toast.error(ERRORS.SETTINGS.FAILED_TO_LOAD_PROFILE,)
            } finally {
                setLoading(false)
            }
        }

        loadProfile()
    }, [])

    // Derive sessionUser from profile
    const sessionUser = profile?.sessionUser

    // Handle profile picture upload
    async function uploadPic(file: File) {
        if (!file) {
            toast.error(ERRORS.SETTINGS.NO_FILE_SELECTED)
            return
        }
        if (!sessionUser) {
            toast.error(ERRORS.SETTINGS.USER_PROFILE_NOT_LOADED)
            return
        }
        try {
            setUploadingPic(true)
            // Determine file extension and build filename using sessionUser.id
            const fileExt = file.name.split('.').pop()
            const fileName = `profile-pics/${sessionUser.id}.${fileExt}`

            const supabase = createClient()
            const {data, error} = await supabase
                .storage
                .from('lul') // Replace with your bucket name
                .upload(fileName, file, {upsert: true})
            if (error) throw error

            // Update the user record with the new image filename
            await updateUserAction({
                userId: sessionUser.id,
                image: fileName,
            })

            toast.success('Profile picture updated')
            // Optionally, update local profile state to reflect the new image.
            setProfile((prev: any) => ({
                ...prev,
                sessionUser: {
                    ...prev.sessionUser,
                    image: fileName,
                },
            }))
        } catch (err: any) {
            console.error('Error uploading file:', err)
            toast.error(err.message || 'Failed to update profile picture')
        } finally {
            setUploadingPic(false)
        }
    }

    // Update user fields form submission handler
    async function handleUpdateProfile(e: FormEvent) {
        e.preventDefault()
        if (!sessionUser) {
            toast.error('User profile not loaded.')
            return
        }
        try {
            toast.loading('Updating profile...', {id: 'update-profile'})
            await updateUserAction({
                userId: sessionUser.id,
                name,
                phone,
                email,
            })
            // Update local profile state so the new values show immediately.
            setProfile((prev: any) => ({
                ...prev,
                sessionUser: {
                    ...prev.sessionUser,
                    name,
                    phone,
                    email,
                },
            }))
            toast.success('Profile updated!', {id: 'update-profile'})
            window.location.reload()
        } catch (error: any) {
            console.error('Error updating user:', error)
            toast.error(error.message || 'Failed to update profile', {id: 'update-profile'})
        }
    }

    // Trigger file input click when image is clicked
    const handleImageClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click()
        }
    }

    // Handle file input change event
    const handlePicChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0]
            await uploadPic(file)
        }
    }

    const handleClaimPlayerProfile = async () => {
        try {
            toast.loading('Claiming player profile...', {id: 'claim'})
            const res = await fetch(`${DOMAIN}/api/players/claim`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({playerId: unclaimedPlayer.id}),
            })
            if (!res.ok) {
                toast.dismiss('claim')
                const errorData = await res.json()
                const errorMessage = errorData?.error || 'An unknown error occurred.'
                toast.error(errorMessage)
            } else {
                toast.dismiss('claim')
                toast.success('Player Profile Claimed')
                window.location.reload()
            }
        } catch (error) {
            console.error(error)
            toast.dismiss('claim')
            toast.error('Failed to claim player profile')
        }
    }

    if (loading) return <Loader/>

    if (!profile || !sessionUser) {
        return (
            <Container className="text-white gap-y-6 py-6 px-4">
                <h1 className="text-2xl font-bold uppercase border-lul-blue border-b">Settings</h1>
                <p className="text-center text-red-500">Failed to load user profile.</p>
            </Container>
        )
    }

    const {unclaimedPlayer} = profile
    const {Player} = sessionUser
    const unclaimedPlayerExists = unclaimedPlayer !== null

    return (
        <Container className="text-white flex flex-col gap-y-8 py-6 px-4">
            <h1 className="text-2xl font-bold uppercase border-lul-blue border-b">Settings</h1>

            {/* ============================================== */}
            {/* PROFILE PICTURE SECTION */}
            {/* ============================================== */}
            <div className="relative mt-2 flex flex-col items-center gap-y-2">
                <div className="relative">
                    <img
                        src={PROFILE_PIC_BUILDER(sessionUser)}
                        alt="profile-pic"
                        className={clsx(
                            'h-52 w-52 rounded-md object-cover cursor-pointer transition-opacity duration-300',
                            {'opacity-50': uploadingPic}
                        )}
                        onClick={handleImageClick}
                    />
                    {uploadingPic && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-full">
                            <Spinner/>
                        </div>
                    )}
                </div>
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handlePicChange}
                    style={{display: 'none'}}
                />
            </div>

            {/* ============================================== */}
            {/* CLAIM UI*/}
            {/* ============================================== */}
            {!Player &&
                <div className="flex flex-col gap-y-4 items-center mt-4">
                    <div className="w-full max-w-md flex justify-center gap-x-4 bg-lul-grey/50 text-lul-red px-6 py-3 text-sm uppercase font-bold rounded-md">
                        <div>⚠️</div>
                        <div>You do not have a player profile linked</div>
                        <div>⚠️</div>
                    </div>

                    <div className="bg-lul-grey/20 flex flex-col gap-y-4 rounded-md p-6 pt-4 w-full max-w-md">
                        <h2 className={clsx('text-lul-green font-bold text-base mb-2 uppercase border-b border-lul-blue',
                            {
                                'text-lul-green': unclaimedPlayerExists,
                                'text-lul-yellow': !unclaimedPlayerExists
                            }
                        )}>
                            {unclaimedPlayerExists ? 'Claim Your Player Profile' : 'No Matching Player Profile'}

                        </h2>

                        <p className="text-sm text-white mb-4 normal-case">
                            {unclaimedPlayerExists ?
                                'We found a matching unclaimed player record with the same phone number.\n' +
                                'You can claim it and start tracking your stats.\n'
                                :
                                'We couldn\'t find an unclaimed player record with your phone number.\n' +
                                'If you think this is a mistake, please contact the match administrator.'
                            }
                        </p>

                        {unclaimedPlayerExists &&
                            <button
                                onClick={handleClaimPlayerProfile}
                                className="px-4 py-2 bg-lul-green/90 rounded-md text-white font-semibold hover:bg-lul-green/70 transition-colors uppercase"
                            >
                                Claim Player Profile
                            </button>
                        }
                    </div>
                </div>
            }

            {/* ============================================== */}
            {/* PLAYER CARD*/}
            {/* ============================================== */}
            {Player &&
                <div className="mx-auto bg-lul-grey/20  flex flex-col gap-y-4 rounded-md px-6 py-4 w-full max-w-md">
                    <h2 className="text-white font-bold text-base mb-2 uppercase border-b border-lul-green">
                        PLAYER PROFILE LINKED
                    </h2>

                    <p className="text-base text-white mb-4 normal-case">
                        Your user profile is linked with Player ID <span className="text-lul-green font-bold">{Player.id}</span>.
                        <br/>
                        <br/>
                        You can view your stats over at your <Link href={`/dashboard/profile`} className="text-lul-blue">player profile</Link>.
                    </p>
                </div>
            }

            {/* ============================================== */}
            {/* FORM TO UPDATE BASIC USER INFO */}
            {/* ============================================== */}
            <form onSubmit={handleUpdateProfile} className="bg-lul-dark-grey p-6 pt-4 rounded-md flex flex-col gap-y-4 w-full max-w-md mx-auto">
                <h1 className="border-b border-lul-blue uppercase font-bold">UPDATE PROFILE</h1>
                <div className="flex flex-col gap-y-1">
                    <label className="text-xs text-lul-white uppercase font-semibold">Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="py-1 px-2 rounded-md text-white bg-lul-black/50"
                    />
                </div>
                <div className="flex flex-col gap-y-1">
                    <label className="text-xs text-lul-white uppercase font-semibold">Phone</label>
                    <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="py-1 px-2 rounded-md text-white bg-lul-black/50"
                    />
                </div>
                <div className="flex flex-col gap-y-1">
                    <label className="text-xs text-lul-white uppercase font-semibold">Email</label>
                    <input
                        type="email"
                        value={email || ''}
                        onChange={(e) => setEmail(e.target.value)}
                        className="py-1 px-2 rounded-md text-white bg-lul-black/50"
                    />
                </div>
                <button
                    type="submit"
                    className="mt-2 px-4 py-2 bg-lul-blue text-white uppercase font-semibold rounded-md hover:bg-lul-blue/70"
                >
                    SAVE
                </button>
            </form>
        </Container>
    )
}
