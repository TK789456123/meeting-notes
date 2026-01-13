
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import styles from './welcome.module.css'

export default function WelcomePage() {
    const router = useRouter()
    const [userName, setUserName] = useState<string>('')
    const [hidden, setHidden] = useState(false)

    useEffect(() => {
        const getUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.user_metadata?.full_name) {
                setUserName(user.user_metadata.full_name)
            } else if (user?.email) {
                setUserName(user.email.split('@')[0])
            }
        }
        getUser()

        // Hide after 2.5s (triggers fade out)
        const fadeTimer = setTimeout(() => {
            setHidden(true)
        }, 2500)

        // Redirect after 3s
        const redirectTimer = setTimeout(() => {
            router.push('/dashboard')
        }, 3000)

        return () => {
            clearTimeout(fadeTimer)
            clearTimeout(redirectTimer)
        }
    }, [router])

    return (
        <div className={`${styles.container} ${hidden ? styles.hidden : ''}`}>
            <div className={styles.content}>
                <h1 className={styles.title}>
                    Vítej zpět, <br />
                    <span className={styles.name}>{userName}</span>
                </h1>
                <div className={styles.loader}></div>
            </div>
        </div>
    )
}
