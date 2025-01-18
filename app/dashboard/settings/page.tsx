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

export default function SuspensePage() {
    return <Suspense><Page/></Suspense>
}

function Page() {
    const searchParams = useSearchParams()
    const emailChanged = searchParams.get('email_changed')
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
    const [secSectionOpen, setSecSectionOpen] = useState<boolean>(false)
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
            const {error} = await supabase
                .storage
                .from('lul') // Replace with your bucket name
                .upload(fileName, file, {upsert: true})
            if (error) throw error

            // Update the user record with the new image filename
            await updateProfilePic({
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
        <Container className="w-full h-full text-white flex flex-col items-center gap-y-8 py-6 px-4">
            <h1 className="w-full text-2xl font-bold uppercase border-lul-blue border-b">Settings</h1>

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
                    <div className="w-full max-w-md flex justify-center gap-x-4 bg-lul-grey/50 text-lul-red px-6 py-3 text-sm uppercase font-bold rounded-md">
                        <div>⚠️</div>
                        <div>You do not have a player profile linked</div>
                        <div>⚠️</div>
                    </div>
                </div>
            }

            {!Player && unclaimedPlayerExists &&
                <Card title="Claim Your Player Profile" color="green" className="flex flex-col gap-y-2">
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
                </Card>
            }

            {!Player && !unclaimedPlayerExists &&
                <Card title="No Matching Player Profile Found" color="red" className="flex flex-col gap-y-2">
                    <p className="">
                        We couldn't find an unclaimed player record with your phone number.
                        <br/>
                        If you think this is a mistake, please contact the season administrator.
                    </p>
                </Card>
            }

            {/* ============================================== */}
            {/* PLAYER CARD*/}
            {/* ============================================== */}
            {Player &&
                <Card title="Player profile linked" className="flex flex-col gap-y-2" color="green">
                    <div>Your user profile is linked with Player ID <span className="text-lul-green font-bold">{Player.id}</span>.</div>
                    <div>You can view your stats over at your <Link href={`/dashboard/profile`} className="text-lul-blue underline">player profile</Link>.</div>
                </Card>
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

            <Card
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
                        {newEmail && <p className="text-sm text-lul-yellow">You requested an email change; check your inbox</p>}
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
            </Card>

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
        <div className={clsx({
            'lg:w-1/2 w-full': isOpen === null,
            'py-4': isOpen !== null,
            'hidden': isOpen === false,
            'flex': isOpen
        })}>
            {children}
            <Card title={title} fullWidth className="py-3 bg-lul-black/55">
                <div className="w-full flex items-center pt-2">
                    <input
                        type={type}
                        value={value}
                        required
                        onChange={(e) => {
                            if (setMessage) setMessage('')
                            setValue(e.target.value)
                        }}
                        className="w-2/3 py-1 px-2 rounded-md text-white bg-lul-black/50"
                    />
                    <div className="w-1/3 flex items-center justify-end">
                        <button
                            onClick={handler}
                            className="flex items-center gap-x-2 self-end bg-lul-blue px-4 py-2 rounded font-bold uppercase text-sm text-white">
                            {saving
                                ? (<><Spinner className="w-4"/>
                                    <div className="hidden lg:block">Saving...</div>
                                </>)
                                : 'Save'
                            }
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    )
}

function Card({
                  title,
                  children,
                  fullWidth = false,
                  color = 'blue',
                  className = '',
              }: {
    title: string | ReactNode,
    children
        :
        ReactNode,
    fullWidth?: boolean,
    color?: 'blue' | 'green' | 'red' | 'yellow' | 'orange',
    className?: string,
}) {
    return (
        <div className={clsx(`lg:w-1/2 w-full bg-lul-grey/20 rounded-md p-4 ${className}`, {
            'lg:w-full': fullWidth
        })}>
            <h2 className={clsx('text-white font-bold text-lg mb-2 uppercase border-b', {
                'border-lul-green': color === 'green',
                'border-lul-blue': color === 'blue',
                'border-lul-red': color === 'red',
                'border-lul-yellow': color === 'yellow',
                'border-lul-orange': color === 'orange',
            })}>
                {title}
            </h2>

            {children}
        </div>
    )
}