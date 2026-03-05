'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Filter, Calendar, Users, ShoppingBag, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CooperativeJournal() {
    const router = useRouter();
    const [filter, setFilter] = useState('Tous');

    const activities = [
        { id: 1, user: 'Adama Diallo', type: 'Vente', action: 'Record de vente battu', info: '+450,000 F', time: 'Il y a 12min', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { id: 2, user: 'Coop Admin', type: 'Achat', action: 'Commande groupée validée', info: 'Engrais NPK (200 sacs)', time: 'Il y a 1h', icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-50' },
        { id: 3, user: 'Marie Koné', type: 'Membre', action: 'Nouvelle inscription', info: 'Secteur Yamoussoukro', time: 'Il y a 2h', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
        { id: 4, user: 'Koffi Yao', type: 'Vente', action: 'Vente enregistrée', info: '150 kg de Maïs', time: 'Il y a 4h', icon: ShoppingBag, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { id: 5, user: 'Système', type: 'Alerte', action: 'Alerte de baisse d\'activité', info: 'Secteur Bouaké', time: 'Il y a 6h', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
        { id: 6, user: 'Fatou Traoré', type: 'Achat', action: 'Participation achat groupé', info: 'Semences Riz', time: 'Ce matin', icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-50' },
        { id: 7, user: 'Bamba I.', type: 'Vente', action: 'Vente enregistrée', info: '500 kg d\'Ignames', time: 'Hier', icon: ShoppingBag, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { id: 8, user: 'Coop Admin', type: 'Alerte', action: 'Message de masse envoyé', info: 'Rappel réunion mensuelle', time: 'Hier', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
    ];

    const filteredActivities = filter === 'Tous'
        ? activities
        : activities.filter(a => a.type === filter);

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 max-w-4xl mx-auto pb-24 md:pb-32">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pt-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm text-slate-600 dark:text-slate-300 active:scale-90 transition-all border-2 border-slate-100 dark:border-slate-800 shrink-0"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Journal d'Activités</h1>
                        <p className="text-purple-600 font-bold text-[10px] uppercase tracking-widest mt-1">Historique Complet</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-3 md:p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 w-full md:w-auto overflow-hidden">
                    <Calendar size={18} className="text-slate-400 ml-2 shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 pr-2 truncate">Mars 2026</span>
                </div>
            </header>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-6 pt-2 -mx-2 md:mx-0 px-2 md:px-0 scrollbar-hide mb-4">
                {['Tous', 'Vente', 'Achat', 'Membre', 'Alerte'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-6 md:px-8 py-3 md:py-4 rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-widest transition-all border-2 whitespace-nowrap ${filter === f ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'}`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Activity List */}
            <div className="space-y-4">
                {filteredActivities.map((act, i) => (
                    <motion.div
                        key={act.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-[24px] md:rounded-[32px] border-2 border-slate-100 dark:border-slate-800 flex items-start sm:items-center gap-4 sm:gap-6 shadow-sm hover:shadow-md transition-shadow group"
                    >
                        <div className={`w-12 h-12 md:w-16 md:h-16 rounded-[20px] md:rounded-[24px] ${act.bg} ${act.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                            <act.icon size={24} className="md:w-7 md:h-7" strokeWidth={2.5} />
                        </div>

                        <div className="flex-1 min-w-0 pt-1 sm:pt-0">
                            <div className="flex justify-between items-start mb-2 sm:mb-1">
                                <h3 className="font-black text-slate-900 dark:text-white uppercase text-xs sm:text-sm tracking-tight truncate pr-2 sm:pr-4">{act.action}</h3>
                                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest whitespace-nowrap mt-0.5 sm:mt-0">{act.time}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                                <div className="flex items-center w-fit gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">{act.user}</span>
                                </div>
                                <span className={`text-[9px] sm:text-[10px] font-bold ${act.color} truncate`}>{act.info}</span>
                            </div>
                        </div>

                        <div className="hidden md:flex flex-col items-end shrink-0">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{act.type}</span>
                            <div className="h-1 w-8 bg-slate-100 dark:bg-slate-800 rounded-full mt-1" />
                        </div>
                    </motion.div>
                ))}

                {filteredActivities.length === 0 && (
                    <div className="text-center py-20 opacity-30 select-none">
                        <ShoppingBag size={80} className="mx-auto mb-4" />
                        <p className="font-black uppercase tracking-[0.2em] text-sm">Aucune activité trouvée</p>
                    </div>
                )}
            </div>

            {/* Load More Simulation */}
            <button className="w-full mt-8 md:mt-10 py-5 md:py-6 rounded-[24px] md:rounded-[30px] border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:border-purple-300 hover:text-purple-500 transition-all active:scale-95">
                Charger les activités précédentes
            </button>
        </main>
    );
}
