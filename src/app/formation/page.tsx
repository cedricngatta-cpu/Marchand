'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, PlayCircle, PauseCircle, Headphones, Play, Sparkles } from 'lucide-react';
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

    useEffect(() => {
        return () => stopSpeaking();
    }, [stopSpeaking]);

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
            {/* Header Coloré (Card Overlap Style) */}
            <div className="bg-cyan-600 pt-8 pb-32 px-4 rounded-b-[2.5rem] relative shadow-lg">
                <div className="flex justify-between items-center max-w-lg mx-auto mb-6">
                    <button
                        onClick={() => {
                            stopSpeaking();
                            router.back();
                        }}
                        className="w-10 h-10 bg-white text-cyan-600 rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="text-center flex-1 pr-10">
                        <h1 className="text-white font-bold text-lg tracking-wide uppercase">Apprentissage</h1>
                        <p className="text-cyan-100/60 text-[10px] font-bold uppercase tracking-widest mt-0.5">Écouter & Apprendre</p>
                    </div>
                </div>
            </div>

            {/* Main Content Overlap */}
            <div className="px-4 max-w-lg mx-auto relative -mt-20 z-10 space-y-6">
                {/* Intro Card */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <Headphones size={80} className="text-cyan-600 rotate-12" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles size={16} className="text-amber-500" />
                            <span className="text-[10px] font-black text-cyan-600 uppercase tracking-[0.2em]">Coach Personnel</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none mb-3">
                            Tutoriels Audio
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest leading-loose">
                            Appuie sur lecture pour écouter le coach t'expliquer comment utiliser l'application comme un expert.
                        </p>
                    </div>
                </div>

                {/* Tutorials List */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 ml-4">
                        <div className="w-1 h-3 bg-cyan-500 rounded-full" />
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leçons disponibles</h3>
                    </div>

                    {tutorials.map((tuto) => {
                        const isPlaying = playingId === tuto.id && isSpeaking;
                        return (
                            <motion.button
                                key={tuto.id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => togglePlay(tuto)}
                                className={`w-full bg-white dark:bg-slate-900 p-5 rounded-[28px] border transition-all flex items-center gap-5 text-left shadow-sm ${isPlaying ? 'border-cyan-500 ring-2 ring-cyan-500/10' : 'border-slate-100 dark:border-slate-800'}`}
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${isPlaying ? 'bg-cyan-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                                    {isPlaying ? (
                                        <PauseCircle size={24} className="animate-pulse" />
                                    ) : (
                                        <PlayCircle size={24} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black uppercase tracking-tight text-slate-900 dark:text-white text-xs leading-none mb-2 truncate">
                                        {tuto.title}
                                    </h4>
                                    <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                        <span className="flex items-center gap-1">
                                            <Play size={8} fill="currentColor" /> {tuto.duration}
                                        </span>
                                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                        <span className="text-cyan-600">Audio</span>
                                    </div>
                                </div>
                                {isPlaying && (
                                    <div className="flex gap-0.5 items-end h-3">
                                        {[1, 2, 3].map(i => (
                                            <motion.div
                                                key={i}
                                                animate={{ height: [4, 12, 4] }}
                                                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                                className="w-0.5 bg-cyan-500 rounded-full"
                                            />
                                        ))}
                                    </div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}
