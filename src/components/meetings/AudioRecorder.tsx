'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Save, Trash2, Play, Pause } from 'lucide-react'
import { saveAudio } from '@/app/meetings/[id]/actions'
import styles from './audio-recorder.module.css'

export default function AudioRecorder({ meetingId }: { meetingId: string }) {
    const [status, setStatus] = useState<'idle' | 'recording' | 'review' | 'uploading'>('idle')
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [duration, setDuration] = useState(0)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [])

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const recorder = new MediaRecorder(stream)

            mediaRecorderRef.current = recorder
            chunksRef.current = []

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
                setAudioBlob(blob)
                setStatus('review')
                stream.getTracks().forEach(track => track.stop()) // release mic
            }

            recorder.start()
            setStatus('recording')
            setDuration(0)

            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1)
            }, 1000)

        } catch (err) {
            console.error('Mic access denied:', err)
            alert('Pro nahrávání zvuku musíte povolit přístup k mikrofonu.')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && status === 'recording') {
            mediaRecorderRef.current.stop()
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }

    const discardRecording = () => {
        setAudioBlob(null)
        setStatus('idle')
        setDuration(0)
    }

    const handleSave = async () => {
        if (!audioBlob) return

        setStatus('uploading')
        try {
            const formData = new FormData()
            formData.append('audio', audioBlob, 'recording.webm')

            await saveAudio(meetingId, formData)
            setStatus('idle') // Reset or show success? Resetting to allow new recording.
            setAudioBlob(null)
            setDuration(0)
        } catch (error) {
            console.error('Save failed:', error)
            alert('Nepodařilo se uložit nahrávku.')
            setStatus('review')
        }
    }

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60)
        const s = sec % 60
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    if (status === 'uploading') {
        return <div className={styles.container}>Ukládám nahrávku... ⏳</div>
    }

    if (status === 'review') {
        return (
            <div className={styles.container}>
                <div className={styles.reviewControls}>
                    <audio
                        src={audioBlob ? URL.createObjectURL(audioBlob) : ''}
                        controls
                        className={styles.audioPlayer}
                    />
                    <button onClick={handleSave} className={styles.saveButton} title="Uložit">
                        <Save size={18} /> Uložit
                    </button>
                    <button onClick={discardRecording} className={styles.discardButton} title="Zahodit">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        )
    }

    if (status === 'recording') {
        return (
            <div className={`${styles.container} ${styles.recording}`}>
                <button onClick={stopRecording} className={styles.stopButton}>
                    <Square size={16} fill="white" />
                </button>
                <span className={styles.timer}>REC {formatTime(duration)}</span>
                <span style={{ fontSize: '0.8rem', color: '#e53e3e', marginLeft: 'auto', fontWeight: '600' }}>
                    Nahrávání...
                </span>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <button onClick={startRecording} className={styles.recordButton}>
                <Mic size={18} />
                Nahrát zvuk
            </button>
            <span style={{ fontSize: '0.9rem', color: '#718096' }}>
                Žádný záznam
            </span>
        </div>
    )
}
const [status, setStatus] = useState<'idle' | 'recording' | 'review' | 'uploading' | 'transcribing'>('idle')
const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
const [duration, setDuration] = useState(0)
const [transcription, setTranscription] = useState<string>('')

const mediaRecorderRef = useRef<MediaRecorder | null>(null)
const chunksRef = useRef<Blob[]>([])
const timerRef = useRef<NodeJS.Timeout | null>(null)

useEffect(() => {
    return () => {
        if (timerRef.current) clearInterval(timerRef.current)
    }
}, [])

const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const recorder = new MediaRecorder(stream)

        mediaRecorderRef.current = recorder
        chunksRef.current = []

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data)
        }

        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
            setAudioBlob(blob)
            setStatus('review')
            stream.getTracks().forEach(track => track.stop()) // release mic
        }

        recorder.start()
        setStatus('recording')
        setDuration(0)
        setTranscription('')

        timerRef.current = setInterval(() => {
            setDuration(prev => prev + 1)
        }, 1000)

    } catch (err) {
        console.error('Mic access denied:', err)
        alert('Pro nahrávání zvuku musíte povolit přístup k mikrofonu.')
    }
}

const stopRecording = () => {
    if (mediaRecorderRef.current && status === 'recording') {
        mediaRecorderRef.current.stop()
        if (timerRef.current) clearInterval(timerRef.current)
    }
}

const discardRecording = () => {
    setAudioBlob(null)
    setStatus('idle')
    setDuration(0)
    setTranscription('')
}

const handleSave = async () => {
    if (!audioBlob) return

    setStatus('uploading')
    try {
        const formData = new FormData()
        formData.append('audio', audioBlob, 'recording.webm')

        await saveAudio(meetingId, formData)
        setStatus('idle')
        setAudioBlob(null)
        setDuration(0)
        setTranscription('')
    } catch (error) {
        console.error('Save failed:', error)
        alert('Nepodařilo se uložit nahrávku.')
        setStatus('review')
    }
}

const handleTranscribe = async () => {
    if (!audioBlob) return

    setStatus('transcribing')
    try {
        const formData = new FormData()
        formData.append('audio', audioBlob, 'audio.webm')

        const result = await transcribeAudio(meetingId, formData)
        setTranscription(result.text)
        setStatus('review')
    } catch (error) {
        console.error('Transcription failed:', error)
        alert('Přepis se nezdařil. Zkontrolujte API klíč.')
        setStatus('review')
    }
}

const handleAppendToNotes = async () => {
    if (!transcription) return

    // This is a bit tricky since we don't have the current notes state here.
    // But we can append to the end using a specialized server action or just trust the user to copy-paste.
    // For better UX, let's copy to clipboard and notify.
    try {
        await navigator.clipboard.writeText(transcription)
        alert('Text zkopírován do schránky! Nyní ho můžete vložit do zápisu.')
    } catch (e) {
        console.error('Copy failed', e)
    }
}

const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
}

if (status === 'uploading') return <div className={styles.container}>Ukládám nahrávku... ⏳</div>
if (status === 'transcribing') return <div className={styles.container}>Přepisuji zvuk pomocí AI... 🤖💭</div>

if (status === 'review') {
    return (
        <div className={styles.container} style={{ flexDirection: 'column', gap: '1rem', alignItems: 'stretch' }}>
            <div className={styles.reviewControls}>
                <audio
                    src={audioBlob ? URL.createObjectURL(audioBlob) : ''}
                    controls
                    className={styles.audioPlayer}
                />
                <div className={styles.actionButtons}>
                    <button onClick={handleSave} className={styles.saveButton} title="Uložit nahrávku">
                        <Save size={18} />
                    </button>
                    <button onClick={discardRecording} className={styles.discardButton} title="Zahodit">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {!transcription && (
                <button onClick={handleTranscribe} className={styles.secondaryButton} style={{ gap: '0.5rem', justifyContent: 'center' }}>
                    <FileText size={18} />
                    Přepsat do textu (AI)
                </button>
            )}

            {transcription && (
                <div className={styles.transcriptionBox}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#718096' }}>Přepis:</h4>
                    <textarea
                        className={styles.transcriptionArea}
                        value={transcription}
                        readOnly
                    />
                    <button onClick={handleAppendToNotes} className={styles.copyButton}>
                        <ArrowDownCircle size={16} />
                        Zkopírovat text
                    </button>
                </div>
            )}
        </div>
    )
}

if (status === 'recording') {
    return (
        <div className={`${styles.container} ${styles.recording}`}>
            <button onClick={stopRecording} className={styles.stopButton}>
                <Square size={16} fill="white" />
            </button>
            <span className={styles.timer}>REC {formatTime(duration)}</span>
            <span style={{ fontSize: '0.8rem', color: '#e53e3e', marginLeft: 'auto', fontWeight: '600' }}>
                Nahrávání...
            </span>
        </div>
    )
}

return (
    <div className={styles.container}>
        <button onClick={startRecording} className={styles.recordButton}>
            <Mic size={18} />
            Nahrát zvuk
        </button>
        <span style={{ fontSize: '0.9rem', color: '#718096' }}>
            Žádný záznam
        </span>
    </div>
)
}

