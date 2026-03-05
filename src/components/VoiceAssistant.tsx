'use client';

import { Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAssistant } from '@/hooks/useAssistant';
import { usePathname } from 'next/navigation';

export const VoiceAssistant = () => {
    const { handleAction, isListening, isSpeaking } = useAssistant();
    const pathname = usePathname();

    const getExampleText = () => {
        if (pathname.includes('/vendre')) return '"Vend 2 pains à Fatou"';
        if (pathname.includes('/stock')) return '"J\'ai reçu 10 sacs de riz"';
        if (pathname.includes('/cooperative')) return '"Volume total du Maïs ?"';
        return '"Besoin d\'aide ?"';
    };

    return (
        <div className="fixed bottom-8 left-0 right-0 flex justify-center px-4 pointer-events-none z-[300]">
            <motion.button
                onClick={handleAction}
                whileTap={{ scale: 0.9 }}
                className={`h-28 md:h-32 px-10 md:px-16 rounded-[40px] md:rounded-[50px] shadow-2xl text-white flex items-center gap-6 pointer-events-auto border-4 border-white dark:border-slate-900 transition-all ${isListening ? 'bg-red-500 animate-pulse' : 'bg-emerald-600 active:bg-emerald-700'}`}
            >
                <div className={`p-4 md:p-6 rounded-3xl ${isSpeaking || isListening ? 'bg-white text-emerald-600' : 'bg-white/20 text-white'} transition-all duration-300`}>
                    <Mic size={48} fill={isSpeaking || isListening ? "currentColor" : "none"} strokeWidth={3} className="md:scale-110" />
                </div>
                <div className="flex flex-col items-start pr-4 text-left">
                    <span className="text-2xl md:text-3xl font-black leading-none uppercase">{isListening ? "J'ÉCOUTE..." : isSpeaking ? "JE PARLE..." : "PARLER"}</span>
                    <span className="text-xs md:text-sm font-bold opacity-80 italic tracking-tighter">{getExampleText()}</span>
                </div>

                {/* Status Indicator */}
                <AnimatePresence>
                    {isListening && (
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-1 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                            <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-white rounded-full" />
                            <motion.div animate={{ height: [8, 16, 8] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.1 }} className="w-1 bg-white rounded-full" />
                            <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.2 }} className="w-1 bg-white rounded-full" />
                        </div>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    );
};
