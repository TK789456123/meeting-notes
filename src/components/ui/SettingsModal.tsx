'use client'

import { useEffect, useState } from 'react'
import { X, Moon, Sun, Globe, MessageSquare } from 'lucide-react'
import { useTheme } from 'next-themes'
import { ThemeToggle } from './theme-toggle'
import styles from './settings-modal.module.css'

interface SettingsModalProps {
    isOpen: boolean
    onClose: () => void
}

declare global {
    interface Window {
        google: any;
        googleTranslateElementInit: any;
    }
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const [mounted, setMounted] = useState(false)
    const { theme } = useTheme()

    useEffect(() => {
        setMounted(true)

        if (isOpen) {
            const initGoogleTranslate = () => {
                const element = document.getElementById('google_translate_element')
                if (element && !element.children.length && window.google?.translate?.TranslateElement) {
                    new window.google.translate.TranslateElement(
                        {
                            pageLanguage: 'cs',
                            autoDisplay: false
                        },
                        'google_translate_element'
                    )
                }
            }

            window.googleTranslateElementInit = initGoogleTranslate

            const scriptId = 'google-translate-script'
            if (!document.getElementById(scriptId)) {
                const script = document.createElement('script')
                script.id = scriptId
                script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
                script.async = true
                document.body.appendChild(script)
            }

            // Aggressive polling to ensure initialization happens
            // This is necessary because the script connection can be flaky in SPAs
            const intervalId = setInterval(initGoogleTranslate, 500)

            // Allow up to 5 seconds for the widget to load
            const timeoutId = setTimeout(() => clearInterval(intervalId), 5000)

            return () => {
                clearInterval(intervalId)
                clearTimeout(timeoutId)
                // We don't remove the script to avoid reloading it unnecessarily
            }
        }
    }, [isOpen])

    if (!mounted || !isOpen) return null

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Nastavení</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Vzhled</h3>
                    <div className={styles.row}>
                        <div className={styles.label}>
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            {theme === 'dark' ? 'Světlý režim' : 'Tmavý režim'}
                        </div>
                        <ThemeToggle />
                    </div>
                </div>

                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Jazyk</h3>
                    <div className={[styles.row, styles.translateContainer].join(' ')}>
                        <div className={styles.label}>
                            <Globe size={20} />
                            Jazyk
                        </div>
                        <div id="google_translate_element"></div>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#718096', marginTop: '0.5rem' }}>
                        * Překlad zajišťuje Google Translate
                    </p>
                </div>

                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>O aplikaci</h3>
                    <div className={styles.row}>
                        <div className={styles.label}>
                            <MessageSquare size={20} />
                            Verze
                        </div>
                        <span style={{ fontWeight: 600 }}>1.2.0</span>
                    </div>
                </div>

            </div>
        </div>
    )
}
