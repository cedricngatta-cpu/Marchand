'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface VoiceContextType {
    isSpeaking: boolean;
    isListening: boolean;
    transcript: string;
    speak: (text: string) => void;
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

    const speak = useCallback((text: string) => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop old speech
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'fr-FR';
            utterance.rate = 0.95; // Slightly faster for responsiveness
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
        }
    }, []);

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
                    speak("Je ne peux pas t'entendre, tu dois autoriser le microphone.");
                } else if (event.error === 'network') {
                    speak("Problème de connexion, vérifie ton internet.");
                } else {
                    speak("Désolé, je n'ai pas bien entendu.");
                }
            };

            recognition.onresult = (event: any) => {
                const text = event.results[0][0].transcript;
                setTranscript(text);
                speak(`J'ai entendu : ${text}`);
            };

            recognition.start();
        } else {
            speak("Pardon, je ne peux pas t'écouter sur ce téléphone.");
        }
    }, [speak]);

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
