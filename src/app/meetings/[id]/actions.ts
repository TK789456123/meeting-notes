'use server'

import { createClient } from '@/utils/supabase/server'
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

    // Insert directly using standard client (RLS must be fixed via SQL script)
    const { error } = await supabase
        .from('action_items')
        .insert({
            meeting_id: meetingId,
            description,
            assignee_id: assigneeId || null,
            deadline: deadline || null,
        })

    if (error) {
        console.error('Error adding action item:', error)
        redirect(`/meetings/${meetingId}?error=${encodeURIComponent('Nepodařilo se přidat úkol: ' + error.message)}`)
    }

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
    const supabase = await createClient()

    // Use RPC function defined in Supabase to securely find user and insert
    // This removes the need for SUPABASE_SERVICE_ROLE_KEY environment variable
    const { error } = await supabase.rpc('add_meeting_participant', {
        meeting_id_arg: meetingId,
        email_arg: email
    })

    if (error) {
        // Translate common errors from the database function
        let errorMessage = error.message
        if (errorMessage.includes('User not found')) {
            errorMessage = `Uživatel s emailem ${email} nebyl nalezen.`
        } else if (errorMessage.includes('Access denied')) {
            errorMessage = 'Pouze organizátor může přidávat účastníky.'
        } else if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
            errorMessage = 'Tento uživatel už je účastníkem.'
        }

        console.error('Error adding participant:', error)
        redirect(`/meetings/${meetingId}?error=${encodeURIComponent(errorMessage)}`)
    }

    revalidatePath(`/meetings/${meetingId}`)
}

export async function updateColor(meetingId: string, color: string) {
    const supabase = await createClient()
    await supabase.from('meetings').update({ color }).eq('id', meetingId)
    revalidatePath(`/meetings/${meetingId}`)
    revalidatePath('/dashboard')
}
