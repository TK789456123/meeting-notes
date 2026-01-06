
import { createMeeting } from './actions'
import styles from './new.module.css'
import Navbar from '@/components/layout/Navbar'

export default function NewMeetingPage() {
    return (
        <>
            <Navbar />
            <div className={styles.container}>
                <div className={styles.card}>
                    <h1 className={styles.title}>Naplánovat schůzku</h1>

                    <form action={createMeeting} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="title">Název schůzky</label>
                            <input type="text" id="title" name="title" required placeholder="Např. Plánování Q1" />
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="date">Datum a čas</label>
                            <input type="datetime-local" id="date" name="date" required />
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
