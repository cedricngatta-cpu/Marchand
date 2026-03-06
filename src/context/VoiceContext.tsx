'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface VoiceContextType {
    isSpeaking: boolean;
    isListening: boolean;
    transcript: string;
    speak: (text: string, autoListen?: boolean) => void;
    listen: () => void;
    stopSpeaking: () => void;
    clearTranscript: () => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<any>(null);

    // Refs to break circular dependency
    const speakRef = useRef<(text: string, autoListen?: boolean) => void>(undefined);
    const listenRef = useRef<() => void>(undefined);

    const stopSpeaking = useCallback(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, []);

    const listen = useCallback(() => {
        if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch (e) { }
            }

            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            const recognition = new SpeechRecognition();
            recognitionRef.current = recognition;

            recognition.lang = 'fr-FR';
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);

            recognition.onerror = (event: any) => {
                setIsListening(false);
                if (event.error === 'not-allowed') {
                    speakRef.current?.("Je ne peux pas t'entendre, tu dois autoriser le microphone.");
                } else if (event.error === 'network') {
                    speakRef.current?.("Problème de connexion, vérifie ton internet.");
                } else {
                    speakRef.current?.("Désolé, je n'ai pas bien entendu.");
                }
            };

            recognition.onresult = (event: any) => {
                const text = event.results[0][0].transcript;
                setTranscript(text);
                speakRef.current?.(`J'ai entendu : ${text}`);
            };

            recognition.start();
        } else {
            speakRef.current?.("Pardon, je ne peux pas t'écouter sur ce téléphone.");
        }
    }, []);

    listenRef.current = listen;

    const speak = useCallback((text: string, autoListen: boolean = false) => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop old speech

            // Nettoyage : Transformer les mots en MAJUSCULES (ex: ADJO) en minuscules (ex: Adjo)
            // Cela évite que le moteur TTS n'épèle le mot lettre par lettre.
            const sanitizedText = text.replace(/\b([A-Z])([A-Z]{1,})\b/g, (match, p1, p2) => {
                return p1 + p2.toLowerCase();
            });

            const utterance = new SpeechSynthesisUtterance(sanitizedText);
            utterance.lang = 'fr-FR';
            utterance.rate = 0.95; // Slightly faster for responsiveness
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => {
                setIsSpeaking(false);
                if (autoListen) {
                    setTimeout(() => listenRef.current?.(), 300); // Petit délai pour éviter l'écho
                }
            };
            window.speechSynthesis.speak(utterance);
        }
    }, []);

    speakRef.current = speak;

    const clearTranscript = useCallback(() => {
        setTranscript('');
    }, []);

    return (
        <VoiceContext.Provider value={{
            isSpeaking,
            isListening,
            transcript,
            speak,
            listen,
            stopSpeaking,
            clearTranscript
        }}>
            {children}
        </VoiceContext.Provider>
    );
};

export const useVoiceContext = () => {
    const context = useContext(VoiceContext);
    if (!context) {
        throw new Error('useVoiceContext must be used within a VoiceProvider');
    }
    return context;
};
