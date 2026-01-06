
import { importMeetings } from './actions'
import Navbar from '@/components/layout/Navbar'
import styles from './import.module.css'

export default function ImportPage() {
    return (
        <>
            <Navbar />
            <div className={styles.container}>
                <div className={styles.card}>
                    <h1 className={styles.title}>Import schůzek</h1>
                    <p className={styles.subtitle}>Nahrajte .txt soubor se seznamem schůzek.</p>
                    <p className={styles.instruction}>Formát: <code>YYYY-MM-DD Název schůzky</code> (na každém řádku jedna)</p>

                    <form action={importMeetings} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <input type="file" name="file" accept=".txt" required />
                        </div>
                        <button type="submit" className={styles.buttonPrimary}>Importovat</button>
                    </form>
                </div>
            </div>
        </>
    )
}
