'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertCircle, ChevronLeft, ChevronRight,
    RefreshCcw, ShoppingBag, TrendingUp, Truck, Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type ActivityType = 'VENTE' | 'LIVRAISON' | 'COMMANDE' | 'RETRAIT';

interface Activity {
    id: string;
    type: ActivityType;
    label: string;
    sub: string;
    amount: number;
    time: string;
    status?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCFA = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + '\u00A0F';

const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'À l\'instant';
    if (diffMin < 60) return `Il y a ${diffMin}min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Il y a ${diffH}h`;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const TYPE_CONFIG: Record<ActivityType, { label: string; Icon: React.ElementType; bg: string; color: string }> = {
    VENTE:    { label: 'Vente',    Icon: TrendingUp,   bg: 'bg-emerald-100', color: 'text-emerald-600' },
    LIVRAISON:{ label: 'Livraison',Icon: Truck,         bg: 'bg-purple-100',  color: 'text-purple-600'  },
    COMMANDE: { label: 'Commande', Icon: ShoppingBag,   bg: 'bg-blue-100',    color: 'text-blue-600'    },
    RETRAIT:  { label: 'Retrait',  Icon: AlertCircle,   bg: 'bg-rose-100',    color: 'text-rose-600'    },
};

const FILTERS = ['Tous', 'Vente', 'Livraison', 'Commande'] as const;
type Filter = typeof FILTERS[number];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CooperativeJournal() {
    const router = useRouter();

    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<Filter>('Tous');
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 20;

    const fetchActivities = async (pageNum: number = 0) => {
        setLoading(true);
        try {
            const offset = pageNum * PAGE_SIZE;

            // Transactions (ventes, livraisons, retraits)
            const { data: txData } = await supabase
                .from('transactions')
                .select('id, type, product_name, price, status, created_at, client_name, store_id')
                .order('created_at', { ascending: false })
                .range(offset, offset + PAGE_SIZE - 1);

            // Commandes B2B (ordres)
            const { data: orderData } = await supabase
                .from('orders')
                .select('id, product_name, total_amount, status, buyer_name, seller_name, created_at')
                .order('created_at', { ascending: false })
                .range(offset, offset + 9);

            const txActs: Activity[] = (txData ?? []).map(t => ({
                id: `tx-${t.id}`,
                type: (t.type === 'RETRAIT' ? 'RETRAIT' : t.type === 'LIVRAISON' ? 'LIVRAISON' : 'VENTE') as ActivityType,
                label: t.product_name,
                sub: t.client_name ? `${ROLE_MAP[t.type] ?? t.type} · ${t.client_name}` : (ROLE_MAP[t.type] ?? t.type),
                amount: t.price ?? 0,
                time: t.created_at,
                status: t.status,
            }));

            const orderActs: Activity[] = (orderData ?? []).map(o => ({
                id: `order-${o.id}`,
                type: 'COMMANDE' as ActivityType,
                label: o.product_name,
                sub: `${o.buyer_name ?? '—'} → ${o.seller_name ?? '—'}`,
                amount: o.total_amount ?? 0,
                time: o.created_at,
                status: o.status,
            }));

            const merged = [...txActs, ...orderActs]
                .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

            setActivities(pageNum === 0 ? merged : prev => [...prev, ...merged]);
        } catch (err) {
            console.error('[Journal] fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchActivities(0); }, []);

    const ROLE_MAP: Record<string, string> = {
        VENTE: 'Vente', LIVRAISON: 'Livraison', RETRAIT: 'Retrait',
    };

    const filtered = activities.filter(a => {
        if (filter === 'Tous') return true;
        if (filter === 'Vente') return a.type === 'VENTE';
        if (filter === 'Livraison') return a.type === 'LIVRAISON';
        if (filter === 'Commande') return a.type === 'COMMANDE';
        return true;
    });

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 overflow-x-hidden">

            {/* ── Header wave ── */}
            <div className="bg-purple-700 pt-8 pb-32 px-4 rounded-b-[2.5rem] shadow-lg">
                <div className="flex items-center justify-between mb-6 max-w-lg mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 bg-white text-purple-700 rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm shrink-0"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-center">
                        <h1 className="text-white font-bold text-lg tracking-wide uppercase leading-none">Journal</h1>
                        <p className="text-purple-200 text-[10px] font-bold uppercase tracking-widest mt-0.5">Historique complet</p>
                    </div>
                    <button
                        onClick={() => { setPage(0); fetchActivities(0); }}
                        className="w-10 h-10 bg-white text-purple-700 rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm shrink-0"
                    >
                        <RefreshCcw size={16} />
                    </button>
                </div>

                {/* Total transactions */}
                <div className="max-w-lg mx-auto flex flex-col items-center mt-2">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp size={14} className="text-purple-200" />
                        <span className="font-bold uppercase tracking-wider text-purple-100 text-[10px]">
                            {filtered.length} activité{filtered.length > 1 ? 's' : ''} chargée{filtered.length > 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                        {loading && activities.length === 0 ? (
                            <div className="h-10 w-48 bg-white/10 rounded-xl animate-pulse" />
                        ) : (
                            <span className="text-4xl font-black text-white tracking-tighter">
                                {new Intl.NumberFormat('fr-FR').format(
                                    filtered.filter(a => a.type !== 'COMMANDE').reduce((s, a) => s + a.amount, 0)
                                )} <span className="text-xl font-semibold text-purple-100">F</span>
                            </span>
                        )}
                    </div>
                    <p className="text-purple-200/60 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                        Volume filtré
                    </p>
                </div>
            </div>

            {/* ── Contenu overlap ── */}
            <div className="px-4 max-w-lg mx-auto relative mt-[-40px] z-10 space-y-4">

                {/* Filtres */}
                <div className="bg-white dark:bg-slate-900 rounded-[20px] px-2 py-2 shadow-xl border border-slate-100 dark:border-slate-800 flex gap-1.5">
                    {FILTERS.map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`flex-1 py-2.5 rounded-[14px] font-bold text-[10px] uppercase tracking-wider transition-all ${
                                filter === f
                                    ? 'bg-purple-700 text-white shadow-sm'
                                    : 'text-slate-400 dark:text-slate-500'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Liste */}
                {loading && activities.length === 0 ? (
                    <div className="space-y-3">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className="bg-white dark:bg-slate-900 h-16 rounded-[20px] border border-slate-100 dark:border-slate-800 animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-[24px] p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800">
                        <ShoppingBag size={40} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
                        <p className="font-bold text-slate-300 dark:text-slate-700 uppercase text-[10px] tracking-widest">
                            Aucune activité
                        </p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        <div className="space-y-2">
                            {filtered.map((act, i) => {
                                const cfg = TYPE_CONFIG[act.type] ?? TYPE_CONFIG.VENTE;
                                return (
                                    <motion.div
                                        key={act.id}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: Math.min(i, 10) * 0.025 }}
                                        className="bg-white dark:bg-slate-900 rounded-[18px] border border-slate-100 dark:border-slate-800 p-3.5 shadow-sm flex items-center gap-3"
                                    >
                                        <div className={`w-10 h-10 shrink-0 rounded-[12px] ${cfg.bg} flex items-center justify-center`}>
                                            <cfg.Icon size={16} className={cfg.color} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-xs text-slate-800 dark:text-white truncate leading-tight">{act.label}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5 truncate">{act.sub} · {formatDate(act.time)}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-bold text-sm text-slate-800 dark:text-white">{formatCFA(act.amount)}</p>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                                                {cfg.label}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </AnimatePresence>
                )}

                {/* Charger plus */}
                {filtered.length >= PAGE_SIZE && (
                    <button
                        onClick={() => {
                            const next = page + 1;
                            setPage(next);
                            fetchActivities(next);
                        }}
                        disabled={loading}
                        className="w-full py-4 rounded-[18px] border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:border-purple-400 hover:text-purple-600 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                        {loading ? <span className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" /> : <ChevronRight size={14} />}
                        Charger plus
                    </button>
                )}
            </div>
        </div>
    );
}
