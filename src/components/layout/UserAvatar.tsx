'use client'

import { useState, useRef } from 'react'
import { uploadAvatar } from './actions'
import styles from './Navbar.module.css'
import Image from 'next/image'

interface UserAvatarProps {
    email: string
    avatarUrl?: string | null
}

export default function UserAvatar({ email, avatarUrl }: UserAvatarProps) {
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Determine initials logic
    const getInitials = (email: string) => {
        return email.slice(0, 2).toUpperCase()
    }

    const handleClick = () => {
        if (!isUploading) {
            fileInputRef.current?.click()
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        setIsUploading(true)
        const formData = new FormData()
        formData.append('avatar', e.target.files[0])

        try {
            const result = await uploadAvatar(formData)
            if (!result.success) {
                alert(result.message)
            }
            // Revalidation in server action will update the UI
        } catch (err) {
            console.error(err)
            alert('Chyba při nahrávání')
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div
            className={styles.avatarContainer}
            onClick={handleClick}
            title="Kliknutím změníte profilový obrázek"
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept="image/*"
            />

            {avatarUrl ? (
                <img
                    src={avatarUrl}
                    alt="User Avatar"
                    className={styles.avatarImage}
                    style={{ opacity: isUploading ? 0.5 : 1 }}
                />
            ) : (
                <div className={styles.avatarPlaceholder} style={{ opacity: isUploading ? 0.5 : 1 }}>
                    {getInitials(email)}
                </div>
            )}

            {isUploading && <div className={styles.loadingSpinner} />}
        </div>
    )
}
