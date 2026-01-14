'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ImportState {
    success: boolean
    message: string
}

export async function importMeetings(_prevState: ImportState, formData: FormData): Promise<ImportState> {
    let successCount = 0
    let errors: string[] = []

    try {
        const file = formData.get('file') as File
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, message: 'Chyba: Nepřihlášený uživatel' }
        }

        if (!file) {
            return { success: false, message: 'Chyba: Žádný soubor' }
        }

        const text = await file.text()
        // Robust splitting for various EOLs
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')

        for (const line of lines) {
            const parts = line.trim().split(' ')
            if (parts.length < 2) continue

            const dateStr = parts[0]
            const title = parts.slice(1).join(' ')
            const date = new Date(dateStr)

            if (isNaN(date.getTime())) {
                errors.push(`Neplatné datum: ${dateStr}`)
                continue
            }
            date.setHours(9, 0, 0, 0)

            const { data: meeting, error: meetingError } = await supabase
                .from('meetings')
                .insert({
                    title,
                    date: date.toISOString(),
                    organizer_id: user.id
                })
                .select()
                .single()

            if (meetingError) {
                console.error('Import Error:', meetingError)
                errors.push(`Chyba databáze: ${meetingError.message}`)
                continue
            }

            if (meeting) {
                await supabase.from('participants').insert({
                    meeting_id: meeting.id,
                    user_id: user.id
                })
                successCount++
            }
        }

        revalidatePath('/dashboard')

        if (successCount === 0 && errors.length > 0) {
            return { success: false, message: `Chyba importu: ${errors[0]}` }
        } else if (successCount === 0) {
            return { success: false, message: 'Upozornění: Žádné schůzky nenačteny (zkontrolujte formát)' }
        } else {
            return { success: true, message: `Úspěšně nahráno ${successCount} schůzek` }
        }

    } catch (error: unknown) {
        console.error('Import Critical Error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Neznámá chyba'
        return { success: false, message: `Kritická chyba: ${errorMessage}` }
    }
}
