'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import SettingsModal from '@/components/ui/SettingsModal'
import styles from './Navbar.module.css'

export default function NavbarSettings() {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    return (
        <>
            <button
                className={styles.iconButton}
                aria-label="Nastavení"
                onClick={() => setIsSettingsOpen(true)}
                style={{ marginRight: '1rem' }}
            >
                <Settings size={20} />
            </button>

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </>
    )
}
