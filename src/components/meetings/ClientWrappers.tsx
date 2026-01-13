'use client'

import dynamic from 'next/dynamic'
import styles from '@/app/meetings/[id]/meeting.module.css'

export const DynamicExportButtons = dynamic(() => import('@/components/meetings/ExportButtons'), {
    ssr: false,
    loading: () => <button className={styles.buttonDisabled}>Načítám export...</button>
})

export const DynamicShareMeetingButton = dynamic(() => import('@/components/meetings/ShareMeetingButton'), {
    ssr: false,
    loading: () => <button className={styles.buttonDisabled}>...</button>
})

export const DynamicAudioRecorder = dynamic(() => import('@/components/meetings/AudioRecorder'), {
    ssr: false,
    loading: () => <div className={styles.recorderLoading}>Načítám nahrávání...</div>
})
