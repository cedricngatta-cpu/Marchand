'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, PlayCircle, PauseCircle, Headphones, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useVoice } from '@/hooks/useVoice';

export default function FormationPage() {
    const router = useRouter();
    const { speak, stopSpeaking, isSpeaking } = useVoice();
    const [playingId, setPlayingId] = useState<number | null>(null);

    const tutorials = [
        { id: 1, title: 'Comment vendre vocalement', duration: '1 min', text: "Pour vendre, appuie sur le gros bouton du microphone en bas de l'écran principal. Ensuite, dis simplement 'Vend deux tomates à Fatou' et l'application s'occupe du reste. Tu peux aussi préciser si c'est à crédit." },
        { id: 2, title: 'Ajouter un nouveau produit', duration: '45 sec', text: "Va dans la section Acheter, puis appuie sur le bouton Ajouter. Prends une belle photo de ton produit avec ton téléphone, donne-lui un nom clair, fixe son prix de vente et la quantité que tu as reçue." },
        { id: 3, title: 'Comment voir qui me doit', duration: '30 sec', text: "Ouvre le carnet de dettes depuis le menu principal. Tu verras la liste de tous tes clients qui ne t'ont pas encore payé. Si un client te paie, clique sur son nom et appuie sur 'Marquer comme payé'." },
        { id: 4, title: 'Comprendre mon bilan', duration: '1 min', text: "La page Bilan te montre si tu gagnes de l'argent ou si tu en perds. L'application calcule automatiquement tes bénéfices en soustrayant tes achats de tes ventes. L'intelligence artificielle te donnera aussi des conseils vocaux." },
    ];

    const togglePlay = (tuto: any) => {
        if (playingId === tuto.id && isSpeaking) {
            stopSpeaking();
            setPlayingId(null);
        } else {
            speak(tuto.text);
            setPlayingId(tuto.id);
        }
    };

    React.useEffect(() => {
        return () => stopSpeaking();
    }, [stopSpeaking]);

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 max-w-5xl mx-auto pb-32">
            <header className="flex items-center gap-3 md:gap-4 mb-6 md:mb-10 pt-4">
                <button
                    onClick={() => {
                        stopSpeaking();
                        router.back();
                    }}
                    className="w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm text-slate-600 dark:text-slate-300 active:scale-90 transition-all border border-slate-100 dark:border-slate-800 shrink-0"
                >
                    <ArrowLeft size={24} className="w-6 h-6 md:w-7 md:h-7" />
                </button>
                <div className="min-w-0">
                    <h1 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none truncate">Formation</h1>
                    <p className="text-cyan-600 font-bold text-[9px] md:text-[11px] uppercase tracking-widest mt-0.5 md:mt-1 truncate">Écouter & Apprendre</p>
                </div>
            </header>

            <div className="bg-cyan-600 p-6 md:p-10 rounded-[32px] md:rounded-[40px] text-white shadow-xl shadow-cyan-200 dark:shadow-none mb-6 md:mb-10 relative overflow-hidden">
                <div className="relative z-10 w-3/4 md:w-full">
                    <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight mb-2 md:mb-4">Tutoriels Audio</h2>
                    <p className="font-bold opacity-90 leading-relaxed text-[10px] md:text-base uppercase tracking-widest text-cyan-100">Appuie sur lecture pour écouter le coach t'expliquer comment utiliser l'application comme un pro.</p>
                </div>
                <Headphones size={120} className="absolute -right-4 -bottom-6 text-white/10 rotate-12 md:w-32 md:h-32" />
            </div>

            <div className="space-y-3 md:space-y-4">
                {tutorials.map((tuto) => {
                    const isPlaying = playingId === tuto.id && isSpeaking;
                    return (
                        <motion.div
                            key={tuto.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => togglePlay(tuto)}
                            className={`bg-white dark:bg-slate-900 p-4 md:p-6 rounded-[24px] md:rounded-[35px] shadow-sm border-2 cursor-pointer transition-all flex items-center gap-4 md:gap-6 ${isPlaying ? 'border-cyan-500 shadow-cyan-100 dark:shadow-none' : 'border-slate-100 dark:border-slate-800 hover:border-cyan-200'}`}
                        >
                            <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl shrink-0 ${isPlaying ? 'bg-cyan-50 text-cyan-500 shadow-inner' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                                {isPlaying ? <PauseCircle size={28} className="animate-pulse md:w-8 md:h-8" /> : <PlayCircle size={28} className="md:w-8 md:h-8" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-black uppercase tracking-tight text-slate-900 dark:text-white text-sm md:text-lg leading-tight mb-1 truncate">{tuto.title}</h3>
                                <div className="flex items-center gap-1.5 md:gap-2 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span className="flex items-center gap-1"><Play size={10} className="md:w-[12px] md:h-[12px]" /> Audio</span>
                                    <span>•</span>
                                    <span>{tuto.duration}</span>
                                </div>
                            </div>
                            {isPlaying && <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-cyan-500 animate-ping ml-2 md:mr-4 shrink-0" />}
                        </motion.div>
                    );
                })}
            </div>
        </main>
    );
}
