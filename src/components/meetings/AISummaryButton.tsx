'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { generateSummary } from '@/app/meetings/[id]/actions'

export default function AISummaryButton({ meetingId, notesContent }: { meetingId: string, notesContent: string }) {
    const [isGenerating, setIsGenerating] = useState(false)

    const handleGenerate = async () => {
        if (!notesContent) {
            alert('Nejprve napište nějaké poznámky.')
            return
        }

        setIsGenerating(true)
        try {
            const result = await generateSummary(meetingId, notesContent)
            if (result.count === 0) {
                alert('AI nenašlo žádné nové úkoly.\n\nTip: Začněte řádek s "Todo:", "Úkol:" nebo "- [ ]", aby je AI rozpoznalo.')
            } else {
                alert(`AI úspěšně vytvořilo ${result.count} úkolů!`)
            }
        } catch (error) {
            console.error(error)
            alert('Chyba při generování shrnutí.')
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <button
            onClick={handleGenerate}
            disabled={isGenerating}
            type="button"
            className="secondaryButton"
            style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(200,200,255,0.1) 100%)',
                border: '1px solid var(--secondary)',
                color: 'var(--secondary)',
                gap: '0.5rem',
                padding: '0.6rem 1rem',
                fontSize: '0.9rem',
                cursor: isGenerating ? 'not-allowed' : 'pointer'
            }}
        >
            {isGenerating ? (
                <Loader2 className="animate-spin" size={16} />
            ) : (
                <Sparkles size={16} />
            )}
            {isGenerating ? 'Analyzuji...' : 'AI Shrnutí'}
        </button>
    )
}
