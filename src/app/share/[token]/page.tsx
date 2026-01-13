import { createClient } from '@/utils/supabase/server'
import styles from './share.module.css'
import { Calendar, Clock, User, FileText, List } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function SharedMeetingPage(props: { params: Promise<{ token: string }> }) {
    const params = await props.params
    const supabase = await createClient()
    const token = params.token

    if (!token) notFound() // Should be caught by route matching but safe to check

    // Use RPC function to securely fetch meeting by token (bypassing RLS)
    const { data: meetings, error } = await supabase.rpc('get_shared_meeting', {
        token_arg: token
    })

    if (error) {
        console.error('Error fetching shared meeting:', error)
        return <div className={styles.container}>Chyba při načítání schůzky.</div>
    }

    if (!meetings || meetings.length === 0) {
        return (
            <div className={styles.container} style={{ textAlign: 'center', marginTop: '5rem' }}>
                <h1>Schůzka nenalezena</h1>
                <p>Odkaz je neplatný nebo schůzka již neexistuje.</p>
            </div>
        )
    }

    const meeting = meetings[0] as any // Type assertion since RPC types might not be auto-generated yet

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                {meeting.category && (
                    <span
                        className={styles.categoryTag}
                        style={{ backgroundColor: meeting.color || '#667eea' }}
                    >
                        {meeting.category}
                    </span>
                )}
                <h1 className={styles.title}>{meeting.title}</h1>

                <div className={styles.meta}>
                    <div className={styles.metaItem}>
                        <Calendar size={18} />
                        {new Date(meeting.date).toLocaleDateString('cs-CZ')}
                    </div>
                    <div className={styles.metaItem}>
                        <Clock size={18} />
                        {new Date(meeting.date).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className={styles.metaItem}>
                        <User size={18} />
                        {meeting.organizer_name || 'Neznámý organizátor'}
                    </div>
                </div>
            </header>

            <main>
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <List size={20} color="#667eea" />
                        Agenda
                    </h2>
                    <div className={[styles.content, styles.agendaBox].join(' ')}>
                        {meeting.agenda ? meeting.agenda : 'Žádná agenda'}
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <FileText size={20} color="#667eea" />
                        Zápis
                    </h2>
                    <div className={[styles.content, styles.notesBox].join(' ')}>
                        {meeting.notes ? (
                            meeting.notes.split('\n').map((line: string, i: number) => (
                                <p key={i} style={{ marginBottom: '0.5rem' }}>{line}</p>
                            ))
                        ) : (
                            <span style={{ fontStyle: 'italic', color: '#a0aec0' }}>Zatím žádný zápis.</span>
                        )}
                    </div>
                </section>
            </main>

            <footer className={styles.footer}>
                <p>Meeting Notes App • Sdílený náhled</p>
            </footer>
        </div>
    )
}
