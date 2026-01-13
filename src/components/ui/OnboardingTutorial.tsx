'use client'

import { useState, useEffect } from 'react'
import styles from './onboarding-tutorial.module.css'
import { completeTutorial } from '@/app/dashboard/actions'

interface OnboardingTutorialProps {
    userId: string
}

const STEPS = [
    {
        title: "Vítejte v MeetingNotes! 👋",
        description: "Rád bych tě provedl rychlou prohlídkou, abys věděl, co všechno tahle aplikace umí.",
        icon: "🚀"
    },
    {
        title: "Vše na jednom místě",
        description: "Tady na Dashboardu uvidíš všechny své naplánované schůzky. Můžeš je filtrovat pomocí lupy nahoře.",
        icon: "📊"
    },
    {
        title: "Plánování nových schůzek",
        description: "Tlačítkem '+ Nová schůzka' vytvoříš záznam. Můžeš přidat agendu, pozvat lidi a nastavit čas.",
        icon: "📅"
    },
    {
        title: "Barvičky a Exporty",
        description: "V detailu schůzky si můžeš měnit barvu štítků, stahovat zápis do PDF nebo si ho uložit do kalendáře.",
        icon: "🎨"
    },
    {
        title: "To je vše!",
        description: "Užij si plánování. Kdyby něco, roboti jsou tu, aby pomohli! 🤖",
        icon: "✨"
    }
]

export default function OnboardingTutorial({ userId }: OnboardingTutorialProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [isVisible, setIsVisible] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleNext = async () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1)
        } else {
            await finishTutorial()
        }
    }

    const finishTutorial = async () => {
        setIsVisible(false)
        setCurrentStep(0) // Reset for next time
        localStorage.setItem('meeting_notes_tutorial_seen', 'true')
        try {
            await completeTutorial(userId)
        } catch (e) {
            // ignore
        }
    }

    if (!mounted) return null

    const step = STEPS[currentStep]

    return (
        <>
            <button
                onClick={() => setIsVisible(true)}
                className={styles.triggerButton}
            >
                Tutoriál
            </button>

            {isVisible && (
                <div className={styles.overlay}>
                    <div className={styles.modal}>

                        <span className={styles.stepImage} role="img" aria-label="icon">
                            {step.icon}
                        </span>

                        <h2 className={styles.title}>{step.title}</h2>
                        <p className={styles.description}>{step.description}</p>

                        <div className={styles.dots}>
                            {STEPS.map((_, index) => (
                                <div
                                    key={index}
                                    className={`${styles.dot} ${index === currentStep ? styles.activeDot : ''}`}
                                />
                            ))}
                        </div>

                        <div className={styles.footer}>
                            <button onClick={finishTutorial} className={styles.skipButton}>
                                {currentStep === STEPS.length - 1 ? '' : 'Přeskočit'}
                            </button>
                            <button onClick={handleNext} className={styles.nextButton}>
                                {currentStep === STEPS.length - 1 ? 'Začít!' : 'Pokračovat'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
