
'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createMeeting(formData: FormData) {
    const supabase = await createClient()

    const title = formData.get('title') as string
    const date = formData.get('date') as string
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
                date,
                agenda,
                organizer_id: user.id,
            },
        ])
        .select()
        .single()

    if (error) {
        console.error('Error creating meeting:', error)
        redirect('/meetings/new?error=Could not create meeting')
    }

    // Also add the organizer as a participant automatically
    await supabase.from('participants').insert({
        meeting_id: data.id,
        user_id: user.id
    })

    revalidatePath('/dashboard')
    redirect(`/meetings/${data.id}`)
}
