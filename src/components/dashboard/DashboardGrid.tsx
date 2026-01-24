'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from '@/app/dashboard/dashboard.module.css'
import DeleteMeetingButton from '@/components/meetings/DeleteMeetingButton'
import { CheckCircle2, Circle } from 'lucide-react'
import BulkActionsBar from './BulkActionsBar'
import { bulkDeleteMeetings } from '@/app/dashboard/actions'
import jsPDF from 'jspdf'

interface Meeting {
    id: string
    title: string
    date: string
    color: string | null
    notes: string | null
    agenda: string | null
    category: string | null
}

export default function DashboardGrid({ meetings, query }: { meetings: Meeting[] | null, query: string }) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isDeleting, setIsDeleting] = useState(false)

    // Toggle selection for a single item
    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds)
        if (newSet.has(id)) {
            newSet.delete(id)
        } else {
            newSet.add(id)
        }
        setSelectedIds(newSet)
    }

    const clearSelection = () => {
        setSelectedIds(new Set())
    }

    const handleBulkDelete = async () => {
        if (!confirm(`Opravdu chcete smazat ${selectedIds.size} schůzek? Tato akce je nevratná.`)) return

        setIsDeleting(true)
        try {
            await bulkDeleteMeetings(Array.from(selectedIds))
            clearSelection()
        } catch (error) {
            console.error("Bulk delete error:", error)
            alert("Chyba při mazání schůzek")
        } finally {
            setIsDeleting(false)
        }
    }

    const handleBulkExport = () => {
        const doc = new jsPDF()
        let y = 20
        let pageCount = 1

        const selectedMeetings = meetings?.filter(m => selectedIds.has(m.id)) || []

        selectedMeetings.forEach((meeting, index) => {
            if (index > 0) {
                doc.addPage()
                y = 20
                pageCount++
            }

            // Simple PDF Export Logic (Merged)
            doc.setFontSize(22)
            doc.text(meeting.title, 20, y)
            y += 10

            doc.setFontSize(12)
            doc.text(`Datum: ${new Date(meeting.date).toLocaleDateString('cs-CZ')}`, 20, y)
            y += 20 // Space

            if (meeting.agenda) {
                doc.setFontSize(16)
                doc.text('Agenda', 20, y)
                y += 10
                doc.setFontSize(12)
                const splitAgenda = doc.splitTextToSize(meeting.agenda, 170)
                doc.text(splitAgenda, 20, y)
                y += (splitAgenda.length * 7) + 10
            }

            if (meeting.notes) {
                doc.setFontSize(16)
                doc.text('Zápis', 20, y)
                y += 10
                doc.setFontSize(12)
                const splitNotes = doc.splitTextToSize(meeting.notes, 170)
                doc.text(splitNotes, 20, y)
            }
        })

        doc.save(`meeting-export-bulk-${new Date().toISOString().split('T')[0]}.pdf`)
        clearSelection()
    }

    return (
        <>
            <div className={styles.grid}>
                {meetings?.map((meeting) => {
                    const isSelected = selectedIds.has(meeting.id)
                    const isSelectionMode = selectedIds.size > 0

                    return (
                        <div key={meeting.id} style={{ position: 'relative' }}>
                            {/* Selection Overlay / Checkbox */}
                            <button
                                onClick={(e) => {
                                    e.preventDefault()
                                    toggleSelection(meeting.id)
                                }}
                                style={{
                                    position: 'absolute',
                                    top: '10px',
                                    left: '10px',
                                    zIndex: 20,
                                    background: isSelected ? '#667eea' : 'rgba(255,255,255,0.8)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    opacity: isSelectionMode || isSelected ? 1 : 0, // Show on hover done via CSS usually, but here logic-based
                                    transition: 'opacity 0.2s',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                }}
                                className="selection-trigger" // Can be used for hover
                            >
                                {isSelected ? <CheckCircle2 size={20} color="white" /> : <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #a0aec0' }} />}
                            </button>

                            {!isSelectionMode && <DeleteMeetingButton id={meeting.id} />}

                            <Link
                                href={isSelectionMode ? '#' : `/meetings/${meeting.id}`}
                                onClick={(e) => {
                                    if (isSelectionMode) {
                                        e.preventDefault()
                                        toggleSelection(meeting.id)
                                    }
                                }}
                                className={styles.card}
                                style={{
                                    borderColor: isSelected ? '#667eea' : (meeting.color || 'rgba(255,255,255,0.8)'),
                                    background: meeting.color ? `${meeting.color}33` : 'rgba(255, 255, 255, 0.6)',
                                    transform: isSelected ? 'scale(0.98)' : 'scale(1)',
                                    borderWidth: isSelected ? '2px' : '1px'
                                }}
                            >
                                <div className={styles.cardHeader}>
                                    <span
                                        className={styles.date}
                                        style={{
                                            background: meeting.color ? `${meeting.color}20` : 'rgba(102, 126, 234, 0.1)',
                                            color: meeting.color || '#667eea',
                                            marginLeft: isSelectionMode ? '2rem' : 0 // Make space for checkbox
                                        }}
                                    >
                                        {(() => {
                                            const d = new Date(meeting.date);
                                            return isNaN(d.getTime()) ? 'Neplatné datum' : d.toLocaleDateString('cs-CZ');
                                        })()}
                                    </span>
                                </div>
                                <h3 className={styles.cardTitle}>{meeting.title}</h3>
                                {meeting.category && (
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
                                        {meeting.category}
                                    </span>
                                )}
                                <div className={styles.cardFooter}>
                                    {isSelectionMode ? (isSelected ? 'Vybráno' : 'Klepnutím vyberte') : 'Zobrazit detail →'}
                                </div>
                            </Link>
                        </div>
                    )
                })}
                {(!meetings || meetings.length === 0) && (
                    <div className={styles.emptyState}>
                        <p>{query ? `Žádné schůzky nenalezeny pro "${query}".` : 'Zatím nemáte žádné schůzky.'}</p>
                    </div>
                )}
            </div>

            <BulkActionsBar
                selectedCount={selectedIds.size}
                onClearSelection={clearSelection}
                onDelete={handleBulkDelete}
                onExport={handleBulkExport}
                isDeleting={isDeleting}
            />

            <style jsx global>{`
                /* Show checkbox on hover even if not in selection mode */
                .selection-trigger:hover {
                    opacity: 1 !important;
                }
            `}</style>
        </>
    )
}
