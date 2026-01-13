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
