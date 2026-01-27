import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    // 1. Create Supabase client
    const supabase = await createClient()

    try {
        // 2. Simple query to "wake up" the database
        // We select just 1 record from 'meetings'. It doesn't matter if it returns data or not,
        // the request itself keeps the DB active.
        const { data, error } = await supabase.from('meetings').select('id').limit(1)

        if (error) {
            throw error
        }

        // 3. Return success response
        return NextResponse.json(
            { status: 'ok', message: 'Database is active', timestamp: new Date().toISOString() },
            { status: 200 }
        )
    } catch (error) {
        console.error('Keep-alive check failed:', error)
        return NextResponse.json(
            { status: 'error', message: 'Database check failed' },
            { status: 500 }
        )
    }
}
