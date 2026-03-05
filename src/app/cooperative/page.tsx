'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { LogOut, Users, ShoppingBag, BarChart3, TrendingUp, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CooperativeDashboard() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-3 sm:p-6 max-w-6xl mx-auto pb-24 sm:pb-32">
            <header className="flex justify-between items-center mb-6 sm:mb-8 pt-2 sm:pt-4">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none truncate">Coopérative</h1>
                    <p className="text-purple-600 font-bold mt-0.5 sm:mt-1 uppercase tracking-widest text-[8px] sm:text-[10px]">Dashboard Stratégique</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <button
                        onClick={() => router.push('/profil')}
                        className="p-2 sm:p-3 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-sm text-slate-600 dark:text-slate-300 border-2 border-slate-100 dark:border-slate-800 active:scale-95 transition-all"
                    >
                        <User size={20} className="sm:w-6 sm:h-6" />
                    </button>
                    <button onClick={handleLogout} className="p-2 sm:p-3 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-sm text-rose-500 hover:bg-rose-50 transition-colors border-2 border-slate-100 dark:border-slate-800 active:scale-95">
                        <LogOut size={20} className="sm:w-6 sm:h-6" />
                    </button>
                </div>
            </header>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-10">
                {[
                    { label: 'Membres', value: '1,240', color: 'text-purple-600', bg: 'bg-purple-100/50', trend: '+12' },
                    { label: 'Volume (T)', value: '450', color: 'text-emerald-600', bg: 'bg-emerald-100/50', trend: '+24' },
                    { label: 'Impact', value: '+24%', color: 'text-blue-600', bg: 'bg-blue-100/50', trend: 'Global' },
                    { label: 'Alertes', value: '3', color: 'text-rose-600', bg: 'bg-rose-100/50', trend: 'Critique' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`${stat.bg} p-3 sm:p-6 rounded-[20px] sm:rounded-[32px] border-[1.5px] border-white dark:border-slate-800 shadow-sm relative overflow-hidden`}
                    >
                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1 sm:mb-2">{stat.label}</span>
                        <div className="flex items-end justify-between gap-1">
                            <span className={`text-lg sm:text-3xl font-black ${stat.color}`}>{stat.value}</span>
                            <span className="text-[7px] font-black bg-white/50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded-full text-slate-600 uppercase tracking-tighter">{stat.trend}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-10">
                {/* Main Action Hub (Left 2 Columns) */}
                <div className="lg:col-span-2 grid grid-cols-2 gap-3 sm:gap-6">
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/cooperative/membres')}
                        className="bg-purple-600 p-4 sm:p-8 rounded-[24px] sm:rounded-[40px] text-white flex flex-col items-center justify-center gap-3 sm:gap-6 shadow-xl active:scale-95 transition-all min-h-[140px] sm:min-h-[240px] border-b-4 sm:border-b-8 border-purple-800 relative overflow-hidden group"
                    >
                        <div className="bg-white/20 p-2.5 sm:p-6 rounded-xl sm:rounded-[30px] group-hover:scale-110 transition-all">
                            <Users size={32} className="sm:w-14 sm:h-14" strokeWidth={2.5} />
                        </div>
                        <div className="text-center">
                            <span className="block font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-xs sm:text-2xl">Membres</span>
                            <p className="text-[8px] font-bold opacity-60 uppercase tracking-widest mt-0.5 hidden sm:block">Gestion & Secteurs</p>
                        </div>
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/cooperative/achats')}
                        className="bg-emerald-600 p-4 sm:p-8 rounded-[24px] sm:rounded-[40px] text-white flex flex-col items-center justify-center gap-3 sm:gap-6 shadow-xl active:scale-95 transition-all min-h-[140px] sm:min-h-[240px] border-b-4 sm:border-b-8 border-emerald-800 relative overflow-hidden group"
                    >
                        <div className="bg-white/20 p-2.5 sm:p-6 rounded-xl sm:rounded-[30px] group-hover:scale-110 transition-all">
                            <ShoppingBag size={32} className="sm:w-14 sm:h-14" strokeWidth={2.5} />
                        </div>
                        <div className="text-center">
                            <span className="block font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-xs sm:text-2xl">Achats</span>
                            <p className="text-[8px] font-bold opacity-60 uppercase tracking-widest mt-0.5 hidden sm:block">Logistique & Stocks</p>
                        </div>
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/cooperative/analyses')}
                        className="bg-blue-600 p-4 sm:p-8 rounded-[24px] sm:rounded-[40px] text-white flex flex-col items-center justify-center gap-3 sm:gap-6 shadow-xl active:scale-95 transition-all min-h-[140px] sm:min-h-[240px] border-b-4 sm:border-b-8 border-blue-800 relative overflow-hidden group"
                    >
                        <div className="bg-white/20 p-2.5 sm:p-6 rounded-xl sm:rounded-[30px] group-hover:scale-110 transition-all">
                            <BarChart3 size={32} className="sm:w-14 sm:h-14" strokeWidth={2.5} />
                        </div>
                        <div className="text-center">
                            <span className="block font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-xs sm:text-2xl">Analyses</span>
                            <p className="text-[8px] font-bold opacity-60 uppercase tracking-widest mt-0.5 hidden sm:block">Tendances & Marchés</p>
                        </div>
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/cooperative/performances')}
                        className="bg-amber-500 p-4 sm:p-8 rounded-[24px] sm:rounded-[40px] text-white flex flex-col items-center justify-center gap-3 sm:gap-6 shadow-xl active:scale-95 transition-all min-h-[140px] sm:min-h-[240px] border-b-4 sm:border-b-8 border-amber-600 relative overflow-hidden group"
                    >
                        <div className="bg-white/20 p-2.5 sm:p-6 rounded-xl sm:rounded-[30px] group-hover:scale-110 transition-all">
                            <TrendingUp size={32} className="sm:w-14 sm:h-14" strokeWidth={2.5} />
                        </div>
                        <div className="text-center">
                            <span className="block font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-xs sm:text-2xl">Objectifs</span>
                            <p className="text-[8px] font-bold opacity-60 uppercase tracking-widest mt-0.5 hidden sm:block">Impact & Suivi</p>
                        </div>
                    </motion.button>
                </div>

                {/* Status Sidebar (Activity & Deadlines) */}
                <div className="space-y-6">
                    {/* Activity Feed */}
                    <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-6 md:p-8 rounded-[32px] md:rounded-[40px] shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Flux d'activités</h3>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-200" />
                        </div>
                        <div className="space-y-8">
                            {[
                                { user: 'Adama D.', action: 'Vente record', info: '+450k F', time: '12m', color: 'text-emerald-500' },
                                { user: 'Marie K.', action: 'Nouvelle membre', info: 'Yamoussoukro', time: '1h', color: 'text-purple-500' },
                                { user: 'COFIN-1', action: 'Achat validé', info: 'Engrais NPK', time: '3h', color: 'text-blue-500' },
                            ].map((act, i) => (
                                <div key={i} className="flex gap-4 group cursor-pointer">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-500 transition-all shrink-0 border-2 border-transparent group-hover:border-purple-100 uppercase font-black text-xs">
                                        {act.user.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <p className="font-black uppercase text-[11px] text-slate-900 dark:text-white leading-tight">{act.user}</p>
                                            <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{act.time}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1">
                                            {act.action} : <span className={act.color}>{act.info}</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => router.push('/cooperative/journal')}
                            className="w-full mt-8 py-4 rounded-2xl border-2 border-slate-50 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:text-slate-600 active:scale-95"
                        >
                            Voir le journal complet
                        </button>
                    </div>

                    {/* Critical Deadlines */}
                    <div className="bg-rose-50 dark:bg-rose-900/10 border-2 border-rose-100 dark:border-rose-900/20 p-6 md:p-8 rounded-[32px] md:rounded-[40px] shadow-sm relative overflow-hidden">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-400 mb-6">Échéances critiques</h3>
                        <div className="space-y-4 relative z-10">
                            {[
                                { title: 'Objectif NPK', target: '200 sacs', left: '2h 15m', progress: 85 },
                                { title: 'Maïs Semences', target: '500 kg', left: '4h 30m', progress: 40 },
                            ].map((dead, i) => (
                                <div key={i} className="bg-white/80 dark:bg-slate-800/80 p-5 rounded-[24px] md:rounded-[28px] border-2 border-rose-100 dark:border-rose-900/20 shadow-sm group hover:scale-[1.02] transition-transform">
                                    <p className="font-black uppercase text-[10px] text-rose-500 mb-2">{dead.title}</p>
                                    <div className="flex justify-between items-end mb-3">
                                        <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{dead.left}</span>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{dead.target}</span>
                                    </div>
                                    <div className="h-2 w-full bg-rose-100 dark:bg-rose-900/30 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${dead.progress}%` }}
                                            className="h-full bg-rose-500 rounded-full"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Insight Bar */}
            <motion.section
                whileHover={{ scale: 1.01 }}
                className="bg-slate-900 dark:bg-slate-800 p-6 md:p-8 rounded-[32px] md:rounded-[48px] text-white flex flex-col md:flex-row items-center gap-6 md:gap-10 shadow-2xl relative overflow-hidden border-b-[8px] md:border-b-[12px] border-purple-600"
            >
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 md:p-7 rounded-[28px] md:rounded-[35px] shadow-xl shadow-purple-500/30 relative z-10 animate-bounce-subtle shrink-0">
                    <TrendingUp size={36} className="md:w-[44px] md:h-[44px]" strokeWidth={3} />
                </div>
                <div className="flex-1 text-center md:text-left relative z-10">
                    <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
                        <span className="w-8 h-0.5 bg-purple-500" />
                        <h4 className="text-purple-400 font-black uppercase tracking-[0.3em] text-[10px]">Analyse Prédictive</h4>
                    </div>
                    <p className="text-lg md:text-2xl font-bold italic opacity-95 leading-tight max-w-2xl">
                        "La demande en riz local augmente de <span className="text-emerald-400">15% à Bouaké</span>. C'est le moment idéal pour coordonner un achat groupé de semences."
                    </p>
                </div>
                <button
                    onClick={() => router.push('/cooperative/achats')}
                    className="w-full md:w-auto bg-white text-slate-900 px-6 py-4 md:px-10 md:py-6 rounded-[24px] md:rounded-[30px] font-black uppercase text-[10px] md:text-xs tracking-[0.2em] hover:bg-purple-50 transition-all shrink-0 relative z-10 shadow-2xl hover:shadow-purple-500/20 active:scale-95"
                >
                    Coordonner l'achat
                </button>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -ml-24 -mb-24" />
            </motion.section>
        </main>
    );
}
