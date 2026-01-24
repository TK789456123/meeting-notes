'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteMeeting(meetingId: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('meetings').delete().eq('id', meetingId)

    if (error) {
        throw new Error('Failed to delete meeting: ' + error.message)
    }

    revalidatePath('/dashboard')
}

export async function completeTutorial(userId: string) {
    const supabase = await createAdminClient()

    // Use upsert to create profile if it doesn't exist (e.g., old users from before the trigger was fixed)
    await supabase.from('profiles').upsert({
        id: userId,
        has_seen_tutorial: true,
        updated_at: new Date().toISOString()
    }, {
        onConflict: 'id'
    })

    revalidatePath('/dashboard')
}

export async function bulkDeleteMeetings(meetingIds: string[]) {
    const supabase = await createClient()

    // RLS should handle ownership check, but good to be safe
    const { error } = await supabase
        .from('meetings')
        .delete()
        .in('id', meetingIds)

    if (error) {
        throw new Error('Failed to delete meetings: ' + error.message)
    }

    revalidatePath('/dashboard')
}
