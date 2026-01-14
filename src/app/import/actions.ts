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
            redirectPath = '/dashboard?message=Chyba:_Nepřihlášený_uživatel'
        } else if (!file) {
            redirectPath = '/dashboard?message=Chyba:_Žádný_soubor'
        } else {
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

            if (successCount === 0 && errors.length > 0) {
                // Return the first error to the user
                redirectPath = `/dashboard?message=Chyba_importu:_${encodeURIComponent(errors[0])}`
            } else if (successCount === 0) {
                redirectPath = '/dashboard?message=Upozornění:_Žádné_schůzky_nenačteny_(zkontrolujte_formát)'
            } else {
                redirectPath = `/dashboard?message=Úspěšně_nahráno_${successCount}_schůzek`
            }
        }

    } catch (e: any) {
        console.error('Import Critical Error:', e)
        return { success: false, message: `Kritická chyba: ${e.message || 'Neznámá chyba'}` }
    }

    revalidatePath('/dashboard')

    if (successCount === 0 && errors.length > 0) {
        return { success: false, message: `Chyba importu: ${errors[0]}` }
    } else if (successCount === 0) {
        return { success: false, message: 'Upozornění: Žádné schůzky nenačteny (zkontrolujte formát)' }
    }

    return { success: true, message: `Úspěšně nahráno ${successCount} schůzek` }
}
