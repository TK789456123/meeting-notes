import { createClient } from '@/utils/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { CheckCircle2, Circle, Calendar, ArrowRight } from 'lucide-react'
import { toggleActionItem } from './actions'
import styles from './actions.module.css'

export default async function ActionItemsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div>Please login</div>
    }

    // Fetch action items where:
    // 1. User is the assignee
    // OR
    // 2. User is the organizer of the meeting (optional, but good for tracking)
    // For now, let's focus on "My Tasks" (assigned to me)

    const { data: actionItems } = await supabase
        .from('action_items')
        .select(`
            *,
            meetings (
                id,
                title,
                date
            ),
            profiles:assignee_id(full_name)
        `)
        .eq('assignee_id', user.id)
        .order('deadline', { ascending: true })
        .order('created_at', { ascending: false })

    const pendingItems = actionItems?.filter(item => !item.is_completed) || []
    const completedItems = actionItems?.filter(item => item.is_completed) || []

    return (
        <>
            <Navbar />
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Moje úkoly</h1>
                    <p className={styles.subtitle}>Přehled všech úkolů přiřazených k vaší osobě.</p>
                </header>

                <div className={styles.grid}>
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            K vyřízení <span className={styles.count}>{pendingItems.length}</span>
                        </h2>
                        <div className={styles.list}>
                            {pendingItems.length === 0 && (
                                <p className={styles.empty}>Vše hotovo! 🎉</p>
                            )}
                            {pendingItems.map((item) => (
                                <ActionItemCard key={item.id} item={item} />
                            ))}
                        </div>
                    </section>

                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            Hotovo <span className={styles.count}>{completedItems.length}</span>
                        </h2>
                        <div className={styles.list}>
                            {completedItems.length === 0 && (
                                <p className={styles.empty}>Zatím žádné dokončené úkoly.</p>
                            )}
                            {completedItems.map((item) => (
                                <ActionItemCard key={item.id} item={item} isCompleted />
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </>
    )
}

function ActionItemCard({ item, isCompleted = false }: { item: any, isCompleted?: boolean }) {
    return (
        <div className={`${styles.card} ${isCompleted ? styles.cardCompleted : ''}`}>
            <div className={styles.cardHeader}>
                <Link href={`/meetings/${item.meetings?.id}`} className={styles.meetingLink}>
                    {item.meetings?.title}
                    <ArrowRight size={14} />
                </Link>
                {item.deadline && (
                    <span className={`${styles.deadline} ${new Date(item.deadline) < new Date() && !isCompleted ? styles.overdue : ''}`}>
                        <Calendar size={12} />
                        {new Date(item.deadline).toLocaleDateString('cs-CZ')}
                    </span>
                )}
            </div>

            <div className={styles.cardBody}>
                <form action={toggleActionItem.bind(null, item.id, !item.is_completed)}>
                    <button className={styles.checkButton}>
                        {isCompleted ? <CheckCircle2 color="#2ecc71" size={24} /> : <Circle color="#ccc" size={24} />}
                    </button>
                </form>
                <p className={styles.description}>{item.description}</p>
            </div>
        </div>
    )
}
