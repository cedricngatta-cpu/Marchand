'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BarChart3, TrendingUp, MapPin, PieChart, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CooperativeAnalyses() {
    const router = useRouter();

    const regionalStats = [
        { zone: 'Bouaké', demand: 'Riz, Maïs', growth: '+18%', color: 'bg-emerald-500' },
        { zone: 'Yamoussoukro', demand: 'Tomate, Oignon', growth: '+5%', color: 'bg-blue-500' },
        { zone: 'Abidjan', demand: 'Manioc, Igname', growth: '+22%', color: 'bg-purple-500' },
        { zone: 'Korhogo', demand: 'Coton, Noix', growth: '-2%', color: 'bg-rose-500' },
    ];

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 max-w-4xl mx-auto pb-24 md:pb-32">
            <header className="flex items-center gap-4 mb-8 md:mb-10 pt-4">
                <button
                    onClick={() => router.back()}
                    className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm text-slate-600 dark:text-slate-300 active:scale-90 transition-all border border-slate-100 dark:border-slate-800 shrink-0"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Analyses Sectorielles</h1>
                    <p className="text-blue-600 font-bold text-[10px] uppercase tracking-widest mt-1">Intelligence de Marché</p>
                </div>
            </header>

            <div className="space-y-6 md:space-y-8">
                {/* Main Insight Card */}
                <div className="bg-blue-600 p-6 md:p-10 rounded-[32px] md:rounded-[45px] text-white shadow-2xl shadow-blue-200 dark:shadow-none relative overflow-hidden">
                    <div className="relative z-10">
                        <span className="text-blue-100 font-black uppercase text-[10px] md:text-xs tracking-widest">Tendance Globale</span>
                        <h2 className="text-2xl md:text-4xl font-black mt-2 mb-4 md:mb-6 leading-tight max-w-[90%] md:max-w-full">Augmentation de la demande en produits vivriers de +12% ce mois-ci.</h2>
                        <div className="flex items-center gap-2 bg-white/20 w-fit px-3 py-1.5 md:px-4 md:py-2 rounded-full backdrop-blur-md">
                            <TrendingUp size={16} className="md:w-5 md:h-5" />
                            <span className="font-black uppercase text-[9px] md:text-[10px] tracking-widest">Optimiste</span>
                        </div>
                    </div>
                    <PieChart size={160} className="absolute -right-12 -bottom-12 md:-right-16 md:-bottom-16 text-white/10 rotate-12 md:w-[200px] md:h-[200px]" />
                </div>

                {/* Regional Breakdown */}
                <section>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4 md:ml-8 mb-4 md:mb-6 text-center md:text-left">Performance par Zone</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {regionalStats.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-[24px] md:rounded-[35px] border-2 border-slate-50 dark:border-slate-800 flex items-center justify-between gap-4 group hover:border-blue-200 transition-colors"
                            >
                                <div className="flex items-center gap-4 md:gap-5">
                                    <div className={`w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-[18px] md:rounded-2xl ${stat.color} flex items-center justify-center text-white shadow-lg`}>
                                        <MapPin size={24} />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-black text-slate-900 dark:text-white uppercase text-sm md:text-base tracking-tight truncate">{stat.zone}</h4>
                                        <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 md:mt-1 truncate">{stat.demand}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-xl font-black ${stat.growth.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {stat.growth}
                                    </div>
                                    <div className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">vs mois dernier</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Market Advice */}
                <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[32px] md:rounded-[40px] border-2 border-slate-100 dark:border-slate-800 relative group overflow-hidden">
                    <div className="relative z-10 flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                        <div className="bg-slate-900 dark:bg-white p-3 md:p-4 rounded-xl md:rounded-2xl text-white dark:text-slate-900 shrink-0">
                            <BarChart3 size={20} className="md:w-6 md:h-6" />
                        </div>
                        <div>
                            <p className="text-slate-900 dark:text-white font-black uppercase tracking-widest text-[10px] md:text-xs mb-1 md:mb-2">Opportunité détectée</p>
                            <p className="text-slate-600 dark:text-slate-400 font-bold text-sm md:text-base leading-relaxed">
                                Les prix de gros du Maïs à Yamoussoukro sont actuellement 15% plus bas que la moyenne nationale. Un achat groupé massif est recommandé.
                            </p>
                        </div>
                    </div>
                    <ArrowUpRight size={100} className="absolute -right-4 -bottom-4 text-slate-50 dark:text-slate-800 group-hover:scale-110 transition-transform" />
                </div>
            </div>
        </main>
    );
}
