'use client'


import { Download, Calendar as CalendarIcon, FileText, Palette } from 'lucide-react'
/** @ts-ignore */
import jsPDF from 'jspdf'
/** @ts-ignore */
import * as ics from 'ics'
import styles from './export-buttons.module.css'
import { updateColor } from '@/app/meetings/[id]/actions'

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
}

export default function ExportButtons({ meeting }: ExportButtonsProps) {

    const handleColorChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newColor = e.target.value
        await updateColor(meeting.id, newColor)
    }

    const handleDownloadPDF = () => {
        /** @ts-ignore */
        const doc = new jsPDF()

        // Font setup (standard helvetica supports basics, for unicode cs chars we might need custom font but trying standard first)
        // Note: jsPDF default font doesn't support all UTF-8 chars well. 
        // For simplicity in this demo we use standard text.

        doc.setFontSize(22)
        doc.text(meeting.title, 20, 20)

        doc.setFontSize(12)
        doc.text(`Datum: ${new Date(meeting.date).toLocaleString('cs-CZ')}`, 20, 30)
        doc.text(`Kategorie: ${meeting.category || 'Nezadáno'}`, 20, 38)

        doc.setFontSize(16)
        doc.text('Agenda', 20, 50)
        doc.setFontSize(12)
        const splitAgenda = doc.splitTextToSize(meeting.agenda || 'Žádná agenda.', 170)
        doc.text(splitAgenda, 20, 60)

        const agendaHeight = splitAgenda.length * 7
        const notesY = 70 + agendaHeight

        doc.setFontSize(16)
        doc.text('Poznámky', 20, notesY)
        doc.setFontSize(12)
        const splitNotes = doc.splitTextToSize(meeting.notes || 'Žádné poznámky.', 170)
        doc.text(splitNotes, 20, notesY + 10)

        doc.save(`${meeting.title.replace(/\s+/g, '_')}_zapis.pdf`)
    }

    const handleAddToCalendar = () => {
        const date = new Date(meeting.date)
        /** @ts-ignore */
        const event: ics.EventAttributes = {
            start: [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()],
            duration: { hours: 1, minutes: 0 }, // Default 1 hour
            title: meeting.title,
            description: `${meeting.agenda}\n\nPoznámky:\n${meeting.notes}`,
            location: 'MeetingNotes App',
            status: 'CONFIRMED',
            busyStatus: 'BUSY',
        }

        /** @ts-ignore */
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
