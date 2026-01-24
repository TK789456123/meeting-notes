'use client'

import { Trash2, FileText, X } from 'lucide-react'
import styles from './bulk-actions.module.css'

interface BulkActionsBarProps {
    selectedCount: number
    onClearSelection: () => void
    onDelete: () => void
    onExport: () => void
    isDeleting?: boolean
}

export default function BulkActionsBar({
    selectedCount,
    onClearSelection,
    onDelete,
    onExport,
    isDeleting = false
}: BulkActionsBarProps) {
    if (selectedCount === 0) return null

    return (
        <div className={styles.container}>
            <div className={styles.bar}>
                <div className={styles.left}>
                    <button onClick={onClearSelection} className={styles.closeButton}>
                        <X size={20} />
                    </button>
                    <span className={styles.count}>{selectedCount} vybráno</span>
                </div>

                <div className={styles.actions}>
                    <button onClick={onExport} className={styles.actionButton}>
                        <FileText size={18} />
                        Export PDF
                    </button>

                    <div className={styles.separator} />

                    <button
                        onClick={onDelete}
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Mazání...' : (
                            <>
                                <Trash2 size={18} />
                                Smazat
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
