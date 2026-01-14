'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { importMeetings } from './actions'

import styles from './import.module.css'

const initialState = {
    success: false,
    message: '',
}

export default function ImportPage() {
    const [state, formAction, isPending] = useActionState(importMeetings, initialState)
    const router = useRouter()

    useEffect(() => {
        if (state.message) {
            if (state.success) {
                router.push(`/dashboard?message=${encodeURIComponent(state.message)}`)
            } else {
                alert(state.message) // Or show inline error
            }
        }
    }, [state, router])

    return (
        <>

            <div className={styles.container}>
                <div className={styles.card}>
                    <h1 className={styles.title}>Import schůzek</h1>
                    <p className={styles.subtitle}>Nahrajte .txt soubor se seznamem schůzek.</p>
                    <p className={styles.instruction}>Formát: <code>YYYY-MM-DD Název schůzky</code> (na každém řádku jedna)</p>

                    <form action={formAction} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <input type="file" name="file" accept=".txt" required />
                        </div>
                        <button
                            type="submit"
                            className={styles.buttonPrimary}
                            disabled={isPending}
                        >
                            {isPending ? 'Nahrávám...' : 'Importovat'}
                        </button>
                    </form>

                    {state.message && !state.success && (
                        <p style={{ color: 'red', marginTop: '1rem' }}>{state.message}</p>
                    )}
                </div>
            </div>
        </>
    )
}
