'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShoppingBag, Users, Percent, Timer, CheckCircle2, History, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CooperativeAchats() {
    const router = useRouter();
    const [view, setView] = useState<'active' | 'history'>('active');

    const groupedOrders = [
        {
            id: 1,
            name: 'Engrais NPK',
            currentVolume: 185,
            targetVolume: 200,
            unit: 'sacs',
            discount: '-15%',
            timeLeft: '2h 15m',
            color: 'bg-emerald-500',
            status: 'active'
        },
        {
            id: 2,
            name: 'Semences Maïs',
            currentVolume: 450,
            targetVolume: 500,
            unit: 'kg',
            discount: '-20%',
            timeLeft: '4h 30m',
            color: 'bg-blue-500',
            status: 'active'
        },
        {
            id: 3,
            name: 'Pesticides Bio',
            currentVolume: 15,
            targetVolume: 50,
            unit: 'litres',
            discount: '-10%',
            timeLeft: '6 jours',
            color: 'bg-purple-500',
            status: 'active'
        },
    ];

    const historyOrders = [
        {
            id: 101,
            name: 'Sacs de Transport',
            totalVolume: 1000,
            unit: 'unités',
            finalDiscount: '-25%',
            date: '15 Jan 2026',
            color: 'bg-slate-500'
        },
        {
            id: 102,
            name: 'Matériel Irrigation',
            totalVolume: 50,
            unit: 'kits',
            finalDiscount: '-30%',
            date: '02 Jan 2026',
            color: 'bg-slate-500'
        }
    ];

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 max-w-4xl mx-auto pb-48">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pt-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm text-slate-600 dark:text-slate-300 active:scale-90 transition-all border-2 border-slate-100 dark:border-slate-800"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Achats Groupés</h1>
                        <p className="text-emerald-600 font-bold text-[10px] uppercase tracking-widest mt-1">Économiser ensemble</p>
                    </div>
                </div>

                <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 shadow-sm">
                    <button
                        onClick={() => setView('active')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'active' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        En cours
                    </button>
                    <button
                        onClick={() => setView('history')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'history' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Historique
                    </button>
                </div>
            </header>

            <AnimatePresence mode="wait">
                {view === 'active' ? (
                    <motion.div
                        key="active"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <button className="w-full bg-slate-900 text-white p-8 rounded-[40px] flex items-center justify-center gap-6 shadow-2xl active:scale-[0.98] transition-all border-b-8 border-slate-700">
                            <div className="bg-white/20 p-4 rounded-2xl">
                                <PlusCircle size={32} />
                            </div>
                            <div className="text-left">
                                <span className="block font-black uppercase tracking-widest text-xl">Nouvel Achat Groupé</span>
                                <span className="text-xs font-bold opacity-60 uppercase">Initier une commande collective</span>
                            </div>
                        </button>

                        {groupedOrders.map((order) => {
                            const progress = (order.currentVolume / order.targetVolume) * 100;
                            return (
                                <motion.div
                                    key={order.id}
                                    className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[32px] md:rounded-[48px] shadow-sm border-2 border-slate-100 dark:border-slate-800 relative overflow-hidden group mt-12 md:mt-0"
                                >
                                    <div className="absolute top-0 right-0 bg-emerald-500 text-white px-6 py-4 md:px-10 md:py-5 rounded-bl-[32px] md:rounded-bl-[40px] font-black text-lg md:text-2xl flex items-center gap-3">
                                        <Percent size={20} className="md:w-6 md:h-6" strokeWidth={3} /> {order.discount}
                                    </div>

                                    <div className="mb-8 pt-10 md:pt-0">
                                        <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4 leading-none">{order.name}</h3>
                                        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 sm:gap-8">
                                            <div className="flex items-center gap-2.5 text-slate-500 font-black uppercase text-[10px] tracking-widest">
                                                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600">
                                                    <Users size={18} />
                                                </div>
                                                <span>Participants : <span className="text-slate-900 dark:text-white">{Math.floor(order.currentVolume / 10)}</span></span>
                                            </div>
                                            <div className="flex items-center gap-2.5 text-slate-500 font-black uppercase text-[10px] tracking-widest">
                                                <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-rose-600">
                                                    <Timer size={18} />
                                                </div>
                                                <span>Fin dans : <span className="text-rose-600">{order.timeLeft}</span></span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <span className="text-4xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">
                                                    {order.currentVolume}
                                                </span>
                                                <span className="text-sm font-black text-slate-400 uppercase ml-2 tracking-widest">{order.unit} collectés</span>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-100 dark:border-slate-700">
                                                Cible: {order.targetVolume}
                                            </span>
                                        </div>
                                        <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-1.5 border-2 border-white dark:border-slate-700 shadow-inner">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                className={`h-full rounded-full ${order.color} shadow-lg relative`}
                                            >
                                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                            </motion.div>
                                        </div>
                                    </div>

                                    <div className="mt-8 md:mt-10 flex gap-4 md:gap-6">
                                        <button className="flex-1 bg-slate-900 dark:bg-emerald-600 text-white h-16 md:h-20 rounded-[24px] md:rounded-[30px] font-black uppercase tracking-[0.2em] text-[10px] md:text-sm active:scale-95 transition-all shadow-xl hover:shadow-emerald-500/20">
                                            Rejoindre l'achat
                                        </button>
                                        <button className="w-16 h-16 md:w-20 md:h-20 shrink-0 bg-slate-100 dark:bg-slate-800 rounded-[24px] md:rounded-[30px] flex items-center justify-center text-slate-500 hover:text-purple-600 transition-all active:scale-95 border-2 border-transparent hover:border-purple-200">
                                            <ShoppingBag size={24} className="md:w-7 md:h-7" />
                                        </button>
                                    </div>

                                    {progress >= 85 && (
                                        <motion.div
                                            animate={{ scale: [1, 1.02, 1] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="mt-6 flex items-center gap-2 text-emerald-600 font-black uppercase text-[10px] tracking-[0.2em] justify-center bg-emerald-50 dark:bg-emerald-900/20 py-3 rounded-2xl"
                                        >
                                            <CheckCircle2 size={16} strokeWidth={3} /> Seuil critique atteint !
                                        </motion.div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </motion.div>
                ) : (
                    <motion.div
                        key="history"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {historyOrders.map((order) => (
                            <div key={order.id} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[32px] md:rounded-[40px] border-2 border-slate-100 dark:border-slate-800 shadow-sm opacity-80 grayscale-[0.5] hover:grayscale-0 transition-all hover:opacity-100">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                    <div>
                                        <h4 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase leading-none mb-2">{order.name}</h4>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-lg">{order.date}</span>
                                    </div>
                                    <div className="bg-slate-100 dark:bg-slate-800 px-5 py-2 rounded-2xl font-black text-emerald-600 uppercase text-xs">
                                        Succès {order.finalDiscount}
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-slate-500 font-black uppercase text-[10px] tracking-widest">
                                    <span>Total distribué : <span className="text-slate-900 dark:text-white">{order.totalVolume} {order.unit}</span></span>
                                    <History size={20} className="opacity-20 hidden sm:block" />
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Global Insight */}
            <div className="mt-12 md:mt-16 bg-slate-900 p-8 md:p-10 rounded-[32px] md:rounded-[48px] text-center shadow-2xl relative overflow-hidden border-b-8 border-emerald-500">
                <p className="text-white text-lg md:text-2xl font-bold italic leading-tight mb-8 opacity-90 relative z-10">
                    "Plus vous êtes nombreux, plus le prix baisse. L'union fait la force de notre filière."
                </p>
                <div className="absolute top-0 right-0 p-6 md:p-10 opacity-10">
                    <ShoppingBag size={120} className="text-emerald-500 w-20 h-20 md:w-32 md:h-32" />
                </div>
            </div>
        </main>
    );
}
