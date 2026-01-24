
import { createMeeting } from './actions'
import styles from './new.module.css'
import Navbar from '@/components/layout/Navbar'

export default async function NewMeetingPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParams = await props.searchParams
    const errorMessage = typeof searchParams.error === 'string' ? searchParams.error : null

    return (
        <>
            <Navbar />
            <div className={styles.container}>
                <div className={styles.card}>
                    <h1 className={styles.title}>Naplánovat schůzku</h1>

                    {errorMessage && (
                        <div style={{
                            background: 'rgba(255, 0, 0, 0.1)',
                            color: '#ff4757',
                            padding: '1rem',
                            borderRadius: '12px',
                            marginBottom: '1rem',
                            border: '1px solid rgba(255, 0, 0, 0.2)',
                            fontWeight: '600'
                        }}>
                            Chyba: {errorMessage}
                        </div>
                    )}

                    <form action={createMeeting} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="title">Název schůzky</label>
                            <input type="text" id="title" name="title" required placeholder="Např. Plánování Q1" />
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="date">Datum a čas</label>
                            <input type="datetime-local" id="date" name="date" required max="9999-12-31T23:59" />
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="agenda">Agenda</label>
                            <textarea id="agenda" name="agenda" rows={5} placeholder="Body k projednání..." />
                        </div>

                        <div className={styles.actions}>
                            <button type="submit" className={styles.buttonPrimary}>Vytvořit schůzku</button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}
