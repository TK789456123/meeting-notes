'use client'

import { useState, useEffect, useRef } from 'react'
import styles from './onboarding-tutorial.module.css'
import { completeTutorial } from '@/app/dashboard/actions'
import { Volume2, VolumeX, Play } from 'lucide-react'

interface OnboardingTutorialProps {
    userId: string
}

const STEPS = [
    {
        title: "Vítejte!",
        description: "Ahoj! Jsem tvoje průvodkyně. Rád bych tě provedla rychlou prohlídkou, abys věděl, co všechno tahle aplikace umí.",
        icon: "👋"
    },
    {
        title: "Dashboard",
        description: "Tady na Dashboardu uvidíš všechny své naplánované schůzky. Je to tvůj hlavní přehled.",
        icon: "📊"
    },
    {
        title: "Nová schůzka",
        description: "Tlačítkem '+ Nová schůzka' vytvoříš záznam. Můžeš přidat agendu a pozvat kolegy.",
        icon: "📅"
    },
    {
        title: "Exporty",
        description: "Zápisy si můžeš uložit do PDF nebo přímo do kalendáře. Vše na jedno kliknutí.",
        icon: "💾"
    },
    {
        title: "Jdeme na to?",
        description: "To je pro začátek vše. Kdyby něco, jsem tu! Užij si práci.",
        icon: "🚀"
    }
]

export default function OnboardingTutorial({ userId }: OnboardingTutorialProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [isVisible, setIsVisible] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const hasSpokenRef = useRef<boolean>(false)

    useEffect(() => {
        setMounted(true)
        // Check if previously seen
        const seen = localStorage.getItem('meeting_notes_tutorial_seen')
        if (!seen) {
            setIsVisible(true)
        }
    }, [])

    useEffect(() => {
        if (isVisible && !isMuted) {
            speak(STEPS[currentStep].description)
        }
        return () => {
            if (typeof window !== 'undefined') {
                window.speechSynthesis.cancel()
            }
        }
    }, [currentStep, isVisible, isMuted])

    const speak = (text: string) => {
        if (typeof window === 'undefined') return

        window.speechSynthesis.cancel() // Stop previous
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'cs-CZ'
        utterance.rate = 1
        utterance.pitch = 1
        window.speechSynthesis.speak(utterance)
    }

    const handleNext = async () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1)
        } else {
            await finishTutorial()
        }
    }

    const finishTutorial = async () => {
        if (typeof window !== 'undefined') {
            window.speechSynthesis.cancel()
        }
        setIsVisible(false)
        setCurrentStep(0)
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
                Průvodce 🎓
            </button>

            {isVisible && (
                <div className={styles.overlay}>
                    <div className={styles.modal}>

                        {/* Character Section */}
                        <div className={styles.characterContainer}>
                            <img
                                src="/guide-character.png"
                                alt="Průvodce"
                                className={styles.characterImage}
                            />
                        </div>

                        {/* Speech Bubble Section */}
                        <div className={styles.speechBubble}>
                            <div className={styles.title}>
                                <span>{step.icon}</span>
                                {step.title}
                                <button
                                    onClick={() => {
                                        if (isMuted) {
                                            setIsMuted(false)
                                            // speak will trigger via effect
                                        } else {
                                            setIsMuted(true)
                                            window.speechSynthesis.cancel()
                                        }
                                    }}
                                    style={{
                                        marginLeft: 'auto',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#cbd5e0'
                                    }}
                                >
                                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                </button>
                            </div>

                            <p className={styles.description}>
                                {step.description}
                            </p>

                            <div className={styles.controls}>
                                <div className={styles.dots}>
                                    {STEPS.map((_, index) => (
                                        <div
                                            key={index}
                                            className={`${styles.dot} ${index === currentStep ? styles.activeDot : ''}`}
                                        />
                                    ))}
                                </div>

                                <div className={styles.buttons}>
                                    <button onClick={finishTutorial} className={styles.skipButton}>
                                        {currentStep === STEPS.length - 1 ? '' : 'Přeskočit'}
                                    </button>
                                    <button onClick={handleNext} className={styles.nextButton}>
                                        {currentStep === STEPS.length - 1 ? 'Začít!' : 'Pokračovat'}
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </>
    )
}
