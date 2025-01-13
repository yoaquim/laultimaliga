'use client'

import { Toaster, ToastPosition } from 'react-hot-toast'
import { useEffect, useState } from 'react'

export default function AppToaster() {
    const [position, setPosition] = useState<ToastPosition>('bottom-right')

    useEffect(() => {
        // Check if the user is on a mobile device based on viewport width
        const isMobile = window.innerWidth <= 768
        setPosition(isMobile ? 'bottom-center' : 'bottom-right')

        // Add a resize listener to dynamically adjust position
        const handleResize = () => {
            const isMobile = window.innerWidth <= 768
            setPosition(isMobile ? 'bottom-center' : 'bottom-right')
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return <Toaster position={position}/>
}
