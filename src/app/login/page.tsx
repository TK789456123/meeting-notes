
import { login, signup } from './actions'
import styles from './login.module.css'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message: string }>
}) {
    const { message } = await searchParams
    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>MeetingNotes</h1>
                <p className={styles.subtitle}>Přihlaste se pro pokračování</p>

                <form className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="full_name">Celé jméno (jen pro registraci)</label>
                        <input id="full_name" name="full_name" type="text" placeholder="Jan Novák" />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Email</label>
                        <input id="email" name="email" type="email" required placeholder="jan@example.com" />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Heslo</label>
                        <input id="password" name="password" type="password" required placeholder="••••••••" />
                    </div>

                    {message && (
                        <div className={styles.message}>{message}</div>
                    )}

                    <div className={styles.actions}>
                        <button formAction={login} className={styles.buttonPrimary}>Přihlásit se</button>
                        <button formAction={signup} className={styles.buttonSecondary}>Registrovat se</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
