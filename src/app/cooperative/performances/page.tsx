'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Target, TrendingUp, Award, Users, Zap, CheckCircle2, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const formatCFA = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + '\u00A0F';

interface TopMember {
    storeId: string;
    storeName: string;
    ownerName: string;
    volume: number;
    txCount: number;
}

interface PerfData {
    impactScore: number;
    totalMembers: number;
    activeMembers: number;
    monthlyVolume: number;
    topMembers: TopMember[];
    loading: boolean;
}

const BADGE_COLORS = ['bg-amber-100 text-amber-700', 'bg-slate-200 text-slate-600', 'bg-orange-100 text-orange-700'];
const BADGE_LABELS = ['Or', 'Argent', 'Bronze'];
const VOLUME_TARGET = 500_000;
const MEMBERS_TARGET = 50;

export default function CooperativePerformances() {
    const router = useRouter();
    const [perf, setPerf] = useState<PerfData>({
        impactScore: 0, totalMembers: 0, activeMembers: 0,
        monthlyVolume: 0, topMembers: [], loading: true,
    });

    const load = async () => {
        setPerf(d => ({ ...d, loading: true }));
        try {
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            const [{ count: totalMembers }, { data: currentTx }] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['MERCHANT', 'PRODUCER']),
                supabase.from('transactions').select('store_id, price').gte('created_at', monthStart),
            ]);

            const monthlyVolume = (currentTx ?? []).reduce((s, t) => s + (t.price ?? 0), 0);

            // Active store IDs this month
            const activeStoreIds = [...new Set((currentTx ?? []).map(t => t.store_id).filter(Boolean))];

            // Group volume by store
            const storeVolMap: Record<string, { volume: number; count: number }> = {};
            for (const tx of currentTx ?? []) {
                const s = tx.store_id;
                if (!s) continue;
                if (!storeVolMap[s]) storeVolMap[s] = { volume: 0, count: 0 };
                storeVolMap[s].volume += tx.price ?? 0;
                storeVolMap[s].count += 1;
            }
            const topStoreIds = Object.entries(storeVolMap)
                .sort((a, b) => b[1].volume - a[1].volume)
                .slice(0, 3)
                .map(([id]) => id);

            let topMembers: TopMember[] = [];
            if (topStoreIds.length > 0) {
                const { data: stores } = await supabase
                    .from('stores')
                    .select('id, name, owner_id')
                    .in('id', topStoreIds);

                const ownerIds = (stores ?? []).map(s => s.owner_id).filter(Boolean);
                const { data: profiles } = ownerIds.length > 0
                    ? await supabase.from('profiles').select('id, name').in('id', ownerIds)
                    : { data: [] };

                const profileMap: Record<string, string> = {};
                for (const p of profiles ?? []) profileMap[p.id] = p.name ?? '—';

                topMembers = topStoreIds.map(sid => {
                    const store = (stores ?? []).find(s => s.id === sid);
                    return {
                        storeId: sid,
                        storeName: store?.name ?? 'Boutique',
                        ownerName: store ? (profileMap[store.owner_id] ?? '—') : '—',
                        volume: storeVolMap[sid]?.volume ?? 0,
                        txCount: storeVolMap[sid]?.count ?? 0,
                    };
                });
            }

            const tm = totalMembers ?? 0;
            const am = activeStoreIds.length;
            const rawScore = tm > 0 ? (am / tm) * 10 : 0;
            const impactScore = parseFloat(Math.min(10, rawScore * 1.5).toFixed(1));

            setPerf({ impactScore, totalMembers: tm, activeMembers: am, monthlyVolume, topMembers, loading: false });
        } catch (err) {
            console.error('[Performances] fetch error:', err);
            setPerf(d => ({ ...d, loading: false }));
        }
    };

    useEffect(() => { load(); }, []);

    const activeProgress = perf.totalMembers > 0 ? Math.round((perf.activeMembers / perf.totalMembers) * 100) : 0;
    const volumeProgress = Math.min(100, Math.round((perf.monthlyVolume / VOLUME_TARGET) * 100));
    const membersProgress = Math.min(100, Math.round((perf.totalMembers / MEMBERS_TARGET) * 100));

    const goals = [
        {
            name: 'Membres Actifs', progress: activeProgress,
            target: `${perf.totalMembers} membres`, value: `${perf.activeMembers}/${perf.totalMembers}`,
            icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        },
        {
            name: 'Volume Mensuel', progress: volumeProgress,
            target: formatCFA(VOLUME_TARGET), value: formatCFA(perf.monthlyVolume),
            icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20',
        },
        {
            name: 'Membres Inscrits', progress: membersProgress,
            target: `${MEMBERS_TARGET} membres`, value: `${perf.totalMembers}`,
            icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20',
        },
    ];

    const certLabel = perf.impactScore >= 8 ? 'Label Or' : perf.impactScore >= 5 ? 'Label Argent' : 'Label Bronze';
    const certBg = perf.impactScore >= 8 ? 'bg-amber-500 shadow-amber-200' : perf.impactScore >= 5 ? 'bg-emerald-600 shadow-emerald-100' : 'bg-slate-700';

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 max-w-4xl mx-auto pb-24 md:pb-32">
            <header className="flex items-center justify-between gap-4 mb-8 md:mb-10 pt-4">
                <div className="flex items-center gap-4">
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
                </div>
                <button
                    onClick={load}
                    className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm text-slate-400 border border-slate-100 dark:border-slate-700 active:scale-90 transition-all shrink-0"
                >
                    <RefreshCcw size={16} />
                </button>
            </header>

            <div className="space-y-6 md:space-y-8">

                {/* Impact Summary */}
                <div className="bg-slate-900 dark:bg-amber-900/20 p-6 md:p-10 rounded-[32px] md:rounded-[45px] text-white shadow-2xl relative overflow-hidden border-4 border-amber-400">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-6 md:gap-8">
                        <div>
                            <span className="text-amber-400 font-black uppercase text-[10px] md:text-xs tracking-widest">
                                Score d'Impact Global
                            </span>
                            {perf.loading ? (
                                <div className="h-16 w-32 bg-white/10 rounded-xl animate-pulse mt-2 mb-4" />
                            ) : (
                                <div className="text-6xl md:text-7xl font-black mt-2 tracking-tighter text-amber-500">
                                    {perf.impactScore.toFixed(1)}
                                    <span className="text-xl md:text-2xl opacity-50 ml-1 md:ml-2">/10</span>
                                </div>
                            )}
                            <p className="text-white/60 font-bold max-w-xs mx-auto md:mx-0 mt-4 uppercase text-[9px] md:text-[10px] tracking-widest">
                                {perf.loading
                                    ? '...'
                                    : `${perf.activeMembers} membre${perf.activeMembers > 1 ? 's' : ''} actif${perf.activeMembers > 1 ? 's' : ''} sur ${perf.totalMembers} inscrits`}
                            </p>
                        </div>
                        <Award size={100} className="md:w-[140px] md:h-[140px] text-amber-400 opacity-20 absolute md:relative -right-10 -bottom-10 md:right-0 md:bottom-0 hidden sm:block" />
                    </div>
                </div>

                {/* Goals Tracking */}
                <section className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4 md:ml-8 mb-4 md:mb-6 text-center md:text-left">
                        Objectifs en cours
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        {goals.map((goal, i) => (
                            <motion.div
                                key={goal.name}
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
                                            <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-base md:text-xl leading-none mb-1 truncate">
                                                {goal.name}
                                            </h4>
                                            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                                                {perf.loading ? '...' : goal.value} · Cible : {goal.target}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-xl md:text-2xl font-black ${goal.color} shrink-0`}>
                                        {perf.loading ? '—' : `${goal.progress}%`}
                                    </span>
                                </div>
                                <div className="h-4 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden p-1 shadow-inner">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: perf.loading ? '0%' : `${goal.progress}%` }}
                                        transition={{ duration: 0.8, delay: i * 0.15 }}
                                        className={`h-full rounded-full ${goal.color.replace('text', 'bg')} shadow-lg`}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Leaderboard */}
                <section className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[32px] md:rounded-[40px] border-2 border-slate-50 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 mb-6 md:mb-8">
                        <Award className="text-amber-500" size={24} />
                        <h2 className="font-black uppercase text-slate-400 tracking-widest text-xs md:text-sm">
                            Top Marchands ce mois
                        </h2>
                    </div>

                    {perf.loading ? (
                        <div className="space-y-3">
                            {[0, 1, 2].map(i => (
                                <div key={i} className="h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : perf.topMembers.length === 0 ? (
                        <div className="py-8 text-center">
                            <TrendingUp size={32} className="mx-auto text-slate-200 dark:text-slate-700 mb-2" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-600">
                                Aucune vente enregistrée ce mois
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {perf.topMembers.map((member, i) => (
                                <div
                                    key={member.storeId}
                                    className="flex items-center justify-between p-4 md:p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-700 gap-2"
                                >
                                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                        <span className="text-xl md:text-2xl font-black text-slate-300 w-6 md:w-8 shrink-0">{i + 1}</span>
                                        <div className="min-w-0">
                                            <h5 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm md:text-base truncate">
                                                {member.ownerName}
                                            </h5>
                                            <div className="flex items-center gap-2 mt-0.5 md:mt-1">
                                                <span className="text-[8px] font-bold text-slate-400 truncate">{member.storeName}</span>
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full whitespace-nowrap ${BADGE_COLORS[i] ?? 'bg-slate-100 text-slate-500'}`}>
                                                    {BADGE_LABELS[i]}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-sm font-black text-slate-900 dark:text-white">{formatCFA(member.volume)}</div>
                                        <div className="text-[7px] md:text-[8px] font-black text-slate-300 uppercase tracking-widest">
                                            {member.txCount} vente{member.txCount > 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Certification Badge */}
                <div className={`${certBg} p-6 md:p-8 rounded-[32px] md:rounded-[40px] text-white flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-6 shadow-xl dark:shadow-none`}>
                    <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 min-w-0">
                        <div className="bg-white/20 p-4 rounded-[20px] md:rounded-2xl shrink-0">
                            <CheckCircle2 size={32} />
                        </div>
                        <div className="min-w-0">
                            <p className="font-black uppercase text-[10px] md:text-xs tracking-widest text-white/70 mb-1">
                                Status Coopérative
                            </p>
                            <p className="text-xl md:text-2xl font-black uppercase tracking-tight">
                                {perf.loading ? '...' : certLabel}
                            </p>
                        </div>
                    </div>
                    <button className="w-full sm:w-auto bg-slate-900 px-6 py-4 rounded-[20px] md:rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-transform shadow-lg shrink-0">
                        Certificat
                    </button>
                </div>

            </div>
        </main>
    );
}
