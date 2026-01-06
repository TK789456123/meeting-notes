
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
    const supabase = await createClient() // Logged in user client
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // 1. Verify Permission (Organizer OR Participant)
    // Fetch meeting organizer and check if user is participant
    const { data: meeting } = await supabase
        .from('meetings')
        .select('organizer_id')
        .eq('id', meetingId)
        .single()

    const { data: participation } = await supabase
        .from('participants')
        .select('user_id')
        .eq('meeting_id', meetingId)
        .eq('user_id', user.id)
        .single()

    const isOrganizer = meeting?.organizer_id === user.id
    const isParticipant = !!participation

    if (!isOrganizer && !isParticipant) {
        redirect(`/meetings/${meetingId}?error=${encodeURIComponent('Nemáte oprávnění přidávat úkoly.')}`)
    }

    // 2. Insert Action Item (Admin Client)
    const adminSupabase = createAdminClient()
    const description = formData.get('description') as string
    const assigneeId = formData.get('assignee_id') as string
    const deadline = formData.get('deadline') as string

    const { error } = await adminSupabase
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
    const adminAuthClient = createAdminClient()

    const { data: { users }, error: listError } = await adminAuthClient.auth.admin.listUsers()

    if (listError) {
        redirect(`/meetings/${meetingId}?error=${encodeURIComponent('Chyba při hledání uživatele.')}`)
    }

    const userToAdd = users.find(u => u.email === email)

    if (!userToAdd) {
        redirect(`/meetings/${meetingId}?error=${encodeURIComponent(`Uživatel s emailem ${email} nebyl nalezen. Musí se nejprve registrovat.`)}`)
    }

    const supabase = await createClient()
    const { error: insertError } = await supabase
        .from('participants')
        .insert({
            meeting_id: meetingId,
            user_id: userToAdd.id
        })

    if (insertError) {
        // Handle duplicate key error nicely
        if (insertError.code === '23505') { // Unique violation
            redirect(`/meetings/${meetingId}?error=${encodeURIComponent('Tento uživatel už je účastníkem.')}`)
        }
        redirect(`/meetings/${meetingId}?error=${encodeURIComponent('Nepodařilo se přidat účastníka: ' + insertError.message)}`)
    }

    revalidatePath(`/meetings/${meetingId}`)
}
