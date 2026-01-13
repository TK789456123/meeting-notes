
// FORCE DEPLOY TRIGGER
import { createClient } from '@/utils/supabase/server'
import Navbar from '@/components/layout/Navbar'
import styles from './meeting.module.css'
import { updateNotes, addActionItem, toggleActionItem, addParticipant } from './actions'
import Link from 'next/link'
import { CheckCircle2, Circle, Calendar, User, Clock, ArrowLeft } from 'lucide-react'
import { DynamicExportButtons, DynamicShareMeetingButton, DynamicAudioRecorder } from '@/components/meetings/ClientWrappers'

export default async function MeetingPage(props: { params: Promise<{ id: string }>, searchParams: Promise<{ error?: string }> }) {
    const params = await props.params
    const searchParams = await props.searchParams
    const meetingId = params.id

    // DEBUG: Check Env Vars (Safe check)
    const envStatus = {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }

    try {
        const supabase = await createClient()

        // 1. Fetch Basic Meeting Data
        const { data: meeting, error: meetingError } = await supabase
            .from('meetings')
            .select('*')
            .eq('id', meetingId)
            .single()

        // Handle Meeting Not Found or Error
        if (meetingError || !meeting) {
            console.error("Meeting Error:", meetingError)
            return (
                <div className={styles.container}>
                    <h1>Schůzka nenalezena (DB Error)</h1>
                    <pre>{JSON.stringify(meetingError, null, 2)}</pre>
                    <p>Env Status: URL={envStatus.url ? 'OK' : 'MISSING'}, KEY={envStatus.anon ? 'OK' : 'MISSING'}</p>
                    <Link href="/dashboard">Zpět na přehled</Link>
                </div>
            )
        }

        // 2. Fetch Helper Data (Participants & Tasks)
        // Wrapped in inner try-catch to prevent partial failures from crashing the whole page
        let participants = []
        let actionItems = []
        let organizerName = 'Organizátor'

        try {
            const { data: pData } = await supabase
                .from('participants')
                .select('user_id, profiles(id, full_name, avatar_url)')
                .eq('meeting_id', meetingId)
            participants = pData || []

            const { data: aiData } = await supabase
                .from('action_items')
                .select('*, profiles:assignee_id(full_name)')
                .eq('meeting_id', meetingId)
                .order('created_at', { ascending: true })
            actionItems = aiData || []

            if (meeting.organizer_id) {
                const { data: orgProfile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', meeting.organizer_id)
                    .single()
                if (orgProfile) organizerName = orgProfile.full_name;
            }
        } catch (innerErr) {
            console.error("Error fetching details:", innerErr)
            // Continue rendering even if details fail
        }

        return (
            <>
                <Navbar />
                <div className={styles.container}>
                    <Link href="/dashboard" className={styles.backButton}>
                        <ArrowLeft size={20} />
                        Zpět na přehled
                    </Link>

                    <div className={styles.debugBanner} style={{ display: 'none' }}>
                        Debug: v2.1 | SSR Safe | {envStatus.url ? 'EnvOK' : 'EnvFAIL'}
                    </div>

                    <header className={styles.header}>
                        <div>
                            {meeting.category && (
                                <span className={styles.categoryBadge} style={{ background: meeting.color || '#667eea' }}>
                                    {meeting.category}
                                </span>
                            )}
                            <h1 className={styles.title}>{meeting.title} <span style={{ fontSize: '0.5em', color: '#ccc' }}>(v2.0 FIXED)</span></h1>
                        </div>
                        <div className={styles.headerRight}>
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
                                    {organizerName}
                                </div>
                            </div>
                            <div className={styles.actionsRow}>
                                <DynamicShareMeetingButton meetingId={meeting.id} />
                                <DynamicExportButtons meeting={meeting} />
                            </div>
                        </div>
                    </header>

                    <div className={styles.grid}>
                        <div className={styles.column}>
                            <section className={styles.section}>
                                <h2 className={styles.sectionTitle}>Audio Záznam</h2>
                                {meeting.audio_url && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <audio src={meeting.audio_url} controls style={{ width: '100%' }} />
                                    </div>
                                )}
                                <DynamicAudioRecorder meetingId={meeting.id} />
                            </section>

                            <section className={styles.section}>
                                <h2 className={styles.sectionTitle}>Agenda</h2>
                                <div className={styles.contentBox}>
                                    {meeting.agenda || 'Žádná agenda'}
                                </div>
                            </section>

                            <section className={styles.section}>
                                <h2 className={styles.sectionTitle}>Zápis</h2>
                                <form action={updateNotes.bind(null, meetingId)} className={styles.notesForm}>
                                    <textarea
                                        name="notes"
                                        defaultValue={meeting.notes || ''}
                                        className={styles.notesArea}
                                        placeholder="Zde pište zápis z meetingu..."
                                    />
                                    <button type="submit" className={styles.saveButton}>Uložit zápis</button>
                                </form>
                            </section>
                        </div>

                        <div className={styles.column}>
                            <section className={styles.section}>
                                <h2 className={styles.sectionTitle}>Účastníci</h2>
                                <div className={styles.peopleList}>
                                    {(!participants || participants.length === 0) && <p className={styles.emptyText}>Zatím žádní účastníci</p>}
                                    {participants?.map((p: any) => (
                                        <div key={p.user_id} className={styles.person}>
                                            <img src={p.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${p.profiles?.full_name || 'Neznámý'}`} alt="" className={styles.avatar} />
                                            <span>{p.profiles?.full_name || 'Neznámý uživatel'}</span>
                                        </div>
                                    ))}
                                </div>

                                <form action={addParticipant.bind(null, meetingId)} className={styles.addActionForm} style={{ marginTop: '1rem' }}>
                                    <label className={styles.labelSmall}>Přidat účastníka (email):</label>
                                    <input type="email" name="email" placeholder="client@example.com" required />
                                    <button type="submit">Přidat účastníka</button>
                                </form>
                            </section>

                            <section className={styles.section}>
                                <h2 className={styles.sectionTitle}>Úkoly (Action Items)</h2>
                                <div className={styles.actionList}>
                                    {actionItems?.map((item) => (
                                        <div key={item.id} className={styles.actionItem}>
                                            <form action={toggleActionItem.bind(null, item.id, !item.is_completed, meetingId)}>
                                                <button className={styles.iconButton}>
                                                    {item.is_completed ? <CheckCircle2 color="#2ecc71" /> : <Circle color="#ccc" />}
                                                </button>
                                            </form>
                                            <div className={styles.actionContent}>
                                                <p className={item.is_completed ? styles.completedText : ''}>{item.description}</p>
                                                <div className={styles.actionMeta}>
                                                    {item.profiles?.full_name && <span>👤 {item.profiles.full_name}</span>}
                                                    {item.deadline && <span>📅 {new Date(item.deadline).toLocaleDateString()}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <form action={addActionItem.bind(null, meetingId)} className={styles.addActionForm}>
                                    <label className={styles.labelSmall}>Nový úkol:</label>
                                    <input type="text" name="description" placeholder="Popis úkolu..." required />
                                    <div className={styles.row}>
                                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                            <label className={styles.labelSmall}>Komu:</label>
                                            <select name="assignee_id">
                                                <option value="">-- Vyberte --</option>
                                                {participants?.map((p: any) => (
                                                    <option key={p.user_id} value={p.user_id}>{p.profiles.full_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <label className={styles.labelSmall}>Do kdy:</label>
                                            <input type="date" name="deadline" />
                                        </div>
                                    </div>
                                    <button type="submit">Přidat úkol</button>
                                </form>
                            </section>
                        </div>
                    </div>
                </div>
            </>
        )
    } catch (err: any) {
        // FATAL CRASH HANDLER
        return (
            <div style={{ padding: '40px', background: '#fff0f0', color: '#c0392b', fontFamily: 'monospace' }}>
                <h1>⚠️ CRITICAL ERROR ⚠️</h1>
                <h3>The application crashed on the server.</h3>
                <hr style={{ borderColor: '#fab1a0' }} />
                <p><strong>Error Message:</strong> {err?.message || 'Unknown Error'}</p>
                <p><strong>Error Digest:</strong> {err?.digest || 'No digest'}</p>
                <div style={{ background: '#eee', padding: '10px', marginTop: '20px' }}>
                    <strong>Debug Info:</strong>
                    <ul>
                        <li>Node Env: {process.env.NODE_ENV}</li>
                        <li>Supabase URL Set: {envStatus.url ? 'YES' : 'NO ❌'}</li>
                        <li>Supabase Key Set: {envStatus.anon ? 'YES' : 'NO ❌'}</li>
                    </ul>
                </div>
            </div>
        )
    }
