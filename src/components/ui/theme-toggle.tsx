
'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import styles from './theme-toggle.module.css'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
    const { setTheme, theme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <button
            className={styles.toggle}
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            title="Přepnout režim"
        >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
    )
}
