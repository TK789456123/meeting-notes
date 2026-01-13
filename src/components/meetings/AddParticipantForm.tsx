'use client'

import { useState, useRef } from 'react'
import { addParticipant } from '@/app/meetings/[id]/actions'
import styles from '@/app/meetings/[id]/meeting.module.css'

export default function AddParticipantForm({ meetingId }: { meetingId: string }) {
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' })
    const formRef = useRef<HTMLFormElement>(null)

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true)
        setStatus({ type: null, message: '' })

        try {
            // The action now returns an object { success: boolean, message: string }
            const result = await addParticipant(meetingId, formData)

            if (result && result.success) {
                setStatus({ type: 'success', message: result.message || 'Přidáno' })
                formRef.current?.reset()
                // Clear success message after 3s
                setTimeout(() => setStatus({ type: null, message: '' }), 3000)
            } else {
                // If success is false, show the error message returned by server
                setStatus({ type: 'error', message: result?.message || 'Chyba při přidávání' })
            }
        } catch (error) {
            console.error("Failed to add participant", error)
            setStatus({ type: 'error', message: 'Neočekávaná chyba aplikace.' })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form
            ref={formRef}
            action={handleSubmit}
            className={styles.addActionForm}
            style={{ marginTop: '1rem' }}
        >
            <label className={styles.labelSmall}>Přidat účastníka (email):</label>
            <input
                type="email"
                name="email"
                placeholder="email@uzivatele.cz"
                required
                disabled={isLoading}
            />

            {status.message && (
                <div style={{
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '0.9em',
                    marginTop: '4px',
                    background: status.type === 'error' ? '#fee2e2' : '#dcfce7',
                    color: status.type === 'error' ? '#ef4444' : '#166534',
                    border: `1px solid ${status.type === 'error' ? '#fca5a5' : '#86efac'}`
                }}>
                    {status.message}
                </div>
            )}

            <button type="submit" disabled={isLoading} style={{ opacity: isLoading ? 0.7 : 1 }}>
                {isLoading ? 'Hledám a přidávám...' : 'Přidat účastníka'}
            </button>
        </form>
    )
}
