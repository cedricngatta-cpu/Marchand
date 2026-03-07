'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    UserPlus, MapPin, Activity, ShieldCheck,
    LogOut, User, TrendingUp, AlertCircle, Users,
} from 'lucide-react';
import { useConfirm } from '@/context/ConfirmContext';

interface AgentStats {
    enrolledThisMonth: number;
    totalStores: number;
    activeStores: number;
    criticalStores: number;
    loading: boolean;
}

export default function AgentDashboard() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const confirm = useConfirm();

    const [stats, setStats] = useState<AgentStats>({
        enrolledThisMonth: 0, totalStores: 0, activeStores: 0, criticalStores: 0, loading: true,
    });

    useEffect(() => {
        const load = async () => {
            try {
                const now = new Date();
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

                const [{ count: enrolledThisMonth }, { data: stores }] = await Promise.all([
                    supabase.from('agent_enrollments').select('*', { count: 'exact', head: true })
                        .eq('agent_id', user?.id).gte('created_at', monthStart),
                    supabase.from('stores').select('id'),
                ]);

                const storeIds = (stores ?? []).map(s => s.id);
                let activeStores = 0;
                let criticalStores = 0;

                if (storeIds.length > 0) {
                    const [{ data: activeTx }, { data: recentTx }] = await Promise.all([
                        supabase.from('transactions').select('store_id').in('store_id', storeIds).gte('created_at', sevenDaysAgo),
                        supabase.from('transactions').select('store_id').in('store_id', storeIds).gte('created_at', thirtyDaysAgo),
                    ]);
                    const activeIds = new Set((activeTx ?? []).map(t => t.store_id));
                    const recentIds = new Set((recentTx ?? []).map(t => t.store_id));
                    activeStores = activeIds.size;
                    criticalStores = storeIds.filter(id => !recentIds.has(id)).length;
                }

                setStats({
                    enrolledThisMonth: enrolledThisMonth ?? 0,
                    totalStores: storeIds.length,
                    activeStores,
                    criticalStores,
                    loading: false,
                });
            } catch (err) {
                console.error('[Agent Dashboard] fetch error:', err);
                setStats(s => ({ ...s, loading: false }));
            }
        };
        if (user?.id) load();
    }, [user?.id]);

    const actions = [
        { label: 'Enrôlement', sub: 'Nouveau membre', icon: UserPlus, color: 'bg-cyan-500 shadow-lg shadow-cyan-200 dark:shadow-none', path: '/agent/enrolement' },
        { label: 'Secteur', sub: 'Mes boutiques', icon: MapPin, color: 'bg-emerald-500 shadow-lg shadow-emerald-200 dark:shadow-none', path: '/agent/secteur' },
        { label: 'Activités', sub: 'Mon historique', icon: Activity, color: 'bg-rose-500 shadow-lg shadow-rose-200 dark:shadow-none', path: '/agent/activites' },
        { label: 'Conformité', sub: 'Alertes & Visites', icon: ShieldCheck, color: 'bg-amber-500 shadow-lg shadow-amber-200 dark:shadow-none', path: '/agent/conformite' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 overflow-x-hidden">

            {/* ── Wave header ── */}
            <div className="bg-cyan-600 pt-8 pb-32 px-4 rounded-b-[2.5rem] shadow-lg">
                <div className="flex justify-between items-center mb-6 max-w-lg mx-auto">
                    <button
                        onClick={() => router.push('/profil')}
                        className="w-10 h-10 bg-white text-cyan-600 rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm shrink-0"
                    >
                        <User size={20} />
                    </button>
                    <div className="text-center min-w-0 px-2">
                        <h1 className="text-white font-bold text-lg tracking-wide uppercase leading-none">Agent Terrain</h1>
                        <p className="text-cyan-200 text-[10px] font-bold uppercase tracking-widest mt-0.5 truncate">
                            Bonjour, {user?.name}
                        </p>
                    </div>
                    <button
                        onClick={async () => {
                            const ok = await confirm({
                                title: 'Déconnexion',
                                message: 'Voulez-vous vraiment vous déconnecter ? Vos données hors-ligne sont en sécurité.',
                                confirmLabel: 'Se déconnecter',
                                dangerMode: true,
                            });
                            if (ok) { logout(); router.push('/login'); }
                        }}
                        className="w-10 h-10 bg-white text-rose-500 rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm shrink-0"
                    >
                        <LogOut size={18} />
                    </button>
                </div>

                {/* Hero KPI */}
                <div className="max-w-lg mx-auto flex flex-col items-center mt-2">
                    <div className="flex items-center gap-2 mb-1">
                        <Users size={14} className="text-cyan-200" />
                        <span className="font-bold uppercase tracking-wider text-cyan-100 text-[10px]">Enrôlements ce mois</span>
                    </div>
                    {stats.loading ? (
                        <div className="h-12 w-24 bg-white/10 rounded-xl animate-pulse mt-1" />
                    ) : (
                        <span className="text-5xl font-black text-white tracking-tighter">{stats.enrolledThisMonth}</span>
                    )}
                    <p className="text-cyan-200/60 text-[10px] font-bold uppercase tracking-wider mt-1">
                        {stats.totalStores} boutique{stats.totalStores > 1 ? 's' : ''} dans le réseau
                    </p>
                </div>
            </div>

            {/* ── Contenu overlap ── */}
            <div className="px-4 max-w-lg mx-auto relative mt-[-40px] z-10 space-y-4">

                {/* KPIs */}
                <div className="bg-white dark:bg-slate-900 rounded-[24px] p-5 shadow-xl border border-slate-100 dark:border-slate-800">
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => router.push('/agent/secteur')} className="flex flex-col gap-1 active:scale-95 transition-transform text-left">
                            <div className="w-10 h-10 rounded-[12px] bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                <TrendingUp size={18} className="text-emerald-600" />
                            </div>
                            {stats.loading
                                ? <div className="h-6 w-12 bg-slate-100 dark:bg-slate-700 rounded animate-pulse mt-1" />
                                : <span className="text-2xl font-black text-slate-800 dark:text-white">{stats.activeStores}</span>
                            }
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Boutiques actives</span>
                            <span className="text-[9px] text-emerald-500 font-bold">7 derniers jours</span>
                        </button>
                        <button onClick={() => router.push('/agent/conformite')} className="flex flex-col gap-1 active:scale-95 transition-transform text-left">
                            <div className="w-10 h-10 rounded-[12px] bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                                <AlertCircle size={18} className="text-rose-600" />
                            </div>
                            {stats.loading
                                ? <div className="h-6 w-12 bg-slate-100 dark:bg-slate-700 rounded animate-pulse mt-1" />
                                : <span className="text-2xl font-black text-slate-800 dark:text-white">{stats.criticalStores}</span>
                            }
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Alertes critiques</span>
                            <span className="text-[9px] text-rose-500 font-bold">Inactives 30+ jours</span>
                        </button>
                    </div>
                </div>

                {/* Actions grid */}
                <div className="grid grid-cols-2 gap-3">
                    {actions.map((a, i) => (
                        <motion.button
                            key={a.path}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => router.push(a.path)}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className={`${a.color} text-white py-6 px-4 rounded-[22px] flex flex-col items-center gap-3 active:scale-95 transition-all`}
                        >
                            <a.icon size={28} />
                            <div className="text-center">
                                <p className="font-black uppercase tracking-widest text-xs">{a.label}</p>
                                <p className="text-white/70 text-[9px] font-bold uppercase tracking-wider mt-0.5">{a.sub}</p>
                            </div>
                        </motion.button>
                    ))}
                </div>

                {/* Alerte critique */}
                {!stats.loading && stats.criticalStores > 0 && (
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => router.push('/agent/conformite')}
                        className="w-full bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-200 dark:border-rose-800 rounded-[20px] p-4 flex items-center gap-3 active:scale-95 transition-all"
                    >
                        <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center shrink-0">
                            <AlertCircle size={18} className="text-rose-500" />
                        </div>
                        <div className="text-left min-w-0">
                            <p className="font-bold text-xs text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                                {stats.criticalStores} boutique{stats.criticalStores > 1 ? 's' : ''} sans activité
                            </p>
                            <p className="text-[10px] text-rose-400 font-bold">Voir les alertes de conformité →</p>
                        </div>
                    </motion.button>
                )}

            </div>
        </div>
    );
}
