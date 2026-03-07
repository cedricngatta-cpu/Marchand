'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    BarChart3, ChevronRight, LogOut, ShoppingBag,
    TrendingUp, Truck, User, Users,
} from 'lucide-react';
import { useConfirm } from '@/context/ConfirmContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCFA = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + '\u00A0F';
const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`;
};
const monthStart = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
};
const currentMonthLabel = () =>
    new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecentActivity {
    id: string;
    type: 'VENTE' | 'LIVRAISON' | 'COMMANDE';
    label: string;
    sub: string;
    amount: number;
    time: string;
}

interface Stats {
    memberCount: number;
    monthlyVolume: number;
    pendingOrders: number;
    monthlyTxCount: number;
    loading: boolean;
}

// ─── KPI Cell ─────────────────────────────────────────────────────────────────

interface KpiProps {
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

function KpiCell({ icon: Icon, label, value, unit, sub, iconBg, iconColor, badge, loading, onClick }: KpiProps) {
    return (
        <button onClick={onClick} className="flex flex-col active:scale-95 transition-transform text-left w-full">
            <div className="flex items-center justify-between mb-2.5 w-full">
                <div className={`w-11 h-11 rounded-[14px] ${iconBg} flex items-center justify-center shrink-0`}>
                    <Icon size={20} className={iconColor} />
                </div>
                {badge !== undefined && badge > 0 ? (
                    <span className="bg-rose-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full leading-none">{badge}</span>
                ) : (
                    <ChevronRight size={13} className="text-slate-300 dark:text-slate-600" />
                )}
            </div>
            {loading ? (
                <div className="h-6 w-14 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse mb-0.5" />
            ) : (
                <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white leading-none">{value}</span>
                    <span className="text-[10px] font-bold text-purple-600 leading-none">{unit}</span>
                </div>
            )}
            {sub && <span className="text-[9px] text-slate-400 font-bold mt-0.5 truncate w-full">{sub}</span>}
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">{label}</span>
        </button>
    );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function CooperativeDashboard() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const confirm = useConfirm();

    const [stats, setStats] = useState<Stats>({
        memberCount: 0, monthlyVolume: 0, pendingOrders: 0, monthlyTxCount: 0, loading: true,
    });
    const [activities, setActivities] = useState<RecentActivity[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                const ms = monthStart();

                // Membres (MERCHANT + PRODUCER)
                const { count: memberCount } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .in('role', ['MERCHANT', 'PRODUCER']);

                // Volume mensuel des transactions
                const { data: txData } = await supabase
                    .from('transactions')
                    .select('id, price')
                    .gte('created_at', ms);

                const monthlyVolume = txData?.reduce((s, t) => s + (t.price ?? 0), 0) ?? 0;
                const monthlyTxCount = txData?.length ?? 0;

                // Commandes B2B actives
                const { count: pendingOrders } = await supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true })
                    .in('status', ['PENDING', 'ACCEPTED', 'SHIPPED']);

                setStats({
                    memberCount: memberCount ?? 0,
                    monthlyVolume,
                    pendingOrders: pendingOrders ?? 0,
                    monthlyTxCount,
                    loading: false,
                });

                // Activités récentes : dernières transactions + dernières commandes
                const { data: recentTx } = await supabase
                    .from('transactions')
                    .select('id, type, product_name, price, status, created_at')
                    .order('created_at', { ascending: false })
                    .limit(4);

                const { data: recentOrders } = await supabase
                    .from('orders')
                    .select('id, product_name, total_amount, status, buyer_name, created_at')
                    .order('created_at', { ascending: false })
                    .limit(3);

                const acts: RecentActivity[] = [
                    ...(recentTx ?? []).map(t => ({
                        id: t.id,
                        type: t.type as 'VENTE' | 'LIVRAISON',
                        label: t.product_name,
                        sub: t.type === 'VENTE' ? 'Vente' : 'Livraison',
                        amount: t.price ?? 0,
                        time: t.created_at,
                    })),
                    ...(recentOrders ?? []).map(o => ({
                        id: o.id,
                        type: 'COMMANDE' as const,
                        label: o.product_name,
                        sub: `Commande · ${o.buyer_name ?? '—'}`,
                        amount: o.total_amount ?? 0,
                        time: o.created_at,
                    })),
                ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

                setActivities(acts);
            } catch (err) {
                console.error('[Coop Dashboard] fetch error:', err);
                setStats(s => ({ ...s, loading: false }));
            }
        };
        load();
    }, []);

    const actIcon = (type: RecentActivity['type']) => {
        if (type === 'COMMANDE') return { icon: Truck, bg: 'bg-blue-100', color: 'text-blue-600' };
        if (type === 'LIVRAISON') return { icon: Truck, bg: 'bg-purple-100', color: 'text-purple-600' };
        return { icon: TrendingUp, bg: 'bg-emerald-100', color: 'text-emerald-600' };
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 overflow-x-hidden">

            {/* ── Header wave ── */}
            <div className="bg-purple-700 pt-8 pb-32 px-4 rounded-b-[2.5rem] shadow-lg">
                <div className="flex justify-between items-center mb-6 max-w-lg mx-auto">
                    <button
                        onClick={() => router.push('/profil')}
                        className="w-10 h-10 bg-white text-purple-700 rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm shrink-0"
                    >
                        <User size={20} />
                    </button>
                    <div className="text-center min-w-0 px-2">
                        <h1 className="text-white font-bold text-lg tracking-wide uppercase leading-none">
                            Coopérative
                        </h1>
                        <p className="text-purple-200 text-[10px] font-bold uppercase tracking-widest mt-0.5 truncate">
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

                {/* Volume mensuel hero */}
                <div className="max-w-lg mx-auto flex flex-col items-center mt-2">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp size={14} className="text-purple-200" />
                        <span className="font-bold uppercase tracking-wider text-purple-100 text-[10px]">
                            Volume — {currentMonthLabel()}
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                        {stats.loading ? (
                            <div className="h-12 w-48 bg-white/10 rounded-xl animate-pulse" />
                        ) : (
                            <>
                                <span className="text-5xl font-black text-white tracking-tighter">
                                    {new Intl.NumberFormat('fr-FR').format(stats.monthlyVolume)}
                                </span>
                                <span className="text-2xl font-semibold text-purple-100">F</span>
                            </>
                        )}
                    </div>
                    <p className="text-purple-200/60 text-[10px] font-bold uppercase tracking-wider mt-1">
                        {stats.monthlyTxCount} transaction{stats.monthlyTxCount > 1 ? 's' : ''} ce mois
                    </p>
                </div>
            </div>

            {/* ── Contenu overlap ── */}
            <div className="px-4 max-w-lg mx-auto relative mt-[-40px] z-10 space-y-4">

                {/* KPI Grid */}
                <div className="bg-white dark:bg-slate-900 rounded-[24px] p-5 shadow-xl border border-slate-100 dark:border-slate-800">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                        <KpiCell
                            icon={Users}
                            label="Membres"
                            value={String(stats.memberCount)}
                            unit=""
                            sub="Marchands & Producteurs"
                            iconBg="bg-purple-100 dark:bg-purple-900/30"
                            iconColor="text-purple-600"
                            loading={stats.loading}
                            onClick={() => router.push('/cooperative/membres')}
                        />
                        <KpiCell
                            icon={Truck}
                            label="Commandes B2B"
                            value={String(stats.pendingOrders)}
                            unit={stats.pendingOrders > 0 ? 'actives' : ''}
                            sub="En cours / attente"
                            iconBg="bg-blue-100 dark:bg-blue-900/30"
                            iconColor="text-blue-600"
                            badge={stats.pendingOrders > 0 ? stats.pendingOrders : undefined}
                            loading={stats.loading}
                            onClick={() => router.push('/cooperative/achats')}
                        />

                        <div className="col-span-2 h-px bg-slate-100 dark:bg-slate-800 -mx-5" />

                        <KpiCell
                            icon={BarChart3}
                            label="Analyses"
                            value="Marchés"
                            unit=""
                            sub="Tendances sectorielles"
                            iconBg="bg-blue-100 dark:bg-blue-900/30"
                            iconColor="text-blue-600"
                            loading={false}
                            onClick={() => router.push('/cooperative/analyses')}
                        />
                        <KpiCell
                            icon={TrendingUp}
                            label="Performances"
                            value="Impact"
                            unit=""
                            sub="Objectifs & Classement"
                            iconBg="bg-amber-100 dark:bg-amber-900/30"
                            iconColor="text-amber-600"
                            loading={false}
                            onClick={() => router.push('/cooperative/performances')}
                        />
                    </div>
                </div>

                {/* CTA Membres */}
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/cooperative/membres')}
                    className="w-full bg-purple-700 text-white py-5 rounded-[20px] font-bold text-sm uppercase tracking-widest shadow-lg shadow-purple-200 dark:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                    <Users size={20} />
                    Gérer les membres
                </motion.button>

                {/* Activités récentes */}
                <div className="bg-white dark:bg-slate-900 rounded-[24px] p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-widest">
                            Activités Récentes
                        </h3>
                        <button
                            onClick={() => router.push('/cooperative/journal')}
                            className="text-purple-600 text-[10px] font-bold uppercase tracking-wider active:opacity-70"
                        >
                            Tout voir
                        </button>
                    </div>

                    {stats.loading ? (
                        <div className="space-y-3">
                            {[0, 1, 2].map(i => (
                                <div key={i} className="h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="py-8 text-center">
                            <TrendingUp size={32} className="mx-auto text-slate-200 dark:text-slate-700 mb-2" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-600">
                                Aucune activité récente
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activities.map(act => {
                                const { icon: Icon, bg, color } = actIcon(act.type);
                                return (
                                    <div key={act.id} className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center shrink-0`}>
                                            <Icon size={15} className={color} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-xs text-slate-800 dark:text-white truncate">{act.label}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5 truncate">{act.sub} · {formatDate(act.time)}</p>
                                        </div>
                                        <p className="font-bold text-sm text-slate-800 dark:text-white shrink-0">
                                            {formatCFA(act.amount)}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* CTA Achats groupés */}
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/cooperative/achats')}
                    className="w-full bg-emerald-600 text-white py-5 rounded-[20px] font-bold text-sm uppercase tracking-widest shadow-lg shadow-emerald-200 dark:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                    <ShoppingBag size={20} />
                    Achats Groupés
                </motion.button>

            </div>
        </div>
    );
}
