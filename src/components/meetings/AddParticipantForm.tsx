'use client'

import { useState, useRef } from 'react'
import { addParticipant } from '@/app/meetings/[id]/actions'
import styles from '@/app/meetings/[id]/meeting.module.css'

export default function AddParticipantForm({ meetingId }: { meetingId: string }) {
    const [isLoading, setIsLoading] = useState(false)
    const formRef = useRef<HTMLFormElement>(null)

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true)
        try {
            await addParticipant(meetingId, formData)
            // If successful (no error thrown), reset form
            formRef.current?.reset()
            // Optional: You could show a toast here
        } catch (error) {
            console.error("Failed to add participant", error)
            // Error handling is partly done via redirect in server action, 
            // but for a better UX we might want to change the server action to return state.
            // For now, we rely on the revalidate.
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
                placeholder="client@example.com"
                required
                disabled={isLoading}
            />
            <button type="submit" disabled={isLoading}>
                {isLoading ? 'Přidávám...' : 'Přidat účastníka'}
            </button>
        </form>
    )
}
