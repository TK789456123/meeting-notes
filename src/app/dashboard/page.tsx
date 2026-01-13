
import { createClient } from '@/utils/supabase/server'
import styles from './dashboard.module.css'
import Link from 'next/link'
import { Plus } from 'lucide-react'

import DeleteMeetingButton from '@/components/meetings/DeleteMeetingButton'
import SearchInput from '@/components/ui/search-input'

export default async function DashboardPage(props: {
    searchParams?: Promise<{
        query?: string
    }>
}) {
    const searchParams = await props.searchParams
    const query = searchParams?.query || ''

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let dbQuery = supabase
        .from('meetings')
        .select('*')
        .order('date', { ascending: true })

    if (query) {
        dbQuery = dbQuery.ilike('title', `%${query}%`)
    }

    const { data: meetings } = await dbQuery

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Moje schůzky</h1>
                    <p className={styles.subtitle}>Přehled všech vašich naplánovaných meetingů</p>
                </div>
                <div className={styles.headerButtons}>
                    <Link href="/import" className={styles.secondaryButton}>
                        Importovat (TXT)
                    </Link>
                    <Link href="/meetings/new" className={styles.addButton}>
                        <Plus size={20} />
                        Nová schůzka
                    </Link>
                </div>
            </header>

            <div style={{ marginBottom: '20px' }}>
                <SearchInput placeholder="Hledat schůzky..." />
            </div>

            <div className={styles.grid}>
                {meetings?.map((meeting) => (
                    <div key={meeting.id} style={{ position: 'relative' }}>
                        <DeleteMeetingButton id={meeting.id} />
                        <Link href={`/meetings/${meeting.id}`} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <span className={styles.date}>
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
        </div>
    )
}
