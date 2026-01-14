'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import styles from './dashboard.module.css'
import OnboardingTutorial from '@/components/ui/OnboardingTutorial'

interface DashboardControlsProps {
    userId?: string
}

export default function DashboardControls({ userId }: DashboardControlsProps) {
    return (
        <div className={styles.headerButtons}>
            {/* {userId && <OnboardingTutorial userId={userId} />} */}

            <Link href="/import" className={styles.secondaryButton}>
                Importovat (TXT)
            </Link>

            <Link href="/meetings/new" className={styles.addButton}>
                <Plus size={20} />
                Nová schůzka
            </Link>
        </div>
    )
}
