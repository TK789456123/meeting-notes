'use client'

import { useState } from 'react'
import styles from './Navbar.module.css'
import AvatarUploadModal from './AvatarUploadModal'

interface UserAvatarProps {
    email: string
    avatarUrl?: string | null
}

export default function UserAvatar({ email, avatarUrl }: UserAvatarProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Determine initials logic
    const getInitials = (email: string) => {
        return email.slice(0, 2).toUpperCase()
    }

    return (
        <>
            <div
                className={styles.avatarContainer}
                onClick={() => setIsModalOpen(true)}
                title="Kliknutím změníte profilový obrázek"
            >
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt="User Avatar"
                        className={styles.avatarImage}
                    />
                ) : (
                    <div className={styles.avatarPlaceholder}>
                        {getInitials(email)}
                    </div>
                )}
            </div>

            <AvatarUploadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                currentAvatarUrl={avatarUrl}
                email={email}
            />
        </>
    )
}
