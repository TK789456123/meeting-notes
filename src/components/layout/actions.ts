'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadAvatar(formData: FormData) {
    const supabase = await createClient()

    // 1. Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
        return { success: false, message: 'Uživatel není přihlášen' }
    }

    const file = formData.get('avatar') as File
    if (!file) {
        return { success: false, message: 'Žádný soubor nebyl nahrán' }
    }

    // 2. Upload to Storage
    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}/avatar.${fileExt}`

    // Upsert to overwrite existing
    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

    if (uploadError) {
        console.error('Upload error:', uploadError)
        return { success: false, message: 'Chyba při nahrávání obrázku' }
    }

    // 3. Get Public URL
    const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

    // 4. Update Profile
    // Force refresh the public URL query param to bypass cache if needed, 
    // though Supabase uses unique paths usually. 
    // Since we overwrite 'avatar.ext', we might need cache busting.
    const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`

    const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
            id: user.id,
            avatar_url: urlWithTimestamp,
            updated_at: new Date().toISOString()
        })
        .select()

    if (updateError) {
        console.error('Profile update error:', updateError)
        return { success: false, message: 'Chyba při aktualizaci profilu' }
    }

    revalidatePath('/', 'layout')
    return { success: true, message: 'Profilový obrázek byl změněn', avatarUrl: urlWithTimestamp }
}
