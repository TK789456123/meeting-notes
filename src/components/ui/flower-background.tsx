
'use client'

import styles from './flower-background.module.css'
import { useEffect, useState } from 'react'

export function FlowerBackground() {
    const [flowers, setFlowers] = useState<{ id: number; left: number; duration: number; delay: number }[]>([])

    useEffect(() => {
        // Generate random flowers
        const newFlowers = Array.from({ length: 20 }).map((_, i) => ({
            id: i,
            left: Math.random() * 100, // Random horizontal position
            duration: 10 + Math.random() * 20, // Random fall duration (10-30s)
            delay: Math.random() * 10, // Random start delay
        }))
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFlowers(newFlowers)
    }, [])

    return (
        <div className={styles.container}>
            {flowers.map((flower) => (
                <div
                    key={flower.id}
                    className={styles.flower}
                    style={{
                        left: `${flower.left}%`,
                        animationDuration: `${flower.duration}s`,
                        animationDelay: `${flower.delay}s`,
                    }}
                >
                    🌸
                </div>
            ))}
        </div>
    )
}
