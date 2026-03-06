'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, LineChart, Sparkles, ArrowLeft, Wand2, TrendingUp } from 'lucide-react';

export default function ConseilsPage() {
    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
            {/* Header Coloré (Card Overlap Style) */}
            <div className="bg-indigo-600 pt-8 pb-32 px-4 rounded-b-[2.5rem] relative shadow-lg">
                <div className="flex justify-between items-center max-w-lg mx-auto mb-6">
                    <button
                        onClick={() => window.history.back()}
                        className="w-10 h-10 bg-white text-indigo-600 rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="text-center flex-1 pr-10">
                        <h1 className="text-white font-bold text-lg tracking-wide uppercase">Coaching IA</h1>
                        <p className="text-indigo-100/60 text-[10px] font-bold uppercase tracking-widest mt-0.5">Conseils & Prévisions</p>
                    </div>
                </div>
            </div>

            {/* Main Content Overlap */}
            <div className="px-4 max-w-lg mx-auto relative -mt-20 z-10 space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center relative overflow-hidden group"
                >
                    <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-[24px] flex items-center justify-center shadow-md mb-6">
                        <LineChart size={32} className="text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none mb-3">
                        Prévision des ventes
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-6">
                        L'IA analyse vos ventes passées pour vous dire quoi acheter demain.
                    </p>
                    <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-full inline-flex items-center gap-2 border border-slate-100 dark:border-slate-700">
                        <BrainCircuit size={16} className="text-indigo-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Analyse en temps réel
                        </span>
                    </div>
                </motion.div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[28px] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center gap-3">
                        <Wand2 size={24} className="text-amber-500" />
                        <div>
                            <h4 className="font-black text-slate-900 dark:text-white text-[11px] uppercase tracking-tight mb-1 leading-none">Prix Optimal</h4>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-relaxed">Suggère le meilleur prix</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[28px] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center gap-3">
                        <TrendingUp size={24} className="text-emerald-500" />
                        <div>
                            <h4 className="font-black text-slate-900 dark:text-white text-[11px] uppercase tracking-tight mb-1 leading-none">Alertes Stock</h4>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-relaxed">Prévient la rupture</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-[32px] text-white shadow-lg overflow-hidden relative group">
                    <Sparkles className="absolute -right-4 -top-4 w-24 h-24 opacity-20 transform group-hover:rotate-12 transition-transform" />
                    <h3 className="text-sm font-black mb-2 italic uppercase tracking-wider flex items-center gap-2">
                        <Sparkles size={16} className="text-amber-300" /> Le saviez-vous ?
                    </h3>
                    <p className="text-xs font-bold opacity-90 leading-relaxed uppercase tracking-widest">
                        Le mardi est votre meilleur jour pour la Tomate. Prévoyez 20% de stock en plus !
                    </p>
                </div>
            </div>
        </main>
    );
}
