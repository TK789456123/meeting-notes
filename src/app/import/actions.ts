'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function importMeetings(formData: FormData) {
    let shouldRedirect = false

    try {
        const file = formData.get('file') as File
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user || !file) {
            return
        }

        const text = await file.text()
        const lines = text.split('\n').filter(line => line.trim() !== '')

        for (const line of lines) {
            // Expected format: Date Title
            // Example: 2025-01-20 Weekly Sync
            const parts = line.trim().split(' ')
            if (parts.length < 2) continue

            const dateStr = parts[0]
            const title = parts.slice(1).join(' ')

            // Try to parse date
            const date = new Date(dateStr)
            if (isNaN(date.getTime())) continue

            // Add default time if not present (e.g. 9:00 AM)
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
                console.error('Import Error (Meeting):', meetingError)
                continue
            }

            if (meeting) {
                const { error: participantError } = await supabase.from('participants').insert({
                    meeting_id: meeting.id,
                    user_id: user.id
                })

                if (participantError) {
                    console.error('Import Error (Participant):', participantError)
                }
            }
        }

        shouldRedirect = true

    } catch (e) {
        console.error('Import Critical Error:', e)
        // Swallow error to prevent crash
    }

    if (shouldRedirect) {
        revalidatePath('/dashboard')
        redirect('/dashboard?message=Import_dokoncen')
    }
}
