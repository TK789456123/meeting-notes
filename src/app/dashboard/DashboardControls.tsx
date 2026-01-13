'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Settings } from 'lucide-react'
import styles from './dashboard.module.css'
import SettingsModal from '@/components/ui/SettingsModal'
import OnboardingTutorial from '@/components/ui/OnboardingTutorial'

interface DashboardControlsProps {
    userId?: string
}

export default function DashboardControls({ userId }: DashboardControlsProps) {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    return (
        <div className={styles.headerButtons}>
            {userId && <OnboardingTutorial userId={userId} />}

            <button
                className={styles.iconButton}
                aria-label="Nastavení"
                onClick={() => setIsSettingsOpen(true)}
            >
                <Settings size={20} />
            </button>

            <Link href="/import" className={styles.secondaryButton}>
                Importovat (TXT)
            </Link>

            <Link href="/meetings/new" className={styles.addButton}>
                <Plus size={20} />
                Nová schůzka
            </Link>

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </div>
    )
}
