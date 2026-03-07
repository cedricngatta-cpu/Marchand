'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/context/AuthContext';
import { useSync } from '@/context/SyncContext';
import { useProfileContext } from '@/context/ProfileContext';
import { useRouter } from 'next/navigation';
import {
    CheckCircle2, ChevronLeft, ChevronRight, Clock,
    LogOut, Package, PlusCircle, ShoppingCart,
    TrendingUp, Truck, User, X,
} from 'lucide-react';
import { db, LocalOrder, LocalProduct, LocalStock } from '@/lib/db';

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = LocalOrder['status'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCFA = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + '\u00A0F';

const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const currentMonthLabel = () =>
    new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

const isCurrentMonth = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<OrderStatus, { bg: string; text: string; label: string }> = {
    PENDING:   { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'En attente' },
    ACCEPTED:  { bg: 'bg-blue-100',    text: 'text-blue-700',    label: 'Acceptée' },
    SHIPPED:   { bg: 'bg-purple-100',  text: 'text-purple-700',  label: 'Expédiée' },
    DELIVERED: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Livrée' },
    CANCELLED: { bg: 'bg-slate-100',   text: 'text-slate-500',   label: 'Annulée' },
};

const STATUS_ICON: Record<OrderStatus, { bg: string; color: string; Icon: React.ElementType }> = {
    PENDING:   { bg: 'bg-amber-100',   color: 'text-amber-600',   Icon: Clock },
    ACCEPTED:  { bg: 'bg-blue-100',    color: 'text-blue-600',    Icon: CheckCircle2 },
    SHIPPED:   { bg: 'bg-purple-100',  color: 'text-purple-600',  Icon: Truck },
    DELIVERED: { bg: 'bg-emerald-100', color: 'text-emerald-600', Icon: CheckCircle2 },
    CANCELLED: { bg: 'bg-slate-100',   color: 'text-slate-500',   Icon: X },
};

// ─── KpiCell ──────────────────────────────────────────────────────────────────

interface KpiCellProps {
    icon: React.ElementType;
    label: string;
    value: string;
    unit: string;
    sub?: string;
    iconBg: string;
    iconColor: string;
    badge?: number;
    loading?: boolean;
    onClick: () => void;
}

function KpiCell({ icon: Icon, label, value, unit, sub, iconBg, iconColor, badge, loading, onClick }: KpiCellProps) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col active:scale-95 transition-transform text-left w-full"
        >
            <div className="flex items-center justify-between mb-2.5 w-full">
                <div className={`w-11 h-11 rounded-[14px] ${iconBg} flex items-center justify-center shrink-0`}>
                    <Icon size={20} className={iconColor} />
                </div>
                {badge !== undefined && badge > 0 ? (
                    <span className="bg-rose-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                        {badge}
                    </span>
                ) : (
                    <ChevronRight size={13} className="text-slate-300 dark:text-slate-600" />
                )}
            </div>
            {loading ? (
                <div className="h-6 w-14 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse mb-0.5" />
            ) : (
                <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white leading-none">
                        {value}
                    </span>
                    <span className="text-[10px] font-bold text-primary leading-none">{unit}</span>
                </div>
            )}
            {sub && (
                <span className="text-[9px] text-slate-400 font-bold mt-0.5 truncate w-full">{sub}</span>
            )}
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">{label}</span>
        </button>
    );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function ProducteurDashboard() {
    const { user, logout } = useAuth();
    const { isOnline, syncPendingCount } = useSync();
    const { activeProfile } = useProfileContext();
    const router = useRouter();

    const handleLogout = () => { logout(); router.push('/login'); };

    // ── Requêtes Dexie réactives ─────────────────────────────────────────────

    const orders = useLiveQuery<LocalOrder[]>(
        () => activeProfile
            ? db.orders.where('seller_store_id').equals(activeProfile.id).toArray()
            : Promise.resolve([]),
        [activeProfile?.id]
    );

    const stocks = useLiveQuery<LocalStock[]>(
        () => activeProfile
            ? db.stocks.where('store_id').equals(activeProfile.id).toArray()
            : Promise.resolve([]),
        [activeProfile?.id]
    );

    const products = useLiveQuery<LocalProduct[]>(
        () => activeProfile
            ? db.products.where('store_id').equals(activeProfile.id).toArray()
            : Promise.resolve([]),
        [activeProfile?.id]
    );

    const isLoading = orders === undefined || stocks === undefined || products === undefined;

    // ── KPIs ─────────────────────────────────────────────────────────────────

    const pendingCount   = orders?.filter(o => o.status === 'PENDING').length ?? 0;
    const deliveredMonth = orders?.filter(o => o.status === 'DELIVERED' && isCurrentMonth(o.updated_at || o.created_at)) ?? [];
    const revenueMonth   = deliveredMonth.reduce((s, o) => s + o.total_amount, 0);
    const stockUnits     = stocks?.reduce((s, st) => s + st.quantity, 0) ?? 0;
    const stockValue     = stocks?.reduce((s, st) => {
        const p = products?.find(p => p.id === st.product_id);
        return s + st.quantity * (p?.price ?? 0);
    }, 0) ?? 0;

    const recentOrders = [...(orders ?? [])]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 4);

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 overflow-x-hidden">

            {/* ── Header wave ── */}
            <div className="bg-primary pt-8 pb-32 px-4 rounded-b-[2.5rem] shadow-lg">
                <div className="flex justify-between items-center mb-6 max-w-lg mx-auto">
                    <button
                        onClick={() => router.push('/profil')}
                        className="w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm shrink-0"
                    >
                        <User size={20} />
                    </button>

                    <div className="text-center min-w-0 px-2">
                        <h1 className="text-white font-bold text-lg tracking-wide uppercase leading-none">
                            Espace Producteur
                        </h1>
                        <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mt-0.5 flex items-center justify-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOnline ? 'bg-emerald-300' : 'bg-red-400'}`} />
                            <span className="truncate">Salut, {user?.name}</span>
                            {syncPendingCount > 0 && (
                                <span className="bg-amber-400 text-slate-900 rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-black leading-none shrink-0">
                                    {syncPendingCount}
                                </span>
                            )}
                        </p>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-10 h-10 bg-white text-rose-500 rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm shrink-0"
                    >
                        <LogOut size={18} />
                    </button>
                </div>

                {/* Revenue KPI */}
                <div className="max-w-lg mx-auto flex flex-col items-center mt-2">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp size={14} className="text-emerald-200" />
                        <span className="font-bold uppercase tracking-wider text-emerald-100 text-[10px]">
                            Revenus — {currentMonthLabel()}
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                        {isLoading ? (
                            <div className="h-12 w-40 bg-white/10 rounded-xl animate-pulse" />
                        ) : (
                            <>
                                <span className="text-5xl font-black text-white tracking-tighter">
                                    {new Intl.NumberFormat('fr-FR').format(revenueMonth)}
                                </span>
                                <span className="text-2xl font-semibold text-emerald-100">F</span>
                            </>
                        )}
                    </div>
                    <p className="text-emerald-200/60 text-[10px] font-bold uppercase tracking-wider mt-1">
                        {deliveredMonth.length} livraison{deliveredMonth.length > 1 ? 's' : ''} validée{deliveredMonth.length > 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* ── Contenu overlap ── */}
            <div className="px-4 max-w-lg mx-auto relative mt-[-40px] z-10 space-y-4">

                {/* KPI Nav Grid — 2×2 dans une carte blanche */}
                <div className="bg-white dark:bg-slate-900 rounded-[24px] p-5 shadow-xl border border-slate-100 dark:border-slate-800">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                        <KpiCell
                            icon={Package}
                            label="Mon Stock"
                            value={String(stockUnits)}
                            unit="u"
                            sub={formatCFA(stockValue)}
                            iconBg="bg-amber-100 dark:bg-amber-900/30"
                            iconColor="text-amber-600"
                            loading={isLoading}
                            onClick={() => router.push('/producteur/stock')}
                        />
                        <KpiCell
                            icon={ShoppingCart}
                            label="Commandes"
                            value={pendingCount > 0 ? String(pendingCount) : '0'}
                            unit={pendingCount > 0 ? 'nouvelles' : ''}
                            sub="À préparer"
                            iconBg="bg-blue-100 dark:bg-blue-900/30"
                            iconColor="text-blue-600"
                            badge={pendingCount > 0 ? pendingCount : undefined}
                            loading={isLoading}
                            onClick={() => router.push('/producteur/commandes')}
                        />

                        {/* Séparateur horizontal */}
                        <div className="col-span-2 h-px bg-slate-100 dark:bg-slate-800 -mx-5" />

                        <KpiCell
                            icon={Truck}
                            label="Livraisons"
                            value={String(deliveredMonth.length)}
                            unit=""
                            sub="Ce mois-ci"
                            iconBg="bg-emerald-100 dark:bg-emerald-900/30"
                            iconColor="text-emerald-600"
                            loading={isLoading}
                            onClick={() => router.push('/producteur/livraisons')}
                        />
                        <KpiCell
                            icon={TrendingUp}
                            label="Revenus"
                            value={revenueMonth > 0 ? String(Math.round(revenueMonth / 1000)) : '0'}
                            unit="k F"
                            sub="ce mois"
                            iconBg="bg-purple-100 dark:bg-purple-900/30"
                            iconColor="text-purple-600"
                            loading={isLoading}
                            onClick={() => router.push('/producteur/revenus')}
                        />
                    </div>
                </div>

                {/* CTA : Déclarer une récolte */}
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/producteur/publier')}
                    className="w-full bg-primary text-white py-5 rounded-[20px] font-bold text-sm uppercase tracking-widest shadow-lg shadow-emerald-200 dark:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                    <PlusCircle size={20} />
                    Déclarer une Récolte
                </motion.button>

                {/* Dernières commandes */}
                <div className="bg-white dark:bg-slate-900 rounded-[24px] p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-widest">
                            Dernières Commandes
                        </h3>
                        <button
                            onClick={() => router.push('/producteur/commandes')}
                            className="text-primary text-[10px] font-bold uppercase tracking-wider active:opacity-70"
                        >
                            Voir tout
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="space-y-3">
                            {[0, 1, 2].map(i => (
                                <div key={i} className="h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : recentOrders.length === 0 ? (
                        <div className="py-8 text-center">
                            <ShoppingCart size={32} className="mx-auto text-slate-200 dark:text-slate-700 mb-2" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-600">
                                Aucune commande reçue
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentOrders.map(order => {
                                const sIcon = STATUS_ICON[order.status];
                                const sBadge = STATUS_BADGE[order.status];
                                return (
                                    <div key={order.id} className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-10 h-10 rounded-full ${sIcon.bg} flex items-center justify-center shrink-0`}>
                                                <sIcon.Icon size={16} className={sIcon.color} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-xs text-slate-800 dark:text-white truncate">
                                                    {order.product_name}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                                    {order.buyer_name ?? '—'} · {formatDate(order.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-bold text-sm text-slate-800 dark:text-white">
                                                {formatCFA(order.total_amount)}
                                            </p>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${sBadge.bg} ${sBadge.text}`}>
                                                {sBadge.label}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
