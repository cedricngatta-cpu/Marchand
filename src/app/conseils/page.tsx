'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, LineChart, Sparkles, ArrowLeft, Wand2, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function ConseilsPage() {
    return (
        <main className="min-h-screen bg-slate-50 pb-24 max-w-5xl mx-auto">
            <div className="bg-indigo-600 text-white p-6 md:p-10 rounded-b-[2.5rem] md:rounded-b-[4rem] shadow-lg">
                <Link href="/commercant" className="mb-4 md:mb-6 inline-block">
                    <ArrowLeft className="w-5 h-5 md:w-8 md:h-8 active:scale-90 transition-transform" />
                </Link>
                <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                    <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-amber-300" />
                    <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter">Conseils IA</h1>
                </div>
                <p className="opacity-90 font-bold text-[10px] md:text-sm uppercase tracking-widest">Anticipez vos ventes et gérez mieux votre stock</p>
            </div>

            <div className="px-4 md:px-8 -mt-6 md:-mt-8 space-y-4 md:space-y-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-xl border-t-[3px] md:border-t-4 border-indigo-500 text-center"
                >
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                        <LineChart className="w-8 h-8 md:w-10 md:h-10 text-indigo-600" />
                    </div>
                    <h2 className="text-lg md:text-2xl font-black text-slate-800 mb-2 md:mb-4 uppercase tracking-tight">Prévision des ventes</h2>
                    <p className="text-slate-600 text-sm md:text-base font-medium leading-relaxed mb-4 md:mb-6">
                        L'IA analyse vos ventes passées pour vous dire quoi acheter demain.
                    </p>
                    <div className="bg-slate-100 p-3 md:p-4 rounded-[14px] md:rounded-2xl inline-flex items-center gap-2 md:gap-3">
                        <BrainCircuit className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" />
                        <span className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">
                            Analyse en cours...
                        </span>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white p-5 md:p-8 rounded-[24px] md:rounded-3xl shadow-sm border-2 border-slate-100 flex flex-col sm:items-center sm:text-center">
                        <Wand2 className="w-6 h-6 md:w-8 md:h-8 text-amber-500 mb-2 md:mb-3" />
                        <div>
                            <h4 className="font-black text-slate-800 text-sm md:text-base uppercase tracking-tight mb-1">Prix Optimal</h4>
                            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Suggère le meilleur prix selon le marché.</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 md:p-8 rounded-[24px] md:rounded-3xl shadow-sm border-2 border-slate-100 flex flex-col sm:items-center sm:text-center">
                        <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-emerald-500 mb-2 md:mb-3" />
                        <div>
                            <h4 className="font-black text-slate-800 text-sm md:text-base uppercase tracking-tight mb-1">Alertes Stock</h4>
                            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Prévient avant la rupture.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 md:p-10 rounded-[28px] md:rounded-[2rem] text-white shadow-lg overflow-hidden relative">
                    <Sparkles className="absolute -right-4 -top-4 w-20 h-20 md:w-24 md:h-24 opacity-20" />
                    <h3 className="text-base md:text-lg font-black mb-1 md:mb-2 italic uppercase tracking-wider">"Le saviez-vous ?"</h3>
                    <p className="text-xs md:text-sm font-bold opacity-90 leading-relaxed uppercase tracking-widest">
                        Le mardi est votre meilleur jour pour la Tomate. Prévoyez 20% de stock en plus !
                    </p>
                </div>
            </div>
        </main>
    );
}
