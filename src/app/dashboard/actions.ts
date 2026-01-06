'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteMeeting(meetingId: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('meetings').delete().eq('id', meetingId)

    if (error) {
        throw new Error('Failed to delete meeting: ' + error.message)
    }

    revalidatePath('/dashboard')
}
