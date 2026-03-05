'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Store, MapPin, Activity, AlertCircle, TrendingUp, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AgentSector() {
    const router = useRouter();

    const boutiques = [
        { id: 1, name: "Boutique chez Koffi", owner: "Koffi M.", sector: "Quartier 1", health: "HEALTHY", lastActivity: "Il y a 10 min", sales: "24.5k F" },
        { id: 2, name: "Ma Campagne", owner: "Fatou T.", sector: "Centreville", health: "WARNING", lastActivity: "Il y a 2 jours", sales: "3.2k F" },
        { id: 3, name: "Petit Marché", owner: "Moussa S.", sector: "Quartier 1", health: "HEALTHY", lastActivity: "Il y a 1h", sales: "12.8k F" },
        { id: 4, name: "Épicerie du Coin", owner: "Marie K.", sector: "Zone Ouest", health: "CRITICAL", lastActivity: "Semaine dernière", sales: "0 F" },
    ];

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 max-w-4xl mx-auto pb-32">
            <header className="flex items-center gap-4 mb-8 pt-4">
                <button
                    onClick={() => router.back()}
                    className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm text-slate-600 dark:text-slate-300 active:scale-90 transition-all"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Mon Secteur</h1>
                    <p className="text-emerald-600 font-bold text-[10px] uppercase tracking-widest mt-1">Supervision Locale</p>
                </div>
            </header>

            {/* Search Bar */}
            <div className="relative mb-8">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                <input
                    type="text"
                    placeholder="Chercher une boutique..."
                    className="w-full bg-white dark:bg-slate-900 border-4 border-slate-100 dark:border-slate-800 rounded-[30px] p-6 pl-16 font-black text-lg text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all"
                />
            </div>

            <div className="space-y-4">
                {boutiques.map((b) => (
                    <motion.div
                        key={b.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-900 p-6 rounded-[35px] shadow-sm border-2 border-slate-100 dark:border-slate-800 flex items-center justify-between group cursor-pointer hover:border-cyan-200"
                    >
                        <div className="flex items-center gap-6">
                            <div className={`p-5 rounded-[25px] ${b.health === 'HEALTHY' ? 'bg-emerald-50 text-emerald-500' :
                                b.health === 'WARNING' ? 'bg-amber-50 text-amber-500' : 'bg-rose-50 text-rose-500'
                                }`}>
                                <Store size={32} />
                            </div>
                            <div>
                                <h3 className="font-black uppercase tracking-tight text-slate-900 dark:text-white text-lg leading-tight">{b.name}</h3>
                                <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span className="flex items-center gap-1"><MapPin size={12} /> {b.sector}</span>
                                    <span className="flex items-center gap-1"><Activity size={12} /> {b.lastActivity}</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="text-xl font-black text-slate-900 dark:text-white mb-1 group-hover:text-cyan-600 transition-colors">{b.sales}</div>
                            <div className={`flex items-center gap-1 justify-end font-black uppercase text-[8px] tracking-[0.2em] ${b.health === 'HEALTHY' ? 'text-emerald-500' :
                                b.health === 'WARNING' ? 'text-amber-500' : 'text-rose-500'
                                }`}>
                                {b.health === 'HEALTHY' ? <TrendingUp size={10} /> : <AlertCircle size={10} />}
                                {b.health}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Hint */}
            <div className="mt-12 p-8 bg-cyan-50 dark:bg-cyan-900/10 rounded-[40px] border-2 border-cyan-100 dark:border-cyan-900/20 text-center">
                <p className="text-cyan-800 dark:text-cyan-200 font-bold italic leading-relaxed">
                    "Agent, n'oublie pas de visiter Marie K. cette semaine, elle n'a pas enregistré de ventes depuis longtemps."
                </p>
            </div>
        </main>
    );
}
