'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db';
import { useProfileContext } from '@/context/ProfileContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCFA = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + '\u00A0F';

const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const monthLabel = (year: number, month: number) =>
    new Date(year, month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RevenusPage() {
    const router = useRouter();
    const { activeProfile } = useProfileContext();

    const now = new Date();
    const [year, setYear]   = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth()); // 0-indexed

    const prevMonth = () => {
        if (month === 0) { setMonth(11); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    };
    const nextMonth = () => {
        const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
        if (isCurrentMonth) return;
        if (month === 11) { setMonth(0); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    };

    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

    // ── Données réactives ─────────────────────────────────────────────────────

    const deliveredOrders = useLiveQuery(
        async () => {
            if (!activeProfile) return [];
            const rows = await db.orders
                .where('seller_store_id')
                .equals(activeProfile.id)
                .toArray();
            return rows
                .filter(o => {
                    if (o.status !== 'DELIVERED') return false;
                    const d = new Date(o.updated_at || o.created_at);
                    return d.getFullYear() === year && d.getMonth() === month;
                })
                .sort((a, b) =>
                    new Date(b.updated_at || b.created_at).getTime() -
                    new Date(a.updated_at || a.created_at).getTime()
                );
        },
        [activeProfile?.id, year, month]
    );

    const isLoading  = deliveredOrders === undefined;
    const revenue    = (deliveredOrders ?? []).reduce((s, o) => s + o.total_amount, 0);
    const orderCount = (deliveredOrders ?? []).length;

    // Aggrégation par produit pour le résumé
    const byProduct = (deliveredOrders ?? []).reduce<Record<string, { name: string; qty: number; total: number }>>((acc, o) => {
        if (!acc[o.product_id]) acc[o.product_id] = { name: o.product_name, qty: 0, total: 0 };
        acc[o.product_id].qty   += o.quantity;
        acc[o.product_id].total += o.total_amount;
        return acc;
    }, {});
    const topProducts = Object.values(byProduct).sort((a, b) => b.total - a.total);

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 overflow-x-hidden">

            {/* ── Header wave ── */}
            <div className="bg-primary pt-8 pb-32 px-4 rounded-b-[2.5rem] shadow-lg">
                <div className="flex items-center gap-4 mb-6 max-w-lg mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm shrink-0"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-white font-bold text-lg tracking-wide uppercase leading-none">
                            Revenus
                        </h1>
                        <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                            Historique des livraisons
                        </p>
                    </div>
                </div>

                {/* Sélecteur de mois */}
                <div className="max-w-lg mx-auto flex items-center justify-center gap-4 mb-4">
                    <button
                        onClick={prevMonth}
                        className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                    >
                        <ChevronLeft size={16} className="text-white" />
                    </button>
                    <span className="text-emerald-100 font-bold text-[11px] uppercase tracking-widest min-w-[130px] text-center">
                        {monthLabel(year, month)}
                    </span>
                    <button
                        onClick={nextMonth}
                        disabled={isCurrentMonth}
                        className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30"
                    >
                        <ChevronRight size={16} className="text-white" />
                    </button>
                </div>

                {/* KPI revenue */}
                <div className="max-w-lg mx-auto flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp size={14} className="text-emerald-200" />
                        <span className="font-bold uppercase tracking-wider text-emerald-100 text-[10px]">
                            Chiffre d'affaires
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                        {isLoading ? (
                            <div className="h-12 w-40 bg-white/10 rounded-xl animate-pulse" />
                        ) : (
                            <>
                                <span className="text-5xl font-black text-white tracking-tighter">
                                    {new Intl.NumberFormat('fr-FR').format(revenue)}
                                </span>
                                <span className="text-2xl font-semibold text-emerald-100">F</span>
                            </>
                        )}
                    </div>
                    <p className="text-emerald-200/60 text-[10px] font-bold uppercase tracking-wider mt-1">
                        {isLoading ? '...' : `${orderCount} livraison${orderCount > 1 ? 's' : ''} validée${orderCount > 1 ? 's' : ''}`}
                    </p>
                </div>
            </div>

            {/* ── Content overlap ── */}
            <div className="px-4 max-w-lg mx-auto relative mt-[-40px] z-10 space-y-4">

                {/* Résumé par produit */}
                {!isLoading && topProducts.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-[24px] p-5 shadow-xl border border-slate-100 dark:border-slate-800">
                        <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-widest mb-4">
                            Par produit
                        </h3>
                        <div className="space-y-3">
                            {topProducts.map(p => {
                                const pct = revenue > 0 ? (p.total / revenue) * 100 : 0;
                                return (
                                    <div key={p.name}>
                                        <div className="flex justify-between items-baseline mb-1.5">
                                            <span className="font-bold text-xs text-slate-700 dark:text-slate-200 truncate max-w-[55%]">
                                                {p.name}
                                            </span>
                                            <div className="text-right shrink-0">
                                                <span className="font-bold text-xs text-slate-800 dark:text-white">
                                                    {formatCFA(p.total)}
                                                </span>
                                                <span className="text-[10px] text-slate-400 ml-1.5">
                                                    {p.qty} u
                                                </span>
                                            </div>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                                className="h-full bg-primary rounded-full"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Liste des livraisons */}
                <div className="bg-white dark:bg-slate-900 rounded-[24px] p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-widest mb-4">
                        Détail des livraisons
                    </h3>

                    {isLoading ? (
                        <div className="space-y-3">
                            {[0, 1, 2].map(i => (
                                <div key={i} className="h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : deliveredOrders!.length === 0 ? (
                        <div className="py-8 text-center">
                            <TrendingUp size={32} className="mx-auto text-slate-200 dark:text-slate-700 mb-2" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-600">
                                Aucun revenu ce mois-ci
                            </p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            <div className="space-y-3">
                                {deliveredOrders!.map((order, i) => (
                                    <motion.div
                                        key={order.id}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="flex items-center justify-between gap-3"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                                <TrendingUp size={15} className="text-emerald-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-xs text-slate-800 dark:text-white truncate">
                                                    {order.product_name}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                                    {order.buyer_name ?? '—'} · {order.quantity} u · {formatDate(order.updated_at || order.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-bold text-sm text-slate-800 dark:text-white">
                                                {formatCFA(order.total_amount)}
                                            </p>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                                order.payment_mode === 'CASH' ? 'bg-emerald-100 text-emerald-700'
                                                : order.payment_mode === 'MOMO' ? 'bg-blue-100 text-blue-700'
                                                : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {order.payment_mode === 'CASH' ? 'Cash'
                                                : order.payment_mode === 'MOMO' ? 'MoMo'
                                                : 'Dette'}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </AnimatePresence>
                    )}
                </div>

            </div>
        </div>
    );
}
