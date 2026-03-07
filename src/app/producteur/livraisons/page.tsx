'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft, Package, Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { db, LocalOrder } from '@/lib/db';
import { useProfileContext } from '@/context/ProfileContext';
import { useSync } from '@/context/SyncContext';
import { useConfirm } from '@/context/ConfirmContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCFA = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + '\u00A0F';

const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LivraisonsPage() {
    const router = useRouter();
    const { activeProfile } = useProfileContext();
    const { triggerSync } = useSync();
    const confirm = useConfirm();

    const [processingId, setProcessingId] = useState<string | null>(null);

    const orders = useLiveQuery(
        async () => {
            if (!activeProfile) return [];
            const rows = await db.orders
                .where('seller_store_id')
                .equals(activeProfile.id)
                .toArray();
            return rows
                .filter(o => o.status === 'ACCEPTED' || o.status === 'SHIPPED')
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        },
        [activeProfile?.id]
    );

    const isLoading     = orders === undefined;
    const acceptedCount = (orders ?? []).filter(o => o.status === 'ACCEPTED').length;

    // ── Mutation ─────────────────────────────────────────────────────────────

    const handleShip = async (order: LocalOrder) => {
        if (processingId) return;
        const confirmed = await confirm({
            title: 'Confirmer l\'expédition ?',
            message: `La commande de ${order.buyer_name ?? 'ce marchand'} pour "${order.product_name}" sera marquée comme expédiée.`,
            confirmLabel: 'Expédier',
        });
        if (!confirmed) return;

        setProcessingId(order.id);
        try {
            const now = new Date().toISOString();
            await db.orders.update(order.id, { status: 'SHIPPED', updated_at: now, synced: 0 });
            await db.syncQueue.add({
                action: 'SHIP_ORDER',
                payload: { id: order.id, updated_at: now },
                status: 'PENDING',
                retry_count: 0,
                created_at: Date.now(),
            });
            triggerSync();
        } finally {
            setProcessingId(null);
        }
    };

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
                            Livraisons
                        </h1>
                        <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                            Commandes à expédier
                        </p>
                    </div>
                </div>

                {/* KPI */}
                <div className="max-w-lg mx-auto flex flex-col items-center mt-2">
                    <div className="flex items-center gap-2 mb-1">
                        <Truck size={14} className="text-emerald-200" />
                        <span className="font-bold uppercase tracking-wider text-emerald-100 text-[10px]">
                            Prêtes à expédier
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                        {isLoading ? (
                            <div className="h-12 w-16 bg-white/10 rounded-xl animate-pulse" />
                        ) : (
                            <>
                                <span className="text-5xl font-black text-white tracking-tighter">
                                    {acceptedCount}
                                </span>
                                <span className="text-2xl font-semibold text-emerald-100">
                                    {acceptedCount <= 1 ? 'commande' : 'commandes'}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Content overlap ── */}
            <div className="px-4 max-w-lg mx-auto relative mt-[-40px] z-10 space-y-4">

                {isLoading ? (
                    <div className="space-y-3">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="bg-white dark:bg-slate-900 h-28 rounded-[20px] border border-slate-100 dark:border-slate-800 animate-pulse" />
                        ))}
                    </div>
                ) : orders!.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-[24px] p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800">
                        <Truck size={40} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
                        <p className="font-bold text-slate-300 dark:text-slate-700 uppercase text-[10px] tracking-widest">
                            Aucune livraison en cours
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {orders!.map((order, i) => {
                                const isAccepted   = order.status === 'ACCEPTED';
                                const isProcessing = processingId === order.id;

                                return (
                                    <motion.div
                                        key={order.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: isProcessing ? 0.5 : 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
                                        transition={{ delay: i * 0.04 }}
                                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm"
                                    >
                                        {/* Corps */}
                                        <div className="p-4">
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-12 h-12 shrink-0 rounded-[14px] flex items-center justify-center ${isAccepted ? 'bg-blue-100' : 'bg-purple-100'}`}>
                                                        {isAccepted
                                                            ? <Package size={20} className="text-blue-600" />
                                                            : <Truck size={20} className="text-purple-600" />
                                                        }
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="font-bold text-slate-800 dark:text-white text-sm truncate leading-tight">
                                                            {order.product_name}
                                                        </h3>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 truncate">
                                                            {order.buyer_name ?? '—'} · {order.quantity} u · {formatDate(order.created_at)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right shrink-0">
                                                    <p className="font-bold text-sm text-slate-800 dark:text-white">
                                                        {formatCFA(order.total_amount)}
                                                    </p>
                                                    <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 ${isAccepted ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                        {isAccepted ? 'À expédier' : 'Expédiée'}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-[10px] text-slate-400 font-bold ml-[60px]">
                                                {formatCFA(order.unit_price)} / unité
                                            </p>

                                            {order.notes && (
                                                <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 italic border-l-2 border-slate-200 dark:border-slate-700 pl-3 leading-relaxed">
                                                    "{order.notes}"
                                                </p>
                                            )}
                                        </div>

                                        {/* Action — ACCEPTED uniquement */}
                                        {isAccepted && (
                                            <div className="px-4 pb-4 pt-3 border-t border-slate-50 dark:border-slate-800">
                                                <button
                                                    onClick={() => handleShip(order)}
                                                    disabled={!!processingId}
                                                    className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-md shadow-purple-100 dark:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                                                >
                                                    {isProcessing ? (
                                                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <Truck size={13} />
                                                    )}
                                                    Confirmer l'expédition
                                                </button>
                                            </div>
                                        )}

                                        {/* SHIPPED — lecture seule */}
                                        {!isAccepted && (
                                            <div className="px-4 pb-4 pt-3 border-t border-slate-50 dark:border-slate-800">
                                                <p className="text-center text-[10px] font-bold text-purple-500 uppercase tracking-wider">
                                                    En attente de confirmation du marchand
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}

            </div>
        </div>
    );
}
