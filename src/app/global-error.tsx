'use client'

import { useEffect } from 'react'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Global Error caught:', error)
    }, [error])

    return (
        <html>
            <body>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    fontFamily: 'sans-serif',
                    textAlign: 'center'
                }}>
                    <h2 style={{ color: '#e53e3e', fontSize: '2rem' }}>Kritická chyba aplikace 💥</h2>
                    <p>Omlouváme se, došlo k neočekávané chybě na úrovni celé aplikace.</p>

                    <pre style={{
                        backgroundColor: '#f7fafc',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        maxWidth: '80%',
                        overflow: 'auto',
                        marginBottom: '2rem'
                    }}>
                        {error.message || 'Neznámá chyba'}
                    </pre>

                    <button
                        onClick={() => reset()}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#667eea',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '1.2rem'
                        }}
                    >
                        Zkusit obnovit
                    </button>
                </div>
            </body>
        </html>
    )
}
