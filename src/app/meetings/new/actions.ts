
'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createMeeting(formData: FormData) {
    const supabase = await createClient()

    const title = formData.get('title') as string
    let dateStr = formData.get('date') as string
    // Ensure seconds are included for valid ISO-like string if missing
    if (dateStr.split(':').length === 2) {
        dateStr += ':00';
    }
    // Convert to ISO string to satisfy Supabase timestamptz
    // Note: This treats the input time as UTC because server is likely UTC. 
    // Ideally we should handle Timezones better but this fixes the format error.
    const date = new Date(dateStr).toISOString();

    const agenda = formData.get('agenda') as string

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data, error } = await supabase
        .from('meetings')
        .insert([
            {
                title,
                date, // now strictly ISO
                agenda,
                organizer_id: user.id,
            },
        ])
        .select()
        .single()

    if (error) {
        console.error('Error creating meeting:', error)
        redirect(`/meetings/new?error=${encodeURIComponent(error.message)}`)
    }

    // Also add the organizer as a participant automatically
    await supabase.from('participants').insert({
        meeting_id: data.id,
        user_id: user.id
    })

    revalidatePath('/dashboard')
    redirect('/dashboard')
}
