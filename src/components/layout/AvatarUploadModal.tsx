'use client'

import { useState, useRef } from 'react'
import { uploadAvatar } from './actions'
import styles from './AvatarUploadModal.module.css'
import { X, Upload, Image as ImageIcon } from 'lucide-react'

interface AvatarUploadModalProps {
    isOpen: boolean
    onClose: () => void
    currentAvatarUrl?: string | null
    email: string
}

export default function AvatarUploadModal({ isOpen, onClose, currentAvatarUrl, email }: AvatarUploadModalProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    if (!isOpen) return null

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setSelectedFile(file)
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const handleUpload = async () => {
        if (!selectedFile) return

        setIsUploading(true)
        const formData = new FormData()
        formData.append('avatar', selectedFile)

        try {
            const result = await uploadAvatar(formData)
            if (result.success) {
                onClose()
                // Force reload or state update handled by server action revalidate
                // But for better UX might want to notify parent
            } else {
                alert(result.message)
            }
        } catch (error) {
            console.error(error)
            alert('Chyba při nahrávání')
        } finally {
            setIsUploading(false)
        }
    }

    const triggerFileSelect = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>
                    <X size={20} />
                </button>

                <h2 className={styles.title}>Změnit profilovku</h2>

                <div className={styles.previewArea}>
                    {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className={styles.previewImage} />
                    ) : currentAvatarUrl ? (
                        <img src={currentAvatarUrl} alt="Current" className={styles.previewImage} />
                    ) : (
                        <div className={styles.placeholderLarge}>
                            {email.slice(0, 2).toUpperCase()}
                        </div>
                    )}
                </div>

                <div className={styles.actions}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                        accept="image/*"
                    />

                    {!selectedFile ? (
                        <button className={styles.selectButton} onClick={triggerFileSelect}>
                            <ImageIcon size={18} />
                            Vybrat fotku
                        </button>
                    ) : (
                        <div className={styles.uploadRow}>
                            <button className={styles.changeButton} onClick={triggerFileSelect}>
                                Změnit
                            </button>
                            <button
                                className={styles.uploadButton}
                                onClick={handleUpload}
                                disabled={isUploading}
                            >
                                {isUploading ? 'Nahrávám...' : (
                                    <>
                                        <Upload size={18} />
                                        Uložit
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
