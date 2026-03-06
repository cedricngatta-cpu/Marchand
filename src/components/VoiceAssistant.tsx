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
        <div className="fixed bottom-4 left-0 right-0 flex justify-center px-4 pointer-events-none z-[300]">
            <motion.button
                onClick={handleAction}
                whileTap={{ scale: 0.95 }}
                className={`h-12 md:h-14 px-5 rounded-fill shadow-lg text-white flex items-center gap-3 pointer-events-auto transition-all ${isListening ? 'bg-red-500' : 'bg-primary'}`}
                style={{ borderRadius: '9999px' }}
            >
                <div className={`p-2 rounded-full ${isSpeaking || isListening ? 'bg-white text-emerald-600' : 'bg-white/20 text-white'} transition-all duration-300`}>
                    <Mic size={18} fill={isSpeaking || isListening ? "currentColor" : "none"} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col items-start text-left">
                    <span className="text-xs font-bold leading-none tracking-tight">{isListening ? "ÉCOUTE..." : isSpeaking ? "PARLE..." : "ASSISTANT"}</span>
                    <span className="text-[10px] font-medium opacity-80 truncate max-w-[140px]">{getExampleText()}</span>
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
