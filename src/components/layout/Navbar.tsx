
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import styles from './Navbar.module.css'


import NavbarSettings from './NavbarSettings'
import UserAvatar from './UserAvatar'

export default async function Navbar() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    let avatarUrl = null
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single()
        avatarUrl = profile?.avatar_url
    }

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
                <NavbarSettings />
                {user ? (
                    <>
                        <Link href="/actions" style={{ marginRight: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Úkoly</Link>
                        <UserAvatar email={user.email || ''} avatarUrl={avatarUrl} />
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
