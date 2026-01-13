
import Navbar from '@/components/layout/Navbar'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <section>
            <Navbar />
            <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                {children}
            </main>
        </section>
    )
}
