'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './goodbye.module.css'

export default function GoodbyePage() {
    const router = useRouter()
    const [hidden, setHidden] = useState(false)

    useEffect(() => {
        // Hide after 2s (triggers fade out)
        const fadeTimer = setTimeout(() => {
            setHidden(true)
        }, 2000)

        // Redirect after 2.5s
        const redirectTimer = setTimeout(() => {
            router.push('/login')
        }, 2500)

        return () => {
            clearTimeout(fadeTimer)
            clearTimeout(redirectTimer)
        }
    }, [router])

    return (
        <div className={`${styles.container} ${hidden ? styles.hidden : ''}`}>
            <div className={styles.content}>
                <h1 className={styles.title}>
                    Nashledanou! 👋
                </h1>
                <p className={styles.text}>Těšíme se na příště.</p>
            </div>
        </div>
    )
}
