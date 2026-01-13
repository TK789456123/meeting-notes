
// SUPER MINIMAL DEBUG - HELLO WORLD (NO SUPABASE)
export const dynamic = 'force-dynamic'

export default async function MeetingPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;

    return (
        <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
            <h1 style={{ color: 'blue' }}>🔵 HELLO VERCEL 🔵</h1>
            <p>Meeting ID: {params.id}</p>
            <hr />
            <p><strong>Status:</strong> Next.js is running.</p>
            <p><strong>Database:</strong> Disconnected (Safe Mode).</p>
            <p>If you see this, the server is fine. The error is likely in Supabase connection or Environment Variables.</p>
        </div>
    )
}
