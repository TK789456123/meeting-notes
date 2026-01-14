'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Moon, Sun, Globe, MessageSquare } from 'lucide-react'
import { useTheme } from 'next-themes'
import { ThemeToggle } from './theme-toggle'
import { deleteAccount } from '@/components/layout/actions'
import styles from './settings-modal.module.css'

interface SettingsModalProps {
    isOpen: boolean
    onClose: () => void
}

// declare global {
//     interface Window {
//         google: any;
//         googleTranslateElementInit: any;
//     }
// }

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const [mounted, setMounted] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const { theme } = useTheme()
    const router = useRouter()

    const handleDeleteAccount = async () => {
        setIsDeleting(true)
        try {
            const result = await deleteAccount()
            if (result.success) {
                router.push('/goodbye') // Or login
            } else {
                alert(result.message || 'Chyba při mazání účtu')
                setIsDeleting(false)
            }
        } catch (error) {
            console.error(error)
            alert('Chyba při mazání účtu')
            setIsDeleting(false)
        }
    }

    useEffect(() => {
        setMounted(true)

        if (isOpen) {
            console.log("Settings modal open")
            // Google Translate disabled for stability
        }
    }, [isOpen])

    if (!mounted || !isOpen) return null

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Nastavení</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <X size={24} />
                    </button>
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
                    <h3 className={styles.sectionTitle}>O aplikaci</h3>
                    <div className={styles.row}>
                        <div className={styles.label}>
                            <MessageSquare size={20} />
                            Verze
                        </div>
                        <span style={{ fontWeight: 600 }}>1.2.0</span>
                    </div>
                </div>

                <div className={styles.section}>
                    <h3 className={styles.sectionTitle} style={{ color: '#e53e3e' }}>Nebezpečná zóna</h3>
                    <div className={styles.dangerZone}>
                        <p className={styles.dangerText}>
                            Smazání účtu je nevratné. Přijdete o všechna data.
                        </p>
                        {!showDeleteConfirm ? (
                            <button
                                className={styles.deleteButton}
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                Smazat účet
                            </button>
                        ) : (
                            <div className={styles.confirmRow}>
                                <button
                                    className={styles.cancelDeleteButton}
                                    onClick={() => setShowDeleteConfirm(false)}
                                >
                                    Zrušit
                                </button>
                                <button
                                    className={styles.confirmDeleteButton}
                                    onClick={handleDeleteAccount}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? 'Mažu...' : 'Opravdu smazat'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
