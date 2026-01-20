'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleActionItem(actionItemId: string, isCompleted: boolean) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('action_items')
        .update({ is_completed: isCompleted })
        .eq('id', actionItemId)

    if (error) {
        throw new Error('Failed to update action item: ' + error.message)
    }

    revalidatePath('/actions')
    revalidatePath('/dashboard') 
    // We revalidate dashboard too just in case, though usually items are inside meetings
}
