'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { CheckCircle2, ChevronLeft, Clock, Package, ShoppingCart, Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { db, LocalOrder } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { useProfileContext } from '@/context/ProfileContext';
import { useSync } from '@/context/SyncContext';

// ─── Config ───────────────────────────────────────────────────────────────────

const formatCFA = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + '\u00A0F';

const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const STATUS_CONFIG = {
    PENDING:   { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'En attente',  Icon: Clock,         iconBg: 'bg-amber-100',   iconColor: 'text-amber-600' },
    ACCEPTED:  { bg: 'bg-blue-100',    text: 'text-blue-700',    label: 'Acceptée',    Icon: CheckCircle2,  iconBg: 'bg-blue-100',    iconColor: 'text-blue-600' },
    SHIPPED:   { bg: 'bg-purple-100',  text: 'text-purple-700',  label: 'En route',    Icon: Truck,         iconBg: 'bg-purple-100',  iconColor: 'text-purple-600' },
    DELIVERED: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Livrée',      Icon: CheckCircle2,  iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
    CANCELLED: { bg: 'bg-slate-100',   text: 'text-slate-500',   label: 'Annulée',     Icon: Package,       iconBg: 'bg-slate-100',   iconColor: 'text-slate-400' },
} as const;

type PaymentMode = 'CASH' | 'MOMO' | 'DETTE';

const PAYMENT_OPTIONS: { id: PaymentMode; label: string; sub: string; activeCls: string }[] = [
    { id: 'CASH',  label: 'Cash',    sub: 'Paiement immédiat',    activeCls: 'bg-emerald-600 text-white border-emerald-600' },
    { id: 'MOMO',  label: 'MoMo',   sub: 'Mobile Money',          activeCls: 'bg-blue-600 text-white border-blue-600' },
    { id: 'DETTE', label: 'Dette',   sub: 'Payer plus tard',       activeCls: 'bg-amber-500 text-white border-amber-500' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LivraisonsCommercantPage() {
    const router = useRouter();
    const { activeProfile } = useProfileContext();
    const { triggerSync } = useSync();

    const [processingId, setProcessingId]       = useState<string | null>(null);
    const [confirmingId, setConfirmingId]       = useState<string | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<PaymentMode>('CASH');

    // ── Sync depuis Supabase au montage ──────────────────────────────────────

    useEffect(() => {
        if (!activeProfile || !navigator.onLine) return;
        const sync = async () => {
            const { data } = await supabase
                .from('orders')
                .select('*')
                .eq('buyer_store_id', activeProfile.id);
            if (data?.length) {
                await db.orders.bulkPut(
                    data.map(o => ({ ...o, synced: 1 }))
                );
            }
        };
        sync().catch(console.error);
    }, [activeProfile?.id]);

    // ── Données réactives ────────────────────────────────────────────────────

    const orders = useLiveQuery(
        async () => {
            if (!activeProfile) return [];
            const rows = await db.orders
                .where('buyer_store_id')
                .equals(activeProfile.id)
                .toArray();
            return rows
                .filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED')
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        },
        [activeProfile?.id]
    );

    const isLoading   = orders === undefined;
    const shippedCount = (orders ?? []).filter(o => o.status === 'SHIPPED').length;

    // ── DELIVER_ORDER ─────────────────────────────────────────────────────────

    const handleDeliver = async (order: LocalOrder) => {
        if (processingId) return;
        setProcessingId(order.id);
        setConfirmingId(null);
        try {
            const transactionId = crypto.randomUUID();
            const now           = new Date().toISOString();
            const txStatus      = selectedPayment === 'CASH' ? 'PAYÉ' as const
                                : selectedPayment === 'MOMO' ? 'MOMO' as const
                                : 'DETTE' as const;

            // 1. Mise à jour locale de la commande
            await db.orders.update(order.id, {
                status:       'DELIVERED',
                payment_mode: selectedPayment,
                updated_at:   now,
                synced:       0,
            });

            // 2. Transaction financière locale (reflète dans le bilan marchand)
            await db.transactions.add({
                id:           transactionId,
                type:         'LIVRAISON',
                product_id:   order.product_id,
                product_name: order.product_name,
                quantity:     order.quantity,
                price:        order.unit_price,
                status:       txStatus,
                store_id:     order.buyer_store_id,
                created_at:   now,
                synced:       0,
            });

            // 3. SyncQueue — opération composite côté serveur
            await db.syncQueue.add({
                action: 'DELIVER_ORDER',
                payload: {
                    id:              order.id,
                    transaction_id:  transactionId,
                    payment_mode:    selectedPayment,
                    buyer_store_id:  order.buyer_store_id,
                    product_id:      order.product_id,
                    product_name:    order.product_name,
                    quantity:        order.quantity,
                    unit_price:      order.unit_price,
                    updated_at:      now,
                },
                status:      'PENDING',
                retry_count: 0,
                created_at:  Date.now(),
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
                            Mes Commandes
                        </h1>
                        <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                            Suivi et réception
                        </p>
                    </div>
                </div>

                {/* KPI */}
                <div className="max-w-lg mx-auto flex flex-col items-center mt-2">
                    <div className="flex items-center gap-2 mb-1">
                        <Truck size={14} className="text-emerald-200" />
                        <span className="font-bold uppercase tracking-wider text-emerald-100 text-[10px]">
                            Livraisons à réceptionner
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                        {isLoading ? (
                            <div className="h-12 w-16 bg-white/10 rounded-xl animate-pulse" />
                        ) : (
                            <>
                                <span className="text-5xl font-black text-white tracking-tighter">
                                    {shippedCount}
                                </span>
                                <span className="text-2xl font-semibold text-emerald-100">
                                    {shippedCount <= 1 ? 'livraison' : 'livraisons'}
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
                        <ShoppingCart size={40} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
                        <p className="font-bold text-slate-300 dark:text-slate-700 uppercase text-[10px] tracking-widest mb-4">
                            Aucune commande en cours
                        </p>
                        <button
                            onClick={() => router.push('/approvisionnement')}
                            className="bg-primary text-white px-5 py-2.5 rounded-[14px] font-bold text-[10px] uppercase tracking-wider"
                        >
                            Parcourir le catalogue
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {orders!.map((order, i) => {
                                const sc           = STATUS_CONFIG[order.status];
                                const isShipped    = order.status === 'SHIPPED';
                                const isConfirming = confirmingId === order.id;
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
                                                    <div className={`w-12 h-12 shrink-0 rounded-[14px] ${sc.iconBg} flex items-center justify-center`}>
                                                        <sc.Icon size={20} className={sc.iconColor} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="font-bold text-slate-800 dark:text-white text-sm truncate leading-tight">
                                                            {order.product_name}
                                                        </h3>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 truncate">
                                                            {order.seller_name ?? '—'} · {order.quantity} u · {formatDate(order.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="font-bold text-sm text-slate-800 dark:text-white">
                                                        {formatCFA(order.total_amount)}
                                                    </p>
                                                    <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 ${sc.bg} ${sc.text}`}>
                                                        {sc.label}
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

                                        {/* Action SHIPPED → confirmation réception */}
                                        {isShipped && !isConfirming && (
                                            <div className="px-4 pb-4 pt-3 border-t border-slate-50 dark:border-slate-800">
                                                <button
                                                    onClick={() => { setConfirmingId(order.id); setSelectedPayment('CASH'); }}
                                                    disabled={!!processingId}
                                                    className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-md shadow-emerald-100 dark:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                                                >
                                                    <Truck size={13} />
                                                    Confirmer la réception
                                                </button>
                                            </div>
                                        )}

                                        {/* Sélecteur mode de paiement */}
                                        {isShipped && isConfirming && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="px-4 pb-4 pt-3 border-t border-slate-50 dark:border-slate-800 space-y-3"
                                            >
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    Mode de paiement
                                                </p>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {PAYMENT_OPTIONS.map(opt => (
                                                        <button
                                                            key={opt.id}
                                                            onClick={() => setSelectedPayment(opt.id)}
                                                            className={`py-3 rounded-xl font-bold text-[10px] uppercase tracking-wider border-2 transition-all active:scale-95 ${
                                                                selectedPayment === opt.id
                                                                    ? opt.activeCls
                                                                    : 'border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                                                            }`}
                                                        >
                                                            <span className="block">{opt.label}</span>
                                                            <span className="block text-[8px] font-bold opacity-70 mt-0.5 normal-case tracking-normal">
                                                                {opt.sub}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setConfirmingId(null)}
                                                        className="flex-1 bg-slate-50 dark:bg-slate-800 text-slate-500 py-3 rounded-xl font-bold text-[10px] uppercase border border-slate-100 dark:border-slate-700 active:scale-[0.98] transition-all"
                                                    >
                                                        Annuler
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeliver(order)}
                                                        disabled={!!processingId}
                                                        className="flex-[2] bg-emerald-600 text-white py-3 rounded-xl font-bold text-[10px] uppercase shadow-md shadow-emerald-100 dark:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                                                    >
                                                        {isProcessing ? (
                                                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        ) : (
                                                            <CheckCircle2 size={13} />
                                                        )}
                                                        Valider · {formatCFA(order.total_amount)}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Non-SHIPPED : message statut */}
                                        {!isShipped && (
                                            <div className="px-4 pb-4 pt-3 border-t border-slate-50 dark:border-slate-800">
                                                <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    {order.status === 'PENDING'
                                                        ? 'En attente de validation par le producteur'
                                                        : 'Commande acceptée — préparation en cours'}
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
