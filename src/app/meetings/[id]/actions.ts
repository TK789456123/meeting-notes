
'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateNotes(meetingId: string, formData: FormData) {
    const supabase = await createClient()
    const notes = formData.get('notes') as string

    await supabase
        .from('meetings')
        .update({ notes })
        .eq('id', meetingId)

    revalidatePath(`/meetings/${meetingId}`)
}

export async function addActionItem(meetingId: string, formData: FormData) {
    const supabase = await createClient()
    const description = formData.get('description') as string
    const assigneeId = formData.get('assignee_id') as string
    const deadline = formData.get('deadline') as string

    await supabase
        .from('action_items')
        .insert({
            meeting_id: meetingId,
            description,
            assignee_id: assigneeId || null,
            deadline: deadline || null,
        })

    revalidatePath(`/meetings/${meetingId}`)
}

export async function toggleActionItem(actionItemId: string, isCompleted: boolean, meetingId: string) {
    const supabase = await createClient()

    await supabase
        .from('action_items')
        .update({ is_completed: isCompleted })
        .eq('id', actionItemId)

    revalidatePath(`/meetings/${meetingId}`)
}

export async function addParticipant(meetingId: string, formData: FormData) {
    const email = formData.get('email') as string
    const adminAuthClient = createAdminClient()

    // List users to find the ID (limit to 1 for efficiency)
    // Note: listUsers is an admin function.
    const { data: { users }, error } = await adminAuthClient.auth.admin.listUsers()

    // Simple in-memory filter for MVP (for production, use exact query if available or separate table)
    const userToAdd = users.find(u => u.email === email)

    if (!userToAdd) {
        // Handle user not found (in real app, maybe invite?)
        // return { error: 'User not found' }
        redirect(`/meetings/${meetingId}?error=User not found`)
    }

    const supabase = await createClient()
    await supabase
        .from('participants')
        .insert({
            meeting_id: meetingId,
            user_id: userToAdd.id
        })

    revalidatePath(`/meetings/${meetingId}`)
}
