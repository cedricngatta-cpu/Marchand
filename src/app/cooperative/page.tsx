'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { LogOut, Users, ShoppingBag, BarChart3, TrendingUp, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CooperativeDashboard() {
    const { logout } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 max-w-6xl mx-auto pb-24 sm:pb-32">
            <header className="flex justify-between items-center mb-8 pt-2">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate">Coopérative</h1>
                    <p className="text-primary font-semibold mt-0.5 uppercase tracking-wider text-[10px]">Espace Gestionnaire</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <button
                        onClick={() => router.push('/profil')}
                        className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800 flex items-center justify-center active:scale-95 transition-all"
                    >
                        <User size={20} />
                    </button>
                    <button onClick={handleLogout} className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-rose-500 border border-slate-100 dark:border-slate-800 flex items-center justify-center active:scale-95 transition-all">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Membres', value: '1,240', color: 'text-purple-600', bg: 'bg-purple-50', trend: '+12' },
                    { label: 'Volume (T)', value: '450', color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+24' },
                    { label: 'Impact', value: '+24%', color: 'text-blue-600', bg: 'bg-blue-50', trend: 'Global' },
                    { label: 'Alertes', value: '3', color: 'text-rose-600', bg: 'bg-rose-50', trend: 'Critique' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`${stat.bg} p-5 rounded-2xl border border-white/50 dark:border-slate-800 shadow-sm flex flex-col gap-1`}
                    >
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</span>
                        <div className="flex items-baseline justify-between gap-1">
                            <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
                            <span className="text-[8px] font-bold bg-white/60 px-1.5 py-0.5 rounded-full text-slate-400">{stat.trend}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Main Action Hub */}
                <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/cooperative/membres')}
                        className="bg-primary p-6 rounded-2xl text-white flex flex-col items-center justify-center gap-4 shadow-md active:scale-95 transition-all min-h-[160px] relative overflow-hidden group"
                    >
                        <div className="bg-white/20 p-4 rounded-xl group-hover:scale-110 transition-transform">
                            <Users size={28} />
                        </div>
                        <div className="text-center">
                            <span className="block font-bold uppercase tracking-wider text-sm">Membres</span>
                            <p className="text-[9px] font-medium opacity-70 mt-1 uppercase tracking-wider">Gestion & Secteurs</p>
                        </div>
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/cooperative/achats')}
                        className="bg-emerald-600 p-6 rounded-2xl text-white flex flex-col items-center justify-center gap-4 shadow-md active:scale-95 transition-all min-h-[160px] relative overflow-hidden group"
                    >
                        <div className="bg-white/20 p-4 rounded-xl group-hover:scale-110 transition-transform">
                            <ShoppingBag size={28} />
                        </div>
                        <div className="text-center">
                            <span className="block font-bold uppercase tracking-wider text-sm">Achats</span>
                            <p className="text-[9px] font-medium opacity-70 mt-1 uppercase tracking-wider">Logistique & Stocks</p>
                        </div>
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/cooperative/analyses')}
                        className="bg-blue-600 p-6 rounded-2xl text-white flex flex-col items-center justify-center gap-4 shadow-md active:scale-95 transition-all min-h-[160px] relative overflow-hidden group"
                    >
                        <div className="bg-white/20 p-4 rounded-xl group-hover:scale-110 transition-transform">
                            <BarChart3 size={28} />
                        </div>
                        <div className="text-center">
                            <span className="block font-bold uppercase tracking-wider text-sm">Analyses</span>
                            <p className="text-[9px] font-medium opacity-70 mt-1 uppercase tracking-wider">Tendances & Marchés</p>
                        </div>
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/cooperative/performances')}
                        className="bg-amber-500 p-6 rounded-2xl text-white flex flex-col items-center justify-center gap-4 shadow-md active:scale-95 transition-all min-h-[160px] relative overflow-hidden group"
                    >
                        <div className="bg-white/20 p-4 rounded-xl group-hover:scale-110 transition-transform">
                            <TrendingUp size={28} />
                        </div>
                        <div className="text-center">
                            <span className="block font-bold uppercase tracking-wider text-sm">Objectifs</span>
                            <p className="text-[9px] font-medium opacity-70 mt-1 uppercase tracking-wider">Impact & Suivi</p>
                        </div>
                    </motion.button>
                </div>

                {/* Sidebar Activity */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Activités Récentes</h3>
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        </div>
                        <div className="space-y-6">
                            {[
                                { user: 'Adama D.', action: 'Vente record', info: '+450k F', time: '12m', color: 'text-emerald-500' },
                                { user: 'Marie K.', action: 'Nouvelle membre', info: 'Yamoussoukro', time: '1h', color: 'text-purple-500' },
                                { user: 'COFIN-1', action: 'Achat validé', info: 'Engrais NPK', time: '3h', color: 'text-blue-500' },
                            ].map((act, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs shrink-0 uppercase border border-slate-100 dark:border-slate-700">
                                        {act.user.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className="font-bold uppercase text-[10px] text-slate-900 dark:text-white truncate">{act.user}</p>
                                            <span className="text-[8px] font-medium text-slate-400 uppercase">{act.time}</span>
                                        </div>
                                        <p className="text-[9px] text-slate-500 font-bold mt-1">
                                            {act.action} : <span className={act.color}>{act.info}</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => router.push('/cooperative/journal')}
                            className="w-full mt-6 py-3 rounded-xl border border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:bg-slate-50 transition-all active:scale-95"
                        >
                            Journal complet
                        </button>
                    </div>

                    <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 p-6 rounded-2xl shadow-sm">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-5">Échéances critiques</h3>
                        <div className="space-y-4">
                            {[
                                { title: 'Objectif NPK', target: '200 sacs', left: '2h 15m', progress: 85 },
                                { title: 'Maïs Semences', target: '500 kg', left: '4h 30m', progress: 40 },
                            ].map((dead, i) => (
                                <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-rose-100 dark:border-rose-900/30">
                                    <p className="font-bold uppercase text-[9px] text-rose-500 mb-2">{dead.title}</p>
                                    <div className="flex justify-between items-baseline mb-3">
                                        <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{dead.left}</span>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{dead.target}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
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
                whileHover={{ y: -2 }}
                className="bg-slate-900 p-6 rounded-2xl text-white flex flex-col md:flex-row items-center gap-6 shadow-xl relative overflow-hidden border-b-4 border-primary"
            >
                <div className="bg-primary p-5 rounded-xl shadow-lg shadow-emerald-500/20 shrink-0">
                    <TrendingUp size={28} strokeWidth={2.5} />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                        <h4 className="text-primary font-bold uppercase tracking-wider text-[10px]">Analyse IA</h4>
                    </div>
                    <p className="text-base font-bold italic opacity-95 leading-snug max-w-2xl">
                        "La demande en riz local augmente de <span className="text-emerald-400">15% à Bouaké</span>. C'est le moment idéal pour coordonner un achat groupé."
                    </p>
                </div>
                <button
                    onClick={() => router.push('/cooperative/achats')}
                    className="w-full md:w-auto bg-white text-slate-900 px-8 py-3.5 rounded-xl font-bold uppercase text-[10px] tracking-wider hover:bg-slate-50 transition-all active:scale-95 shadow-lg"
                >
                    Coordonner
                </button>
            </motion.section>
        </main>
    );
}
