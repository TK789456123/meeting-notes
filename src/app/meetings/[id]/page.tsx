
import { createClient } from '@/utils/supabase/server'
import Navbar from '@/components/layout/Navbar'
import styles from './meeting.module.css'
import { updateNotes, addActionItem, toggleActionItem, addParticipant } from './actions'
import { CheckCircle2, Circle, Calendar, User, Clock } from 'lucide-react'

export default async function MeetingPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()
    const meetingId = params.id

    const { data: meeting } = await supabase
        .from('meetings')
        .select('*, profiles:organizer_id(full_name)')
        .eq('id', meetingId)
        .single()

    const { data: participants } = await supabase
        .from('participants')
        .select('user_id, profiles(id, full_name, avatar_url)')
        .eq('meeting_id', meetingId)

    const { data: actionItems } = await supabase
        .from('action_items')
        .select('*, profiles:assignee_id(full_name)')
        .eq('meeting_id', meetingId)
        .order('created_at', { ascending: true })

    if (!meeting) return <div>Meeting not found</div>

    return (
        <>
            <Navbar />
            <div className={styles.container}>
                <header className={styles.header}>
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
                            {meeting.profiles?.full_name}
                        </div>
                    </div>
                </header>

                <div className={styles.grid}>
                    <div className={styles.column}>
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
                                {participants?.map((p: any) => (
                                    <div key={p.user_id} className={styles.person}>
                                        <img src={p.profiles.avatar_url || `https://ui-avatars.com/api/?name=${p.profiles.full_name}`} alt="" className={styles.avatar} />
                                        <span>{p.profiles.full_name}</span>
                                    </div>
                                ))}
                            </div>

                            <form action={addParticipant.bind(null, meetingId)} className={styles.addActionForm} style={{ marginTop: '1rem' }}>
                                <input type="email" name="email" placeholder="Email účastníka..." required />
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
                                <input type="text" name="description" placeholder="Nový úkol..." required />
                                <div className={styles.row}>
                                    <select name="assignee_id">
                                        <option value="">Přiřadit komu...</option>
                                        {participants?.map((p: any) => (
                                            <option key={p.user_id} value={p.user_id}>{p.profiles.full_name}</option>
                                        ))}
                                    </select>
                                    <input type="date" name="deadline" />
                                </div>
                                <button type="submit">Přidat</button>
                            </form>
                        </section>
                    </div>
                </div>
            </div>
        </>
    )
}
