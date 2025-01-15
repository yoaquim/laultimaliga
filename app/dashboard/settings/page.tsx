'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Loader from '@/ui/loader'
import Empty from '@/ui/empty'
import { DOMAIN, BUCKET_ENDPOINT } from '@/lib/utils'
import { fetchUserProfile, updateUserAction } from './actions'
import { createClient } from '@/lib/supabase/client'
import { Container } from '@/ui/container'

export default function SettingsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<any>(null)

    // For updating user fields
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState<string | null>(null)

    // For uploading a new profile pic
    const [uploadingPic, setUploadingPic] = useState(false)
    const [newPicFile, setNewPicFile] = useState<File | null>(null)

    useEffect(() => {
        async function loadProfile() {
            setLoading(true)
            const data = await fetchUserProfile()
            setProfile(data)
            setLoading(false)
            if (data?.sessionUser) {
                setName(data.sessionUser.name || '')
                setPhone(data.sessionUser.phone || '')
                setEmail(data.sessionUser.email || null)
            }
        }

        loadProfile()
    }, [])

    if (loading) return <Loader/>

    const {sessionUser, unclaimedPlayer} = profile
    const {Player} = sessionUser

    // Update user fields form submission handler
    async function handleUpdateProfile(e: FormEvent) {
        e.preventDefault()
        try {
            toast.loading('Updating profile...', {id: 'update-profile'})
            await updateUserAction({
                userId: sessionUser.id,
                name,
                phone,
                email,
            })
            toast.success('Profile updated!', {id: 'update-profile'})
            router.refresh()
        } catch (error) {
            console.error('Error updating user:', error)
            toast.error('Failed to update profile', {id: 'update-profile'})
        }
    }

    // Handle file selection for new profile pic
    async function handlePicChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        setNewPicFile(file)
    }

    // Handle profile picture upload
    async function handleUploadPic() {
        if (!newPicFile) {
            toast.error('No file selected')
            return
        }
        try {
            setUploadingPic(true)
            // Determine file extension and build filename
            const fileExt = newPicFile.name.split('.').pop()
            const fileName = `profile-pics/${sessionUser.id}.${fileExt}`

            const supabase = createClient()
            const {data, error} = await supabase
                .storage
                .from('lul') // Replace with your bucket name
                .upload(fileName, newPicFile, {upsert: true})
            if (error) throw error

            // Update the User record with the new image filename
            await updateUserAction({
                userId: sessionUser.id,
                image: fileName,
            })

            toast.success('Profile picture uploaded!')
            router.refresh()
        } catch (err) {
            console.error('Error uploading file:', err)
            toast.error('Failed to upload picture')
        } finally {
            setUploadingPic(false)
        }
    }

    return (
        <Container className="text-white gap-y-8 py-6 px-4">

            {/* HEADER: BASIC USER INFO */}
            <div className="flex flex-col gap-y-2">
                <h1 className="text-3xl font-bold">Settings</h1>

                {/* Profile Picture */}
                <div className="mt-2 flex flex-col items-center gap-y-2">
                    {sessionUser.image ? (
                        <img
                            src={`${BUCKET_ENDPOINT}/${sessionUser.image}`}
                            alt="profile-pic"
                            className="h-52 w-52 rounded-full object-cover"
                        />
                    ) : (
                        <div className="h-52 w-52 rounded-full bg-lul-grey/20 flex items-center justify-center text-lul-light-grey">
                            No Pic
                        </div>
                    )}
                    <div className="flex gap-x-2 items-center">
                        <input type="file" accept="image/*" onChange={handlePicChange} className="text-sm"/>
                        <button
                            onClick={handleUploadPic}
                            disabled={!newPicFile || uploadingPic}
                            className="px-3 py-1 bg-lul-green text-black rounded-md disabled:opacity-50"
                        >
                            {uploadingPic ? 'Uploading...' : 'Upload'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Form to update basic user info */}
            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-y-4 w-full max-w-md mx-auto">
                <div className="flex flex-col gap-y-2">
                    <label className="text-sm text-lul-light-grey">Name</label>
                    <input
                        type="text"
                        className="px-3 py-2 rounded-md bg-lul-black/20"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
                <div className="flex flex-col gap-y-2">
                    <label className="text-sm text-lul-light-grey">Phone</label>
                    <input
                        type="text"
                        className="px-3 py-2 rounded-md bg-lul-black/20"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                </div>
                <div className="flex flex-col gap-y-2">
                    <label className="text-sm text-lul-light-grey">Email</label>
                    <input
                        type="email"
                        className="px-3 py-2 rounded-md bg-lul-black/20"
                        value={email || ''}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <button
                    type="submit"
                    className="px-4 py-2 bg-lul-blue text-white font-semibold rounded-md hover:bg-lul-blue/70"
                >
                    Update Profile
                </button>
            </form>

            {/* Show claim UI if user is not linked to a Player */}
            {!Player ? (
                <div className="flex flex-col gap-y-4 items-center mt-4">
                    <p className="text-sm text-lul-red">
                        You do not currently have a player profile linked.
                    </p>
                    {unclaimedPlayer ? (
                        <div className="bg-lul-grey/20 rounded-md p-4 text-center w-full max-w-md">
                            <h2 className="text-lul-yellow font-bold text-xl mb-2">Claim Your Player Profile!</h2>
                            <p className="text-sm text-lul-light-grey mb-4">
                                We found a matching unclaimed player record with the same phone number.
                                You can claim it and start tracking your stats.
                            </p>
                            <button
                                onClick={async (e) => {
                                    e.preventDefault()
                                    try {
                                        toast.loading('Claiming player profile...', {id: 'claim'})
                                        const res = await fetch(`${DOMAIN}/api/players/claim`, {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                            },
                                            body: JSON.stringify({playerId: unclaimedPlayer.id}),
                                        })
                                        if (!res.ok) {
                                            toast.dismiss('claim')
                                            const errorData = await res.json()
                                            const errorMessage = errorData?.error || 'An unknown error occurred.'
                                            toast.error(errorMessage)
                                        } else {
                                            toast.dismiss('claim')
                                            toast.success('Player Profile Claimed Successfully')
                                            router.refresh()
                                        }
                                    } catch (error) {
                                        console.error(error)
                                        toast.dismiss('claim')
                                        toast.error('Failed to claim player profile')
                                    }
                                }}
                                className="px-4 py-2 bg-lul-green rounded-md text-white font-semibold hover:bg-lul-dark-grey transition-colors"
                            >
                                Claim Player Profile
                            </button>
                        </div>
                    ) : (
                        <p className="text-xs text-lul-light-grey mt-2">
                            No matching unclaimed players found by your phone number.
                        </p>
                    )}
                </div>
            ) : (
                // Optionally, if the user is a player, you can show extra info (stats, upcoming matches, etc.)
                <div className="flex flex-col gap-y-6">
                    {/* Additional player info could go here */}
                </div>
            )}
        </Container>
    )
}
