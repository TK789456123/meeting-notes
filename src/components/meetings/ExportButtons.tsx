'use client'

import { Download, Calendar as CalendarIcon, FileText, Palette } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as ics from 'ics'
import styles from './export-buttons.module.css'
import { updateColor } from '@/app/meetings/[id]/actions'

// Extend jsPDF type to include autoTable
interface jsPDFWithAutoTable extends jsPDF {
    lastAutoTable?: { finalY: number }
}

interface ExportButtonsProps {
    meeting: {
        id: string
        title: string
        date: string
        agenda: string
        notes: string
        category?: string
        color?: string
    }
    actionItems?: {
        id: string
        description: string
        is_completed: boolean
        deadline?: string | null
        assignee_id?: string | null
        profiles?: { full_name: string | null } | null
    }[]
}

export default function ExportButtons({ meeting, actionItems = [] }: ExportButtonsProps) {

    const handleColorChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newColor = e.target.value
        await updateColor(meeting.id, newColor)
    }

    const handleDownloadPDF = () => {
        const doc = new jsPDF() as jsPDFWithAutoTable

        // Title
        doc.setFontSize(22)
        doc.text(meeting.title, 20, 20)

        // Metadata
        doc.setFontSize(12)
        doc.setTextColor(100, 100, 100)
        doc.text(`Datum: ${new Date(meeting.date).toLocaleString('cs-CZ')}`, 20, 30)
        doc.text(`Kategorie: ${meeting.category || 'Nezadáno'}`, 20, 38)
        doc.setTextColor(0, 0, 0)

        let currentY = 50

        // Agenda
        doc.setFontSize(16)
        doc.text('Agenda', 20, currentY)
        currentY += 10
        doc.setFontSize(12)
        const splitAgenda = doc.splitTextToSize(meeting.agenda || 'Žádná agenda.', 170)
        doc.text(splitAgenda, 20, currentY)
        currentY += splitAgenda.length * 7 + 10

        // Notes
        doc.setFontSize(16)
        doc.text('Zápis', 20, currentY)
        currentY += 10
        doc.setFontSize(12)
        const splitNotes = doc.splitTextToSize(meeting.notes || 'Žádné poznámky.', 170)
        doc.text(splitNotes, 20, currentY)
        currentY += splitNotes.length * 7 + 15

        // Action Items (Table)
        if (actionItems && actionItems.length > 0) {
            doc.setFontSize(16)
            doc.text('Úkoly', 20, currentY)
            currentY += 5 // Spacing for table

            const tableData = actionItems.map(item => [
                item.is_completed ? 'Hotovo' : 'K vyřízení',
                item.description,
                item.profiles?.full_name || 'Neurčeno',
                item.deadline ? new Date(item.deadline).toLocaleDateString('cs-CZ') : '-'
            ])

            autoTable(doc, {
                startY: currentY,
                head: [['Stav', 'Úkol', 'Odpovědná osoba', 'Termín']],
                body: tableData,
                styles: { font: 'helvetica', fontSize: 10 },
                headStyles: { fillColor: [102, 126, 234] },
                alternateRowStyles: { fillColor: [245, 247, 250] }
            })
        }

        doc.save(`${meeting.title.replace(/\s+/g, '_')}_zapis.pdf`)
    }

    const handleAddToCalendar = () => {
        const date = new Date(meeting.date)

        // Format action items for calendar description
        const actionItemsText = actionItems && actionItems.length > 0
            ? '\n\nÚkoly:\n' + actionItems.map(item => `- ${item.description} (${item.profiles?.full_name || '?'})`).join('\n')
            : ''

        const event: ics.EventAttributes = {
            start: [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()],
            duration: { hours: 1, minutes: 0 },
            title: meeting.title,
            description: `${meeting.agenda}\n\nPoznámky:\n${meeting.notes}${actionItemsText}`,
            location: 'MeetingNotes App',
            status: 'CONFIRMED',
            busyStatus: 'BUSY',
        }

        ics.createEvent(event, (error, value) => {
            if (error) {
                console.error(error)
                alert('Chyba při generování kalendáře')
                return
            }

            const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `${meeting.title.replace(/\s+/g, '_')}.ics`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        })
    }

    return (
        <div className={styles.container}>
            <div className={styles.colorWrapper} title="Změnit barvu">
                <Palette size={18} className={styles.colorIcon} />
                <input
                    type="color"
                    onChange={handleColorChange}
                    defaultValue={meeting.color || '#667eea'}
                    className={styles.colorInput}
                />
            </div>

            <button onClick={handleDownloadPDF} className={styles.button} title="Stáhnout jako PDF">
                <FileText size={18} />
                <span>PDF Zápis</span>
            </button>
            <button onClick={handleAddToCalendar} className={styles.button} title="Přidat do kalendáře">
                <CalendarIcon size={18} />
                <span>Do kalendáře</span>
            </button>
        </div>
    )
}
