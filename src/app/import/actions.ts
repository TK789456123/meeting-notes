'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ImportState {
    success: boolean
    message: string
}

export async function importMeetings(_prevState: ImportState, formData: FormData): Promise<ImportState> {
    let successCount = 0
    const errors: string[] = []
    // Debug info to help user
    let debugLinesRead = 0
    let firstLineContent = ''

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
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')
        debugLinesRead = lines.length

        for (const line of lines) {
            // Save first line for debug
            if (!firstLineContent) firstLineContent = line

            // Split by any whitespace (space, tab, etc.) to be robust
            const parts = line.trim().split(/\s+/)

            if (parts.length < 2) {
                // Try to see if it's just missing separator but has date format at start?
                // For now just log usage
                continue
            }

            const dateStr = parts[0]
            // Join the rest back together safely
            const title = parts.slice(1).join(' ')

            const date = new Date(dateStr)

            if (isNaN(date.getTime())) {
                errors.push(`Řádek "${line.substring(0, 20)}...": Neplatné datum (${dateStr})`)
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
                errors.push(`DB Chyba: ${meetingError.message}`)
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

        if (successCount === 0) {
            if (errors.length > 0) {
                return { success: false, message: `Chyba (načteno ${debugLinesRead} řádků): ${errors[0]}` }
            } else {
                // Detailed debug message
                const usageHint = debugLinesRead > 0
                    ? `První řádek byl: "${firstLineContent}". Očekáváno: "RRRR-MM-DD Název"`
                    : "Soubor se zdá být prázdný."

                return {
                    success: false,
                    message: `Nenačteno. ${usageHint}`
                }
            }
        } else {
            const errorMsg = errors.length > 0 ? ` (přeskočeno ${errors.length} chyb)` : ''
            return { success: true, message: `Úspěšně nahráno ${successCount} schůzek${errorMsg}` }
        }

    } catch (error: unknown) {
        console.error('Import Critical Error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Neznámá chyba'
        return { success: false, message: `Kritická chyba: ${errorMessage}` }
    }
}
