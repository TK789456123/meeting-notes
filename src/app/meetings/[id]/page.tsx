
// FORCE DEPLOY TRIGGER
import { createClient } from '@/utils/supabase/server'
import Navbar from '@/components/layout/Navbar'
import styles from './meeting.module.css'
import { updateNotes, addActionItem, toggleActionItem, addParticipant } from './actions'
import Link from 'next/link'
import { CheckCircle2, Circle, Calendar, User, Clock, ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import client components to prevent SSR crashes (e.g. window/navigator access)
const ExportButtons = dynamic(() => import('@/components/meetings/ExportButtons'), {
    ssr: false,
    loading: () => <button className={styles.buttonDisabled}>Načítám export...</button>
})
const ShareMeetingButton = dynamic(() => import('@/components/meetings/ShareMeetingButton'), {
    ssr: false,
    loading: () => <button className={styles.buttonDisabled}>...</button>
})
const AudioRecorder = dynamic(() => import('@/components/meetings/AudioRecorder'), {
    ssr: false,
    loading: () => <div className={styles.recorderLoading}>Načítám nahrávání...</div>
})

export default async function MeetingPage(props: { params: Promise<{ id: string }>, searchParams: Promise<{ error?: string }> }) {
    const params = await props.params
    const searchParams = await props.searchParams
    const meetingId = params.id
    const errorMessage = searchParams.error
    const supabase = await createClient()

    // 1. Fetch Basic Meeting Data
    const { data: meeting, error: meetingError } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .single()

    // Handle Meeting Not Found or Error
    if (meetingError || !meeting) {
        return (
            <div className={styles.container}>
                <h1>Schůzka nenalezena</h1>
                <p>{meetingError?.message}</p>
                <Link href="/dashboard">Zpět na přehled</Link>
            </div>
        )
    }

    // 2. Fetch Helper Data (Participants & Tasks)
    const { data: participants } = await supabase
        .from('participants')
        .select('user_id, profiles(id, full_name, avatar_url)')
        .eq('meeting_id', meetingId)

    const { data: actionItems } = await supabase
        .from('action_items')
        .select('*, profiles:assignee_id(full_name)')
        .eq('meeting_id', meetingId)
        .order('created_at', { ascending: true })

    // 3. Resolve Organizer Name manually
    let organizerName = 'Organizátor';
    if (meeting.organizer_id) {
        const { data: orgProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', meeting.organizer_id)
            .single()
        if (orgProfile) organizerName = orgProfile.full_name;
    }

    return (
        <>
            <Navbar />
            <div className={styles.container}>
                <Link href="/dashboard" className={styles.backButton}>
                    <ArrowLeft size={20} />
                    Zpět na přehled
                </Link>

                {errorMessage && (
                    <div className={styles.errorBanner}>
                        ⚠️ {errorMessage}
                    </div>
                )}

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
                            <ShareMeetingButton meetingId={meeting.id} />
                            <ExportButtons meeting={meeting} />
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
                            <AudioRecorder meetingId={meeting.id} />
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
}
