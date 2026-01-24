
import { createClient } from '@/utils/supabase/server'
import styles from './dashboard.module.css'
import Link from 'next/link'
import DeleteMeetingButton from '@/components/meetings/DeleteMeetingButton'
import SearchInput from '@/components/ui/search-input'
import DashboardControls from './DashboardControls'
import DashboardGrid from '@/components/dashboard/DashboardGrid'

export default async function DashboardPage(props: {
    searchParams?: Promise<{
        query?: string;
        message?: string;
    }>;
}) {
    const searchParams = await props.searchParams;
    const query = searchParams?.query || '';
    const rawMessage = searchParams?.message || '';

    // Safe decode function
    let message = '';
    if (rawMessage) {
        try {
            message = decodeURIComponent(rawMessage).replace(/_/g, ' ');
        } catch {
            message = rawMessage.replace(/_/g, ' '); // Fallback to raw if decode fails
        }
    }

    const supabase = await createClient()

    // Fetch User to check tutorial status (Restored logic)
    const { data: { user } } = await supabase.auth.getUser()

    // Check profile
    if (user) {
        // We might want to check for 'has_seen_tutorial' here if we were using it server-side,
        // but currently it seems handled by OnboardingTutorial client-side via localStorage + props.
    }

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
                    backgroundColor: message.includes('Chyba') || message.includes('Kritická') ? '#fed7d7' : '#c6f6d5',
                    color: message.includes('Chyba') || message.includes('Kritická') ? '#c53030' : '#2f855a',
                    border: `1px solid ${message.includes('Chyba') || message.includes('Kritická') ? '#feb2b2' : '#9ae6b4'}`
                }}>
                    {message}
                </div>
            )}

            <div style={{ marginBottom: '20px' }}>
                <SearchInput placeholder="Hledat schůzky..." />
            </div>

            <DashboardGrid meetings={meetings} query={query} />
        </div >
    )
}
