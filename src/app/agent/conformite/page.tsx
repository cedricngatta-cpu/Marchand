'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ShieldCheck, AlertCircle, CheckCircle2, RefreshCcw, Store } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface AlertStore {
    id: string;
    name: string;
    ownerName: string;
    ownerPhone: string;
    daysSinceActivity: number;
}

function daysSince(iso: string | null): number {
    if (!iso) return 999;
    return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

export default function AgentCompliance() {
    const router = useRouter();
    const [alerts, setAlerts] = useState<AlertStore[]>([]);
    const [loading, setLoading] = useState(true);
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

    const load = async () => {
        setLoading(true);
        try {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

            const { data: stores } = await supabase.from('stores').select('id, name, owner_id');
            if (!stores?.length) { setLoading(false); return; }

            const storeIds = stores.map(s => s.id);
            const ownerIds = stores.map(s => s.owner_id);

            const [{ data: recentTx }, { data: profiles }] = await Promise.all([
                supabase.from('transactions').select('store_id, created_at')
                    .in('store_id', storeIds).gte('created_at', thirtyDaysAgo)
                    .order('created_at', { ascending: false }),
                supabase.from('profiles').select('id, name, phone_number').in('id', ownerIds),
            ]);

            // Stores with recent activity
            const recentStoreIds = new Set((recentTx ?? []).map(t => t.store_id));

            const profileMap: Record<string, { name: string; phone: string }> = {};
            for (const p of profiles ?? []) profileMap[p.id] = { name: p.name ?? '—', phone: p.phone_number ?? '' };

            const criticalStores: AlertStore[] = stores
                .filter(s => !recentStoreIds.has(s.id))
                .map(s => ({
                    id: s.id,
                    name: s.name,
                    ownerName: profileMap[s.owner_id]?.name ?? '—',
                    ownerPhone: profileMap[s.owner_id]?.phone ?? '',
                    daysSinceActivity: daysSince(null), // no tx in 30+ days
                }))
                .sort((a, b) => b.daysSinceActivity - a.daysSinceActivity);

            setAlerts(criticalStores);
            setCheckedIds(new Set()); // reset on reload
        } catch (err) {
            console.error('[Conformite] fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const toggleCheck = (id: string) => {
        setCheckedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const visitedCount = checkedIds.size;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 overflow-x-hidden">

            {/* ── Header ── */}
            <div className="bg-amber-500 pt-8 pb-32 px-4 rounded-b-[2.5rem] shadow-lg">
                <div className="flex items-center justify-between mb-6 max-w-lg mx-auto">
                    <button onClick={() => router.back()} className="w-10 h-10 bg-white text-amber-500 rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm shrink-0">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-center">
                        <h1 className="text-white font-bold text-lg tracking-wide uppercase leading-none">Conformité</h1>
                        <p className="text-amber-200 text-[10px] font-bold uppercase tracking-widest mt-0.5">Alertes & Visites requises</p>
                    </div>
                    <button onClick={load} className="w-10 h-10 bg-white text-amber-500 rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm shrink-0">
                        <RefreshCcw size={16} />
                    </button>
                </div>

                <div className="max-w-lg mx-auto flex flex-col items-center mt-2">
                    <div className="flex items-center gap-2 mb-1">
                        <AlertCircle size={14} className="text-amber-200" />
                        <span className="font-bold uppercase tracking-wider text-amber-100 text-[10px]">Sans activité depuis 30j+</span>
                    </div>
                    {loading
                        ? <div className="h-12 w-24 bg-white/10 rounded-xl animate-pulse mt-1" />
                        : <span className="text-5xl font-black text-white tracking-tighter">{alerts.length}</span>
                    }
                    <p className="text-amber-200/60 text-[10px] font-bold uppercase tracking-wider mt-1">
                        {visitedCount > 0
                            ? `${visitedCount} marquée${visitedCount > 1 ? 's' : ''} comme visitée${visitedCount > 1 ? 's' : ''}`
                            : 'Aucune visite enregistrée cette session'
                        }
                    </p>
                </div>
            </div>

            {/* ── Contenu ── */}
            <div className="px-4 max-w-lg mx-auto relative mt-[-40px] z-10 space-y-3">

                {/* Barre de progression */}
                {!loading && alerts.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-[20px] shadow-xl border border-slate-100 dark:border-slate-800 p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center shrink-0">
                            <ShieldCheck size={18} className="text-amber-500" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-xs text-slate-800 dark:text-white mb-2">
                                {visitedCount}/{alerts.length} boutiques visitées cette session
                            </p>
                            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    animate={{ width: alerts.length > 0 ? `${(visitedCount / alerts.length) * 100}%` : '0%' }}
                                    transition={{ duration: 0.4 }}
                                    className="h-full bg-amber-500 rounded-full"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="space-y-3">
                        {[0, 1, 2].map(i => <div key={i} className="bg-white dark:bg-slate-900 h-24 rounded-[20px] border border-slate-100 dark:border-slate-800 animate-pulse" />)}
                    </div>
                ) : alerts.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-[24px] p-12 text-center border-2 border-dashed border-emerald-100 dark:border-emerald-900/30">
                        <CheckCircle2 size={40} className="mx-auto text-emerald-400 mb-3" />
                        <p className="font-bold text-emerald-500 uppercase text-[10px] tracking-widest">Tout est conforme !</p>
                        <p className="text-slate-300 dark:text-slate-600 text-[10px] mt-1">Toutes les boutiques sont actives</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {alerts.map((a, i) => {
                            const checked = checkedIds.has(a.id);
                            const isCritical = a.daysSinceActivity > 60;
                            return (
                                <motion.div
                                    key={a.id}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className={`bg-white dark:bg-slate-900 rounded-[18px] border-2 shadow-sm p-3.5 flex items-center gap-3 transition-all ${checked
                                        ? 'border-emerald-200 dark:border-emerald-800 opacity-60'
                                        : isCritical
                                            ? 'border-rose-100 dark:border-rose-900/30'
                                            : 'border-amber-100 dark:border-amber-900/30'
                                        }`}
                                >
                                    <div className={`w-10 h-10 shrink-0 rounded-[12px] flex items-center justify-center ${checked ? 'bg-emerald-100 dark:bg-emerald-900/30' : isCritical ? 'bg-rose-100 dark:bg-rose-900/20' : 'bg-amber-100 dark:bg-amber-900/20'}`}>
                                        {checked
                                            ? <CheckCircle2 size={18} className="text-emerald-600" />
                                            : <Store size={18} className={isCritical ? 'text-rose-500' : 'text-amber-500'} />
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-xs text-slate-800 dark:text-white truncate">{a.name}</p>
                                        <p className="text-[10px] text-slate-400 truncate">
                                            {a.ownerName}
                                            {a.ownerPhone && <> · <span className="text-emerald-500">{a.ownerPhone}</span></>}
                                        </p>
                                        <p className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${isCritical ? 'text-rose-400' : 'text-amber-400'}`}>
                                            Aucune vente depuis plus de 30 jours
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => toggleCheck(a.id)}
                                        className={`shrink-0 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${checked
                                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-amber-100 dark:hover:bg-amber-900/20 hover:text-amber-600'
                                            }`}
                                    >
                                        {checked ? 'Visité ✓' : 'Marquer'}
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

            </div>
        </div>
    );
}
