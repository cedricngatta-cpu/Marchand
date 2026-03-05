'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, User, Phone, MapPin, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useVoice } from '@/hooks/useVoice';

export default function AgentEnrollment() {
    const router = useRouter();
    const { speak } = useVoice();
    const [step, setStep] = useState<'PHOTO' | 'INFO' | 'SUCCESS'>('PHOTO');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    const handleNext = () => {
        if (step === 'PHOTO') setStep('INFO');
        else if (step === 'INFO') {
            speak(`Félicitations ! Le nouveau marchand ${name} est maintenant inscrit.`);
            setStep('SUCCESS');
        }
    };

    return (
        <main className="min-h-screen bg-white dark:bg-slate-950 p-6 max-w-2xl mx-auto flex flex-col">
            <header className="flex items-center gap-4 mb-10 pt-4">
                <button
                    onClick={() => router.back()}
                    className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-90 transition-all"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Enrôlement</h1>
                    <p className="text-cyan-600 font-bold text-[10px] uppercase tracking-widest mt-1">Nouveau Marchand</p>
                </div>
            </header>

            <div className="flex-1 flex flex-col justify-center gap-8">
                {step === 'PHOTO' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-8"
                    >
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Salut, Agent !</h2>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Prends une photo du marchand et de sa boutique</p>
                        </div>

                        <div className="aspect-square bg-slate-50 dark:bg-slate-900 rounded-[60px] border-4 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-4 group cursor-pointer hover:border-cyan-400 transition-colors">
                            <div className="p-10 bg-white dark:bg-slate-800 rounded-full shadow-2xl group-hover:scale-110 transition-transform">
                                <Camera size={64} className="text-cyan-500" />
                            </div>
                            <span className="font-black uppercase tracking-widest text-xs text-slate-400">Appuie pour capturer</span>
                        </div>

                        <button
                            onClick={handleNext}
                            className="w-full bg-slate-900 dark:bg-cyan-600 text-white p-8 rounded-[35px] font-black uppercase tracking-[0.2em] text-xl shadow-2xl"
                        >
                            Suivant
                        </button>
                    </motion.div>
                )}

                {step === 'INFO' && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                    >
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-6 mb-1 block">Nom du Marchand</label>
                                <div className="relative">
                                    <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Ex: Kouamé Moussa"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-4 border-slate-100 dark:border-slate-800 rounded-[32px] p-6 pl-16 font-black text-2xl text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all uppercase"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-6 mb-1 block">Téléphone</label>
                                <div className="relative">
                                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                                    <input
                                        type="tel"
                                        placeholder="00 00 00 00 00"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-4 border-slate-100 dark:border-slate-800 rounded-[32px] p-6 pl-16 font-black text-2xl text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all uppercase"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleNext}
                            disabled={!name || !phone}
                            className="w-full bg-cyan-500 disabled:bg-slate-200 text-white p-8 rounded-[35px] font-black uppercase tracking-[0.2em] text-xl shadow-2xl shadow-cyan-200 dark:shadow-none active:scale-95 transition-all"
                        >
                            Finaliser l'Inscription
                        </button>
                    </motion.div>
                )}

                {step === 'SUCCESS' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-8"
                    >
                        <div className="w-32 h-32 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                            <CheckCircle size={80} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">C'est fait !</h2>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{name} a rejoint l'aventure.</p>
                        </div>
                        <button
                            onClick={() => router.push('/agent')}
                            className="w-full bg-slate-900 dark:bg-slate-800 text-white p-8 rounded-[35px] font-black uppercase tracking-[0.2em] text-xl"
                        >
                            Retour au Dashboard
                        </button>
                    </motion.div>
                )}
            </div>
        </main>
    );
}
