'use client'

import { useState } from 'react'
import { updateNotes, generateSummary } from '@/app/meetings/[id]/actions'
import styles from '@/app/meetings/[id]/meeting.module.css'
import { Sparkles, Loader2, Save } from 'lucide-react'

interface NotesSectionProps {
    meetingId: string
    initialNotes: string
}

export default function NotesSection({ meetingId, initialNotes }: NotesSectionProps) {
    const [notes, setNotes] = useState(initialNotes)
    const [isSaving, setIsSaving] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)

    const handleSave = async (formData: FormData) => {
        setIsSaving(true)
        try {
            await updateNotes(meetingId, formData)
        } finally {
            setIsSaving(false)
        }
    }

    const handleAISummary = async () => {
        if (!notes || notes.trim().length === 0) {
            alert('Nejprve napište nějaké poznámky.')
            return
        }

        setIsGenerating(true)
        try {
            // Check if we have strict prefixes
            const hasStrictPrefix = /^(todo:|úkol:|ukol:|- \[ \])/.test(notes.toLowerCase())

            const result = await generateSummary(meetingId, notes)

            if (result.count === 0) {
                alert('AI nenašlo žádné jasné úkoly.\n\nZkuste psát úkoly na nové řádky, např:\n- Koupit mléko\nTodo: Zavolat klientovi')
            } else {
                alert(`AI úspěšně vytvořilo ${result.count} úkolů!`)
            }
        } catch (error) {
            console.error(error)
            alert('Chyba při generování shrnutí.')
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Zápis</h2>

            <div style={{ marginBottom: '1rem' }}>
                <button
                    onClick={handleAISummary}
                    disabled={isGenerating}
                    type="button"
                    className="secondaryButton"
                    style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(200,200,255,0.1) 100%)',
                        border: '1px solid var(--secondary)',
                        color: 'var(--secondary)',
                        gap: '0.5rem',
                        padding: '0.6rem 1rem',
                        fontSize: '0.9rem',
                        cursor: isGenerating ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: '8px'
                    }}
                >
                    {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                    {isGenerating ? 'Analyzuji...' : 'AI Shrnutí'}
                </button>
            </div>

            <form action={handleSave} className={styles.notesForm}>
                <textarea
                    name="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={styles.notesArea}
                    placeholder="Zde pište zápis z meetingu..."
                />
                <button type="submit" className={styles.saveButton} disabled={isSaving}>
                    {isSaving ? 'Ukládám...' : 'Uložit zápis'}
                </button>
            </form>
        </section>
    )
}
