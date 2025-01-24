'use client'

import { useState, useEffect, useRef, ChangeEvent, ReactNode, Suspense } from 'react'
import toast from 'react-hot-toast'
import Loader from '@/ui/loader'
import { DOMAIN, ERRORS, PROFILE_PIC_BUILDER } from '@/lib/utils'
import {
    fetchUserProfile,
    updateEmail,
    updatePhone,
    updateName,
    updatePassword,
    updateProfilePic
} from './actions'
import { createClient } from '@/lib/supabase/client'
import { Container } from '@/ui/container'
import Spinner from '@/ui/spinner'
import { RiArrowDropDownLine, RiArrowDropUpLine } from 'react-icons/ri'
import clsx from 'clsx'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { InfoCard } from '@/ui/info-card'
import imageCompression from 'browser-image-compression'

export default function SuspensePage() {
    return <Suspense><Page/></Suspense>
}

function Page() {
    const searchParams = useSearchParams()
    const emailChanged = searchParams.get('email-changed')
    const resetPassword = searchParams.get('reset-password')
    const defaultSecSectionOpen = emailChanged === 'true' || resetPassword === 'true'
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<any>(null)

    // For updating user fields
    const [name, setName] = useState<string>('')
    const [phone, setPhone] = useState<string>('')
    const [email, setEmail] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [newEmail, setNewEmail] = useState<string | null>(null)
    const [savingName, setSavingName] = useState<boolean>(false)
    const [savingPhone, setSavingPhone] = useState<boolean>(false)
    const [savingEmail, setSavingEmail] = useState<boolean>(false)
    const [savingPassword, setSavingPassword] = useState<boolean>(false)
    const [passwordError, setPasswordError] = useState<string>('')
    const [secSectionOpen, setSecSectionOpen] = useState<boolean>(defaultSecSectionOpen)
    const [uploadingPic, setUploadingPic] = useState(false)

    useEffect(() => {
        if (emailChanged) {
            toast.success('You\'ve updated your email', {duration: 4000})
        }
    }, [emailChanged, newEmail])

    useEffect(() => {
        async function loadProfile() {
            setLoading(true)
            try {
                const data = await fetchUserProfile()
                setProfile(data)
                if (data?.sessionUser) {
                    setName(data.sessionUser.name || '')
                    setPhone(data.sessionUser.phone || '')
                    setEmail(data.sessionUser.email || '')
                    setNewEmail(data.sessionUser.newEmail || '')
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
        if (!file) return
        try {
            setUploadingPic(true)

            // (1) Compress or resize
            // e.g. max width = 800px, quality = 0.7, etc.
            const options = {
                maxWidthOrHeight: 800,
                maxSizeMB: 1,            // compress to ~1MB
                useWebWorker: true
            }
            const compressedFile = await imageCompression(file, options)

            // (2) Upload compressedFile instead of file
            const fileExt = compressedFile.name.split('.').pop()
            const fileName = `profile-pics/${sessionUser.id}.${fileExt}`

            const supabase = createClient()
            const {error} = await supabase
                .storage
                .from('lul')
                .upload(fileName, compressedFile, {upsert: true})

            if (error) toast.error(error.message)

            // (3) DB update
            await updateProfilePic({userId: sessionUser.id, image: fileName})
            toast.success('Profile picture updated')
            // ...
        } finally {
            setUploadingPic(false)
        }
    }

    const handleNameChange = async () => {
        setSavingName(true)
        await updateName({userId: sessionUser.id, name})
        setSavingName(false)
        toast.success('Name updated')
    }

    const handlePhoneChange = async () => {
        setSavingPhone(true)
        await updatePhone({userId: sessionUser.id, phone})
        setSavingPhone(false)
        toast.success('Phone updated')
    }

    const handleEmailChange = async () => {
        setSavingEmail(true)
        try {
            await updateEmail({userId: sessionUser.id, newEmail: email})
            toast.success('We\'ve sent you an email with further instructions', {duration: 4000})
        } catch (err) {
            const error = err as Error
            toast.error(error.message || 'Failed to update email')
        } finally {
            setSavingEmail(false)
        }
    }

    const handlePasswordChange = async () => {
        setSavingPassword(true)
        try {
            await updatePassword({userId: sessionUser.id, newPassword: password})
            toast.success('Password updated')
        } catch (err) {
            const error = err as Error
            setPasswordError(error.message || 'Failed to update password')
        } finally {
            setSavingPassword(false)
        }

    }

    // Trigger file input click when image is clicked
    const handleImageClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click()
        }
    }

    // Handle file input change event
    async function handlePicChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        // If > 5MB, reject
        if (file.size > 18 * 1024 * 1024) {
            toast.error('Image is too large - must be under 18MB')
            return
        }
        // Proceed
        await uploadPic(file)
    }

    const handleClaimPlayerProfile = async () => {
        try {
            toast.loading('Claiming player profile...', {id: 'claim'})
            const res = await fetch(`/api/players/claim`, {
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
            toast.error(ERRORS.SETTINGS.FAILED_TO_CLAIM_PLAYER_PROFILE)
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
        <Container title="Settings" className="w-full h-full text-white">
            <div className="mt-6 flex flex-col items-center gap-y-8 mx-auto">

                {/* ============================================== */}
                {/* PROFILE PICTURE SECTION */}
                {/* ============================================== */}
                <div className="mt-2 flex flex-col items-center gap-y-2">
                    <div className="relative">
                        <img
                            src={PROFILE_PIC_BUILDER(sessionUser)}
                            alt="profile-pic"
                            className={clsx(
                                'h-52 w-52 rounded-full object-cover cursor-pointer transition-opacity duration-300',
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
                        <div className="text-center w-full max-w-md flex justify-center gap-x-4 bg-lul-grey/50 text-lul-red px-6 py-3 text-sm uppercase font-bold rounded-md">
                            <div>⚠️</div>
                            <div>You do not have a player profile linked</div>
                            <div>⚠️</div>
                        </div>
                    </div>
                }

                {!Player && unclaimedPlayerExists &&
                    <InfoCard title="Claim Your Player Profile" color="green" className="flex flex-col gap-y-2">
                        <p className="">
                            We found a matching unclaimed player record with the same phone number.
                            You can claim it and start tracking your stats.
                        </p>

                        <button
                            onClick={handleClaimPlayerProfile}
                            className="mt-4 py-2 bg-lul-green/90 rounded text-white font-semibold hover:bg-lul-green/70 transition-colors uppercase"
                        >
                            Claim Player Profile
                        </button>
                    </InfoCard>
                }

                {!Player && !unclaimedPlayerExists &&
                    <InfoCard title="No Player Profile Found" color="red" className="flex flex-col gap-y-2">
                        <p className="">
                            We couldn't find a matching player record with your phone number.
                            <br/>
                            If you think this is a mistake, please contact the season administrator.
                        </p>
                    </InfoCard>
                }

                {/* ============================================== */}
                {/* PLAYER INFOCARD*/}
                {/* ============================================== */}
                {Player &&
                    <InfoCard title="Player profile linked" className="flex flex-col gap-y-2" color="green">
                        <div>Your user profile is linked with Player ID <span className="text-lul-green font-bold">{Player.id}</span>.</div>
                        <div>You can view your stats over at your <Link href={`/dashboard/profile`} className="text-lul-blue underline">player profile</Link>.</div>
                    </InfoCard>
                }

                {/* ============================================== */}
                {/* NAME FORM*/}
                {/* ============================================== */}
                <InputGroup
                    title="Name"
                    type="text"
                    value={name}
                    setValue={setName}
                    saving={savingName}
                    handler={handleNameChange}/>

                {/* ============================================== */}
                {/* PHONE FORM*/}
                {/* ============================================== */}
                <InputGroup
                    title="Phone"
                    type="tel"
                    value={phone}
                    setValue={setPhone}
                    saving={savingPhone}
                    handler={handlePhoneChange}/>

                <InfoCard
                    className={secSectionOpen ? 'pb-0' : 'pb-6'}
                    color="yellow"
                    title={
                        <button
                            onClick={() => setSecSectionOpen(!secSectionOpen)}
                            className="-mt-1 w-full h-full flex justify-between items-center cursor-pointer uppercase">
                            <div>Security</div>
                            {secSectionOpen
                                ? <RiArrowDropUpLine className="text-lul-yellow text-4xl"/>
                                : <RiArrowDropDownLine className="text-lul-yellow text-4xl"/>
                            }
                        </button>
                    }
                >
                    {/* ============================================== */}
                    {/* EMAIL FORM*/}
                    {/* ============================================== */}
                    <div className={clsx('py-4', {'hidden': !secSectionOpen, 'block': secSectionOpen})}>
                        <InputGroup
                            title="Email"
                            type="text"
                            value={email}
                            setValue={setEmail}
                            isOpen={secSectionOpen}
                            saving={savingEmail}
                            handler={handleEmailChange}>
                            {newEmail && <p className="pl-1 text-sm text-lul-yellow">You requested an email change; check your inbox</p>}
                        </InputGroup>

                        {/* ============================================== */}
                        {/* PASSWORD FORM*/}
                        {/* ============================================== */}
                        <InputGroup
                            title="Password"
                            type="password"
                            value={password}
                            setValue={setPassword}
                            setMessage={setPasswordError}
                            isOpen={secSectionOpen}
                            saving={savingPassword}
                            handler={handlePasswordChange}/>

                        {/* ============================================== */}
                        {/* PASSWORD ERROR */}
                        {/* ============================================== */}
                        <div className="w-full text-center text-lul-red">
                            {passwordError}
                        </div>

                    </div>
                </InfoCard>
            </div>
        </Container>
    )
}

function InputGroup({
                        title,
                        isOpen = null,
                        saving,
                        type,
                        value,
                        setValue,
                        setMessage,
                        handler,
                        children,
                    }: {
    title: string,
    isOpen?: boolean | null,
    saving: boolean,
    type: 'text' | 'password' | 'tel',
    value: string,
    setValue: (value: string) => void
    setMessage?: (value: string) => void
    handler: () => void
    children?: ReactNode
}) {

    return (
        <div className={clsx('flex flex-col', {
            'w-full': isOpen === null,
            'py-4': isOpen !== null,
            'hidden': isOpen === false,
            'flex': isOpen
        })}>
            {children}
            <InfoCard title={title} fullWidth className="py-3 bg-lul-black/55">
                <div className="w-full flex lg:flex-row lg:gap-x-6 flex-col items-center pt-2 gap-y-3">
                    <input
                        type={type}
                        value={value}
                        required
                        onChange={(e) => {
                            if (setMessage) setMessage('')
                            setValue(e.target.value)
                        }}
                        className="lg:w-2/3 w-full py-1 px-2 rounded-md text-white bg-lul-black/50"
                    />
                    <div className="lg:w-1/3 lg:items-center lg:justify-end w-full flex">
                        <button
                            onClick={handler}
                            className="w-full text-center flex justify-center items-center gap-x-2 self-end bg-lul-blue px-4 py-2 rounded font-bold uppercase text-sm text-white">
                            {saving
                                ? (
                                    <div className="w-full flex justify-center gap-x-2">
                                        <Spinner className="w-4"/>
                                        <div>Saving...</div>
                                    </div>
                                )
                                : <div>Save</div>
                            }
                        </button>
                    </div>
                </div>
            </InfoCard>
        </div>
    )
}