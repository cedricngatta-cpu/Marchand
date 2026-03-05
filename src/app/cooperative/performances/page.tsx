'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Target, TrendingUp, Award, Users, Zap, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CooperativePerformances() {
    const router = useRouter();

    const goals = [
        { name: 'Inclusion Financière', progress: 85, target: '100%', icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { name: 'Volume d\'Achats Groupés', progress: 62, target: '500T', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
        { name: 'Nouveaux Membres', progress: 40, target: '2000', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    ];

    const topMembers = [
        { name: 'Marie Koné', impact: 'High', points: 1250, badge: 'Or' },
        { name: 'Kouamé Koffi', impact: 'Medium', points: 980, badge: 'Argent' },
        { name: 'Fatou Traoré', impact: 'High', points: 840, badge: 'Bronze' },
    ];

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 max-w-4xl mx-auto pb-24 md:pb-32">
            <header className="flex items-center gap-4 mb-8 md:mb-10 pt-4">
                <button
                    onClick={() => router.back()}
                    className="w-12 h-12 shrink-0 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm text-slate-600 dark:text-slate-300 active:scale-90 transition-all border border-slate-100 dark:border-slate-800"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Performances</h1>
                    <p className="text-amber-600 font-bold text-[10px] uppercase tracking-widest mt-1">Impact & Objectifs</p>
                </div>
            </header>

            <div className="space-y-6 md:space-y-8">
                {/* Impact Summary */}
                <div className="bg-slate-900 dark:bg-amber-900/20 p-6 md:p-10 rounded-[32px] md:rounded-[45px] text-white shadow-2xl relative overflow-hidden border-4 border-amber-400">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-6 md:gap-8">
                        <div>
                            <span className="text-amber-400 font-black uppercase text-[10px] md:text-xs tracking-widest">Score d'Impact Global</span>
                            <div className="text-6xl md:text-7xl font-black mt-2 tracking-tighter text-amber-500">8.2<span className="text-xl md:text-2xl opacity-50 ml-1 md:ml-2">/10</span></div>
                            <p className="text-white/60 font-bold max-w-xs mx-auto md:mx-0 mt-4 uppercase text-[9px] md:text-[10px] tracking-widest">Calculé selon l'activité et l'entraide des membres.</p>
                        </div>
                        <Award size={100} className="md:w-[140px] md:h-[140px] text-amber-400 opacity-20 absolute md:relative -right-10 -bottom-10 md:-right-0 md:-bottom-0 hidden sm:block" />
                    </div>
                </div>

                {/* Goals Tracking */}
                <section className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4 md:ml-8 mb-4 md:mb-6 text-center md:text-left">Objectifs en cours</h3>
                    <div className="grid grid-cols-1 gap-4">
                        {goals.map((goal, i) => (
                            <motion.div
                                key={i}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[32px] md:rounded-[40px] border-2 border-slate-50 dark:border-slate-800 shadow-sm"
                            >
                                <div className="flex items-center justify-between mb-4 md:mb-6 gap-2">
                                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                        <div className={`w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-[20px] md:rounded-2xl ${goal.bg} ${goal.color} flex items-center justify-center`}>
                                            <goal.icon size={24} className="md:w-7 md:h-7" />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-base md:text-xl leading-none mb-1 truncate">{goal.name}</h4>
                                            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">Cible : {goal.target}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xl md:text-2xl font-black ${goal.color} shrink-0`}>{goal.progress}%</span>
                                </div>
                                <div className="h-4 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden p-1 shadow-inner">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${goal.progress}%` }}
                                        className={`h-full rounded-full ${goal.color.replace('text', 'bg')} shadow-lg`}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Leaderboard / Top Contributors */}
                <section className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[32px] md:rounded-[40px] border-2 border-slate-50 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 mb-6 md:mb-8">
                        <Award className="text-amber-500" size={24} />
                        <h2 className="font-black uppercase text-slate-400 tracking-widest text-xs md:text-sm">Champions de la semaine</h2>
                    </div>

                    <div className="space-y-4">
                        {topMembers.map((member, i) => (
                            <div key={i} className="flex items-center justify-between p-4 md:p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-700 gap-2">
                                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                    <span className="text-xl md:text-2xl font-black text-slate-300 w-6 md:w-8 shrink-0">{i + 1}</span>
                                    <div className="min-w-0">
                                        <h5 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm md:text-base truncate">{member.name}</h5>
                                        <div className="flex items-center gap-2 mt-0.5 md:mt-1">
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full whitespace-nowrap ${member.impact === 'High' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>{member.impact} IMPACT</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="text-base md:text-lg font-black text-slate-900 dark:text-white">{member.points}</div>
                                    <div className="text-[7px] md:text-[8px] font-black text-slate-300 uppercase tracking-widest">Points</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Certification Badge */}
                <div className="bg-emerald-600 p-6 md:p-8 rounded-[32px] md:rounded-[40px] text-white flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-6 shadow-xl shadow-emerald-100 dark:shadow-none">
                    <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 min-w-0">
                        <div className="bg-white/20 p-4 rounded-[20px] md:rounded-2xl shrink-0">
                            <CheckCircle2 size={32} />
                        </div>
                        <div className="min-w-0">
                            <p className="font-black uppercase text-[10px] md:text-xs tracking-widest text-emerald-100 mb-1">Status Coopérative</p>
                            <p className="text-xl md:text-2xl font-black uppercase tracking-tight truncate">Label Argent</p>
                        </div>
                    </div>
                    <button className="w-full sm:w-auto bg-slate-900 px-6 py-4 rounded-[20px] md:rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-transform shadow-lg shrink-0">Certificat</button>
                </div>
            </div>
        </main>
    );
}
