
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import styles from './Navbar.module.css'
import { ThemeToggle } from '../ui/theme-toggle'

export default async function Navbar() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const signOut = async () => {
        'use server'
        const supabase = await createClient()
        await supabase.auth.signOut()
        redirect(`/goodbye?t=${Date.now()}`)
    }

    return (
        <nav className={styles.navbar}>
            <div className={styles.logo}>
                <Link href="/">MeetingNotes</Link>
            </div>
            <div className={styles.userMenu}>
                {/* ThemeToggle moved to Settings */}
                {user ? (
                    <>
                        <span className={styles.email}>{user.email}</span>
                        <form action={signOut}>
                            <button className={styles.button}>Odhlásit</button>
                        </form>
                    </>
                ) : (
                    <Link href="/login" className={styles.button}>Přihlásit</Link>
                )}
            </div>
        </nav>
    )
}
