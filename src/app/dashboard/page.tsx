
import { createClient } from '@/utils/supabase/server'
import styles from './dashboard.module.css'
import Link from 'next/link'
import DeleteMeetingButton from '@/components/meetings/DeleteMeetingButton'
import SearchInput from '@/components/ui/search-input'
import DashboardControls from './DashboardControls'

export default async function DashboardPage(props: {
    searchParams?: Promise<{
        query?: string;
        message?: string;
    }>;
}) {
    const searchParams = await props.searchParams;
    const query = searchParams?.query || '';
    const message = searchParams?.message || '';

    const supabase = await createClient()

    // Fetch User to check tutorial status
    const { data: { user } } = await supabase.auth.getUser()

    // ... (rest of logic)

    let queryBuilder = supabase
        .from('meetings')
        .select('*')
        .order('date', { ascending: true })

    if (query) {
        queryBuilder = queryBuilder.ilike('title', `%${query}%`)
    }

    const { data: meetings } = await queryBuilder

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Moje schůzky</h1>
                    <p className={styles.subtitle}>Přehled všech vašich naplánovaných meetingů</p>
                </div>
                <div className={styles.headerButtons}>
                    <DashboardControls userId={user?.id} />
                </div>
            </header>

            {message && (
                <div style={{
                    padding: '1rem',
                    marginBottom: '1rem',
                    borderRadius: '0.5rem',
                    backgroundColor: message.startsWith('Chyba') ? '#fed7d7' : '#c6f6d5',
                    color: message.startsWith('Chyba') ? '#c53030' : '#2f855a',
                    border: `1px solid ${message.startsWith('Chyba') ? '#feb2b2' : '#9ae6b4'}`
                }}>
                    {decodeURIComponent(message).replace(/_/g, ' ')}
                </div>
            )}

            <div style={{ marginBottom: '20px' }}>
                <SearchInput placeholder="Hledat schůzky..." />
            </div>

            <div className={styles.grid}>
                {meetings?.map((meeting) => (
                    <div key={meeting.id} style={{ position: 'relative' }}>
                        <DeleteMeetingButton id={meeting.id} />
                        <Link
                            href={`/meetings/${meeting.id}`}
                            className={styles.card}
                            style={{
                                borderColor: meeting.color || 'rgba(255,255,255,0.8)',
                                background: meeting.color ? `${meeting.color}33` : 'rgba(255, 255, 255, 0.6)' // 33 = ~20% opacity
                            }}
                        >
                            <div className={styles.cardHeader}>
                                <span
                                    className={styles.date}
                                    style={{
                                        background: meeting.color ? `${meeting.color}20` : 'rgba(102, 126, 234, 0.1)',
                                        color: meeting.color || '#667eea'
                                    }}
                                >
                                    {new Date(meeting.date).toLocaleDateString('cs-CZ')}
                                </span>
                            </div>
                            <h3 className={styles.cardTitle}>{meeting.title}</h3>
                            <div className={styles.cardFooter}>
                                Zobrazit detail →
                            </div>
                        </Link>
                    </div>
                ))}
                {(!meetings || meetings.length === 0) && (
                    <div className={styles.emptyState}>
                        <p>{query ? `Žádné schůzky nenalezeny pro "${query}".` : 'Zatím nemáte žádné schůzky.'}</p>
                    </div>
                )}
            </div>
        </div >
    )
}
