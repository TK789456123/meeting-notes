'use client'

import { Trash2 } from 'lucide-react'
import { deleteMeeting } from '@/app/dashboard/actions'
import { useTransition } from 'react'

export default function DeleteMeetingButton({ id }: { id: string }) {
    const [isPending, startTransition] = useTransition()

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (window.confirm('Opravdu chcete smazat tuto schůzku? Tato akce je nevratná.')) {
            startTransition(async () => {
                await deleteMeeting(id)
            })
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            title="Smazat schůzku"
            style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(255, 50, 50, 0.1)',
                border: '1px solid rgba(255, 50, 50, 0.2)',
                borderRadius: '8px',
                padding: '6px',
                color: '#ef4444',
                cursor: 'pointer',
                zIndex: 10,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 50, 50, 0.2)'
                e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 50, 50, 0.1)'
                e.currentTarget.style.transform = 'scale(1)'
            }}
        >
            <Trash2 size={16} />
        </button>
    )
}
