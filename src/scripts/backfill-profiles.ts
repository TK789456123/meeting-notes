
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load env vars manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        process.env[key.trim()] = value.trim();
    }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function backfill() {
    console.log('Starting backfill of profiles...');

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError);
        return;
    }

    console.log(`Found ${users.length} users in Auth.`);

    let createdCount = 0;
    let existingCount = 0;
    let errorCount = 0;

    for (const user of users) {
        // Check if profile exists
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

        if (profile) {
            existingCount++;
            continue;
        }

        console.log(`Creating profile for ${user.email} (${user.id})...`);

        const { error: insertError } = await supabase
            .from('profiles')
            .insert({
                id: user.id,
                full_name: user.user_metadata?.full_name || user.email,
                avatar_url: user.user_metadata?.avatar_url || '',
                updated_at: new Date().toISOString()
            });

        if (insertError) {
            console.error(`Failed to create profile for ${user.email}:`, insertError);
            errorCount++;
        } else {
            createdCount++;
        }
    }

    console.log('Backfill complete!');
    console.log(`Created: ${createdCount}`);
    console.log(`Existing: ${existingCount}`);
    console.log(`Errors: ${errorCount}`);
}

backfill();
