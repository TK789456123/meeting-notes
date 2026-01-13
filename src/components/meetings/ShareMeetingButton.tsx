'use client'

import { useState } from 'react'
import { Share2, Copy, Check, X } from 'lucide-react'
import { generateShareToken } from '@/app/meetings/[id]/actions'
import styles from './share-button.module.css'

export default function ShareMeetingButton({ meetingId }: { meetingId: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [shareUrl, setShareUrl] = useState('')
    const [copied, setCopied] = useState(false)
    const [error, setError] = useState('')

    const handleShare = async () => {
        setIsOpen(true)
        if (shareUrl) return // Already generated

        setIsLoading(true)
        setError('')
        try {
            const token = await generateShareToken(meetingId)
            const url = `${window.location.origin}/share/${token}`
            setShareUrl(url)
        } catch (e) {
            setError('Nepodařilo se vygenerovat odkaz.')
            console.error(e)
        } finally {
            setIsLoading(false)
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <>
            <button
                onClick={handleShare}
                className={styles.shareButton}
                title="Sdílet schůzku"
            >
                <Share2 size={18} />
                Sdílet
            </button>

            {isOpen && (
                <div className={styles.overlay} onClick={() => setIsOpen(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.header}>
                            <h3>Sdílet schůzku</h3>
                            <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className={styles.content}>
                            <p className={styles.description}>
                                Tento odkaz umožní komukoliv zobrazit tuto schůzku (jen pro čtení).
                            </p>

                            {isLoading ? (
                                <div className={styles.loading}>Generuji odkaz...</div>
                            ) : error ? (
                                <div className={styles.error}>{error}</div>
                            ) : (
                                <div className={styles.urlBox}>
                                    <input
                                        type="text"
                                        value={shareUrl}
                                        readOnly
                                        className={styles.urlInput}
                                    />
                                    <button
                                        onClick={copyToClipboard}
                                        className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
                                    >
                                        {copied ? <Check size={18} /> : <Copy size={18} />}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
