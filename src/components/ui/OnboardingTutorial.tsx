'use client'

import { useState, useEffect, useRef } from 'react'
import styles from './onboarding-tutorial.module.css'
import { completeTutorial } from '@/app/dashboard/actions'
import { Volume2, VolumeX } from 'lucide-react'
import Image from 'next/image'

interface OnboardingTutorialProps {
    userId: string
}

const STEPS = [
    {
        title: "Vítejte!",
        description: "Ahoj! Jsem tvoje průvodkyně. Ráda bych tě provedla rychlou prohlídkou, abys věděl, co všechno tahle aplikace umí.",
        icon: "👋"
    },
    {
        title: "Dashboard",
        description: "Tady na Dashboardu uvidíš všechny své naplánované schůzky. Je to tvůj hlavní přehled.",
        icon: "📊"
    },
    {
        title: "Hromadné akce",
        description: "Přejeď myší do levého horního rohu kartičky (nebo klikni) a můžeš vybrat více schůzek najednou. Pak je jednoduše smažeš nebo vyexportuješ do PDF.",
        icon: "✨"
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
        title: "Nastavení a profil",
        description: "V nastavení si můžeš přepnout na tmavý režim nebo změnit jazyk aplikace. Také si nezapomeň nahrát svou profilovku!",
        icon: "⚙️"
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
    const descriptionRef = useRef<HTMLParagraphElement>(null)

    useEffect(() => {
        setMounted(true)
        // Check if previously seen
        const seen = localStorage.getItem('meeting_notes_tutorial_seen')
        if (!seen) {
            setIsVisible(true)
        }
    }, [])

    const speak = () => {
        if (typeof window === 'undefined') return

        try {
            if (!STEPS[currentStep]) return
            const text = descriptionRef.current?.innerText || STEPS[currentStep].description
            if (!text) return

            window.speechSynthesis.cancel() // Stop previous
            const utterance = new SpeechSynthesisUtterance(text)

            // Dynamically detect language based on HTML lang attribute (set by Google Translate)
            const currentLang = document.documentElement.lang || 'cs'
            utterance.lang = currentLang

            const voices = window.speechSynthesis.getVoices()

            // Improve voice selection based on current language
            let selectedVoice: SpeechSynthesisVoice | undefined

            // precision matching for language
            const langVoices = voices.filter(v => v.lang.startsWith(currentLang))

            // Try to find a female voice in the correct language
            selectedVoice = langVoices.find(v =>
                v.name.includes('Zuzana') ||
                v.name.includes('Vlasta') ||
                v.name.includes('Google') ||
                v.name.includes('Female') ||
                v.name.includes('Samantha')
            )

            // Fallback to any voice in that language
            if (!selectedVoice && langVoices.length > 0) {
                selectedVoice = langVoices[0]
            }

            // Fallback to Czech if no language specific voice found (and we are in default mode)
            if (!selectedVoice) {
                selectedVoice = voices.find(v => v.lang.includes('cs'))
            }

            if (selectedVoice) {
                utterance.voice = selectedVoice
            }

            utterance.rate = 1
            utterance.pitch = 1.1
            window.speechSynthesis.speak(utterance)
        } catch (e) {
            console.error("Speech synthesis error:", e)
        }
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        try {
            const runSpeak = () => {
                // Short delay to allow render and prevent race conditions
                const timer = setTimeout(() => {
                    speak()
                }, 500)
                return () => clearTimeout(timer)
            }

            if (isVisible && !isMuted) {
                runSpeak()
            }

            // Ensure we retry if voices weren't ready
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.onvoiceschanged = () => {
                    if (isVisible && !isMuted) {
                        speak()
                    }
                }
            }
        } catch (err) {
            console.error('Tutorial Effect Error:', err)
        }

        return () => {
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel()
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStep, isVisible, isMuted])


    const finishTutorial = async () => {
        if (typeof window !== 'undefined') {
            window.speechSynthesis.cancel()
        }
        setIsVisible(false)
        setCurrentStep(0)
        localStorage.setItem('meeting_notes_tutorial_seen', 'true')
        try {
            await completeTutorial(userId)
        } catch {
            // ignore
        }
    }

    const handleNext = async () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1)
        } else {
            await finishTutorial()
        }
    }

    if (!mounted) return null

    const step = STEPS[currentStep]
    if (!step) return null // Safety check

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
                            <Image
                                src="/guide-character.png"
                                alt="Průvodce"
                                className={styles.characterImage}
                                width={120}
                                height={120}
                                unoptimized
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

                            <p className={styles.description} ref={descriptionRef}>
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
