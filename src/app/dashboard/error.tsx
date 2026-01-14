'use client'

import { useEffect } from 'react'
import styles from './dashboard.module.css'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Dashboard Error Boundary caught:', error)
    }, [error])

    return (
        <div className={styles.container} style={{ textAlign: 'center', marginTop: '50px' }}>
            <h2 className={styles.title} style={{ color: '#e53e3e' }}>Něco se pokazilo! 💥</h2>
            <p style={{ marginBottom: '20px' }}>
                Omlouváme se, při načítání dashboardu došlo k chybě.
            </p>

            {/* Optional: Show error message in dev mode or if safe */}
            <div style={{ color: '#718096', fontSize: '0.9rem', marginBottom: '20px', fontFamily: 'monospace' }}>
                {error.message || 'Neznámá chyba'}
            </div>

            <button
                onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                }
                style={{
                    padding: '10px 20px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '1rem'
                }}
            >
                Zkusit znovu
            </button>
        </div>
    )
}
