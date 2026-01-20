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

    // Use Admin Client to bypass RLS for adding participants
    // This allows the organizer (or any allowed user) to add anyone efficiently
    const { createAdminClient } = await import('@/utils/supabase/server')

    // Safety check for admin client creation
    let supabase;
    try {
        supabase = await createAdminClient()
    } catch (e) {
        console.error("Failed to create admin client, falling back", e)
        supabase = await createClient()
    }

    // Use RPC function defined in Supabase to securely find user and insert
    const { error } = await supabase.rpc('add_meeting_participant', {
        meeting_id_arg: meetingId,
        email_arg: email
    })

    if (error) {
        console.error('Error adding participant:', error)
        let errorMessage = error.message

        if (errorMessage.includes('User not found')) {
            errorMessage = `Uživatel s emailem "${email}" nebyl nalezen. Musí být registrován.`
        } else if (errorMessage.includes('Access denied')) {
            errorMessage = 'Nemáte oprávnění přidávat účastníky.'
        } else if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
            errorMessage = 'Tento uživatel už je na seznamu.'
        }

        return { success: false, message: errorMessage }
    }

    revalidatePath(`/meetings/${meetingId}`)
    return { success: true, message: 'Účastník byl úspěšně přidán.' }
}

export async function updateColor(meetingId: string, color: string) {
    const supabase = await createClient()
    await supabase.from('meetings').update({ color }).eq('id', meetingId)
    revalidatePath(`/meetings/${meetingId}`)
    revalidatePath('/dashboard')
}

export async function generateShareToken(meetingId: string) {
    const supabase = await createClient()

    // Check if token exists
    const { data: meeting } = await supabase
        .from('meetings')
        .select('share_token')
        .eq('id', meetingId)
        .single()

    if (meeting?.share_token) {
        return meeting.share_token
    }

    // Generate new token
    const token = crypto.randomUUID()

    const { error } = await supabase
        .from('meetings')
        .update({ share_token: token })
        .eq('id', meetingId)

    if (error) {
        console.error('Error generating share token:', error)
        throw new Error('Failed to generate share link')
    }

    revalidatePath(`/meetings/${meetingId}`)
    return token
}

export async function saveAudio(meetingId: string, formData: FormData) {
    const supabase = await createClient()
    const file = formData.get('audio') as File

    if (!file) {
        throw new Error('No audio file provided')
    }

    // specific filename structure
    const filename = `${meetingId}/${Date.now()}.webm`

    const { error: uploadError } = await supabase
        .storage
        .from('meeting-audio')
        .upload(filename, file, {
            contentType: 'audio/webm; codecs=opus',
            upsert: true
        })

    if (uploadError) {
        console.error('Upload Error:', uploadError)
        throw new Error('Failed to upload audio')
    }

    // Get Public URL
    const { data: { publicUrl } } = supabase
        .storage
        .from('meeting-audio')
        .getPublicUrl(filename)

    // Save to DB
    const { error: dbError } = await supabase
        .from('meetings')
        .update({ audio_url: publicUrl })
        .eq('id', meetingId)

    if (dbError) {
        console.error('DB Error:', dbError)
        throw new Error('Failed to save audio URL to database')
    }

    revalidatePath(`/meetings/${meetingId}`)
    return publicUrl
}

export async function generateSummary(meetingId: string, notesContent: string) {
    const supabase = await createClient()

    // Relaxed AI Logic
    const lines = notesContent.split('\n')
    let actionItemsToCreate: { meeting_id: string; description: string; is_completed: boolean }[] = []

    const strictPrefixes = ['todo:', 'úkol:', 'ukol:', '- [ ]', '- []']

    // First pass: Strict
    for (const line of lines) {
        const trimmed = line.trim()
        const lower = trimmed.toLowerCase()

        if (strictPrefixes.some(p => lower.startsWith(p))) {
            let description = trimmed
            for (const p of strictPrefixes) {
                if (lower.startsWith(p)) {
                    description = description.slice(p.length).trim()
                    break
                }
            }
            if (description) {
                actionItemsToCreate.push({ meeting_id: meetingId, description, is_completed: false })
            }
        }
    }

    // Second pass: Loose (fallback)
    if (actionItemsToCreate.length === 0) {
        for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed) continue
            if (trimmed.startsWith('#')) continue // Headers

            // Dash or star
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                actionItemsToCreate.push({
                    meeting_id: meetingId,
                    description: trimmed.slice(1).trim(),
                    is_completed: false
                })
                continue
            }

            // Short sentence
            if (trimmed.length < 150 && trimmed.length > 5) {
                actionItemsToCreate.push({
                    meeting_id: meetingId,
                    description: trimmed,
                    is_completed: false
                })
            }
        }
    }

    if (actionItemsToCreate.length > 0) {
        const { error } = await supabase
            .from('action_items')
            .insert(actionItemsToCreate)

        if (error) {
            console.error('Error creating auto action items:', error)
            throw new Error('Failed to create action items')
        }
    }

    revalidatePath(`/meetings/${meetingId}`)
    return { success: true, count: actionItemsToCreate.length }
}
