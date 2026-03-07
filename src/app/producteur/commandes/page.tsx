'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { CheckCircle2, ChevronLeft, Clock, ShoppingCart, Truck, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { db, LocalOrder } from '@/lib/db';
import { useProfileContext } from '@/context/ProfileContext';
import { useSync } from '@/context/SyncContext';
import { useConfirm } from '@/context/ConfirmContext';

// ─── Config ───────────────────────────────────────────────────────────────────

type Tab = 'PENDING' | 'ACCEPTED' | 'HISTORIQUE';

interface TabConfig {
    id: Tab;
    label: string;
    statuses: LocalOrder['status'][];
}

// Labels courts — évite tout débordement horizontal sur mobile
const TABS: TabConfig[] = [
    { id: 'PENDING',    label: 'Attente',    statuses: ['PENDING'] },
    { id: 'ACCEPTED',   label: 'En cours',   statuses: ['ACCEPTED', 'SHIPPED'] },
    { id: 'HISTORIQUE', label: 'Historique', statuses: ['DELIVERED', 'CANCELLED'] },
];

const STATUS_BADGE: Record<LocalOrder['status'], { bg: string; text: string; label: string }> = {
    PENDING:   { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'En attente' },
    ACCEPTED:  { bg: 'bg-blue-100',    text: 'text-blue-700',    label: 'Acceptée' },
    SHIPPED:   { bg: 'bg-purple-100',  text: 'text-purple-700',  label: 'Expédiée' },
    DELIVERED: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Livrée' },
    CANCELLED: { bg: 'bg-slate-100',   text: 'text-slate-500',   label: 'Annulée' },
};

const STATUS_ICON: Record<LocalOrder['status'], { bg: string; color: string; Icon: React.ElementType }> = {
    PENDING:   { bg: 'bg-amber-100',   color: 'text-amber-600',   Icon: Clock },
    ACCEPTED:  { bg: 'bg-blue-100',    color: 'text-blue-600',    Icon: CheckCircle2 },
    SHIPPED:   { bg: 'bg-purple-100',  color: 'text-purple-600',  Icon: Truck },
    DELIVERED: { bg: 'bg-emerald-100', color: 'text-emerald-600', Icon: CheckCircle2 },
    CANCELLED: { bg: 'bg-slate-100',   color: 'text-slate-400',   Icon: X },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCFA = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + '\u00A0F';

const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CommandesPage() {
    const router = useRouter();
    const { activeProfile } = useProfileContext();
    const { triggerSync } = useSync();
    const confirm = useConfirm();

    const [activeTab, setActiveTab] = useState<Tab>('PENDING');
    const [processingId, setProcessingId] = useState<string | null>(null);

    // ── Lecture réactive Dexie ───────────────────────────────────────────────

    const allOrders = useLiveQuery(
        async () => {
            if (!activeProfile) return [];
            const rows = await db.orders
                .where('seller_store_id')
                .equals(activeProfile.id)
                .toArray();
            return rows.sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
        },
        [activeProfile?.id]
    );

    const isLoading    = allOrders === undefined;
    const pendingCount = (allOrders ?? []).filter(o => o.status === 'PENDING').length;
    const currentTab   = TABS.find(t => t.id === activeTab)!;
    const visibleOrders = (allOrders ?? []).filter(o => currentTab.statuses.includes(o.status));

    // ── Mutations offline-first ──────────────────────────────────────────────

    const handleAccept = async (order: LocalOrder) => {
        if (processingId) return;
        setProcessingId(order.id);
        try {
            const now = new Date().toISOString();
            // 1. Mise à jour locale — useLiveQuery réagit immédiatement
            await db.orders.update(order.id, { status: 'ACCEPTED', updated_at: now, synced: 0 });
            // 2. Enqueue pour Supabase
            await db.syncQueue.add({
                action: 'ACCEPT_ORDER',
                payload: { id: order.id, status: 'ACCEPTED', updated_at: now },
                status: 'PENDING',
                retry_count: 0,
                created_at: Date.now(),
            });
            triggerSync();
        } finally {
            setProcessingId(null);
        }
    };

    const handleCancel = async (order: LocalOrder) => {
        if (processingId) return;
        const confirmed = await confirm({
            title: 'Refuser la commande ?',
            message: `La commande de ${order.buyer_name ?? 'ce marchand'} pour "${order.product_name}" sera définitivement annulée.`,
            confirmLabel: 'Refuser',
            dangerMode: true,
        });
        if (!confirmed) return;

        setProcessingId(order.id);
        try {
            const now = new Date().toISOString();
            await db.orders.update(order.id, { status: 'CANCELLED', updated_at: now, synced: 0 });
            await db.syncQueue.add({
                action: 'CANCEL_ORDER',
                payload: { id: order.id, status: 'CANCELLED', updated_at: now },
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
                            Mes Commandes
                        </h1>
                        <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                            {isLoading ? '...' : `${allOrders.length} au total`}
                        </p>
                    </div>
                </div>

                {/* Pending KPI */}
                <div className="max-w-lg mx-auto flex flex-col items-center mt-2">
                    <div className="flex items-center gap-2 mb-1">
                        <ShoppingCart size={14} className="text-emerald-200" />
                        <span className="font-bold uppercase tracking-wider text-emerald-100 text-[10px]">
                            En attente de traitement
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                        {isLoading ? (
                            <div className="h-12 w-16 bg-white/10 rounded-xl animate-pulse" />
                        ) : (
                            <>
                                <span className="text-5xl font-black text-white tracking-tighter">
                                    {pendingCount}
                                </span>
                                <span className="text-2xl font-semibold text-emerald-100">
                                    {pendingCount <= 1 ? 'commande' : 'commandes'}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Contenu overlap ── */}
            <div className="px-4 max-w-lg mx-auto relative mt-[-40px] z-10 space-y-4">

                {/* Tabs — flex-1 sur chaque onglet : zéro débordement horizontal */}
                <div className="bg-white dark:bg-slate-900 rounded-[24px] px-2 py-2 shadow-xl border border-slate-100 dark:border-slate-800 flex gap-1.5">
                    {TABS.map(tab => {
                        const isActive  = activeTab === tab.id;
                        const showBadge = tab.id === 'PENDING' && pendingCount > 0;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-[16px] font-bold text-[10px] uppercase tracking-wider transition-all ${
                                    isActive
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-slate-400 dark:text-slate-500'
                                }`}
                            >
                                {tab.label}
                                {showBadge && (
                                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black leading-none shrink-0 ${
                                        isActive ? 'bg-white text-primary' : 'bg-rose-500 text-white'
                                    }`}>
                                        {pendingCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* ── Contenu ── */}

                {isLoading ? (
                    <div className="space-y-3">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="bg-white dark:bg-slate-900 h-28 rounded-[20px] border border-slate-100 dark:border-slate-800 animate-pulse" />
                        ))}
                    </div>
                ) : visibleOrders.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-[24px] p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800">
                        <ShoppingCart size={40} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
                        <p className="font-bold text-slate-300 dark:text-slate-700 uppercase text-[10px] tracking-widest">
                            {activeTab === 'PENDING'
                                ? 'Aucune commande en attente'
                                : activeTab === 'ACCEPTED'
                                ? 'Aucune commande en cours'
                                : 'Historique vide'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {visibleOrders.map((order, i) => {
                                const sBadge     = STATUS_BADGE[order.status];
                                const sIcon      = STATUS_ICON[order.status];
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
                                                {/* Icône + Infos */}
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-12 h-12 shrink-0 rounded-[14px] ${sIcon.bg} flex items-center justify-center`}>
                                                        <sIcon.Icon size={20} className={sIcon.color} />
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

                                                {/* Montant + Badge */}
                                                <div className="text-right shrink-0">
                                                    <p className="font-bold text-sm text-slate-800 dark:text-white">
                                                        {formatCFA(order.total_amount)}
                                                    </p>
                                                    <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 ${sBadge.bg} ${sBadge.text}`}>
                                                        {sBadge.label}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Prix unitaire */}
                                            <p className="text-[10px] text-slate-400 font-bold ml-[60px]">
                                                {formatCFA(order.unit_price)} / unité
                                            </p>

                                            {/* Notes */}
                                            {order.notes && (
                                                <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 italic border-l-2 border-slate-200 dark:border-slate-700 pl-3 leading-relaxed">
                                                    "{order.notes}"
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions — PENDING uniquement */}
                                        {order.status === 'PENDING' && (
                                            <div className="flex gap-2 px-4 pb-4 border-t border-slate-50 dark:border-slate-800 pt-3">
                                                <button
                                                    onClick={() => handleCancel(order)}
                                                    disabled={!!processingId}
                                                    className="flex-1 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 py-3 rounded-xl font-bold text-[10px] uppercase border border-slate-100 dark:border-slate-700 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                                                >
                                                    <X size={13} />
                                                    Refuser
                                                </button>
                                                <button
                                                    onClick={() => handleAccept(order)}
                                                    disabled={!!processingId}
                                                    className="flex-[2] bg-emerald-600 text-white py-3 rounded-xl font-bold text-[10px] uppercase shadow-md shadow-emerald-100 dark:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                                                >
                                                    {isProcessing ? (
                                                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <CheckCircle2 size={13} />
                                                    )}
                                                    Accepter
                                                </button>
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
