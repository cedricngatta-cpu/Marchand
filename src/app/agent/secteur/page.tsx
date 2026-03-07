'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    ChevronLeft, Store, Activity, AlertCircle,
    TrendingUp, Search, RefreshCcw, X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type Health = 'HEALTHY' | 'WARNING' | 'CRITICAL';

interface StoreStat {
    id: string;
    name: string;
    ownerName: string;
    storeType: string;
    monthlyVolume: number;
    lastTxDate: string | null;
    health: Health;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCFA = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + '\u00A0F';

function getHealth(lastDate: string | null): Health {
    if (!lastDate) return 'CRITICAL';
    const days = (Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24);
    if (days <= 7) return 'HEALTHY';
    if (days <= 30) return 'WARNING';
    return 'CRITICAL';
}

function formatLastSeen(iso: string | null): string {
    if (!iso) return 'Jamais';
    const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (min < 60) return `Il y a ${min}min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `Il y a ${h}h`;
    const d = Math.floor(h / 24);
    if (d === 1) return 'Hier';
    if (d <= 6) return `Il y a ${d}j`;
    if (d <= 30) return `Il y a ${Math.floor(d / 7)} sem.`;
    return `Il y a ${Math.floor(d / 30)} mois`;
}

const HEALTH_CONFIG: Record<Health, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    HEALTHY:  { label: 'Actif',    color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: TrendingUp },
    WARNING:  { label: 'Inactif',  color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-900/20',     icon: AlertCircle },
    CRITICAL: { label: 'Critique', color: 'text-rose-500',    bg: 'bg-rose-50 dark:bg-rose-900/20',       icon: AlertCircle },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgentSector() {
    const router = useRouter();
    const [stores, setStores] = useState<StoreStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterHealth, setFilterHealth] = useState<'ALL' | Health>('ALL');

    const load = async () => {
        setLoading(true);
        try {
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            const { data: storeData } = await supabase
                .from('stores')
                .select('id, name, store_type, owner_id')
                .order('name');

            if (!storeData?.length) { setLoading(false); return; }

            const storeIds = storeData.map(s => s.id);
            const ownerIds = storeData.map(s => s.owner_id);

            const [{ data: txMonth }, { data: txAll }, { data: profiles }] = await Promise.all([
                supabase.from('transactions').select('store_id, price').in('store_id', storeIds).gte('created_at', monthStart),
                supabase.from('transactions').select('store_id, created_at').in('store_id', storeIds).order('created_at', { ascending: false }),
                supabase.from('profiles').select('id, name').in('id', ownerIds),
            ]);

            const volMap: Record<string, number> = {};
            for (const t of txMonth ?? []) volMap[t.store_id] = (volMap[t.store_id] ?? 0) + (t.price ?? 0);

            const lastMap: Record<string, string> = {};
            for (const t of txAll ?? []) {
                if (!lastMap[t.store_id]) lastMap[t.store_id] = t.created_at;
            }

            const profileMap: Record<string, string> = {};
            for (const p of profiles ?? []) profileMap[p.id] = p.name ?? '—';

            const result: StoreStat[] = storeData.map(s => ({
                id: s.id,
                name: s.name,
                ownerName: profileMap[s.owner_id] ?? '—',
                storeType: s.store_type ?? '',
                monthlyVolume: volMap[s.id] ?? 0,
                lastTxDate: lastMap[s.id] ?? null,
                health: getHealth(lastMap[s.id] ?? null),
            }));

            result.sort((a, b) => {
                const order: Record<Health, number> = { CRITICAL: 0, WARNING: 1, HEALTHY: 2 };
                return order[a.health] - order[b.health];
            });

            setStores(result);
        } catch (err) {
            console.error('[Secteur] fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const filtered = stores.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.ownerName.toLowerCase().includes(search.toLowerCase());
        const matchHealth = filterHealth === 'ALL' || s.health === filterHealth;
        return matchSearch && matchHealth;
    });

    const healthyCount = stores.filter(s => s.health === 'HEALTHY').length;
    const criticalCount = stores.filter(s => s.health === 'CRITICAL').length;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 overflow-x-hidden">

            {/* ── Header ── */}
            <div className="bg-emerald-600 pt-8 pb-32 px-4 rounded-b-[2.5rem] shadow-lg">
                <div className="flex items-center justify-between mb-6 max-w-lg mx-auto">
                    <button onClick={() => router.back()} className="w-10 h-10 bg-white text-emerald-600 rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm shrink-0">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-center">
                        <h1 className="text-white font-bold text-lg tracking-wide uppercase leading-none">Mon Secteur</h1>
                        <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mt-0.5">Supervision locale</p>
                    </div>
                    <button onClick={load} className="w-10 h-10 bg-white text-emerald-600 rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm shrink-0">
                        <RefreshCcw size={16} />
                    </button>
                </div>

                <div className="max-w-lg mx-auto flex items-center justify-center gap-8 mt-2">
                    {[
                        { value: stores.length, label: 'Total' },
                        { value: healthyCount, label: 'Actives' },
                        { value: criticalCount, label: 'Alertes', red: true },
                    ].map((item, i) => (
                        <React.Fragment key={item.label}>
                            {i > 0 && <div className="w-px h-10 bg-white/20" />}
                            <div className="text-center">
                                {loading
                                    ? <div className="h-10 w-12 bg-white/10 rounded-xl animate-pulse mx-auto" />
                                    : <span className={`text-4xl font-black tracking-tighter ${item.red && item.value > 0 ? 'text-rose-300' : 'text-white'}`}>{item.value}</span>
                                }
                                <p className="text-emerald-200/70 text-[10px] font-bold uppercase tracking-wider mt-0.5">{item.label}</p>
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* ── Contenu ── */}
            <div className="px-4 max-w-lg mx-auto relative mt-[-40px] z-10 space-y-4">

                {/* Recherche */}
                <div className="bg-white dark:bg-slate-900 rounded-[20px] px-4 py-3 shadow-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <Search size={16} className="text-slate-300 shrink-0" />
                    <input
                        type="text"
                        placeholder="Boutique ou propriétaire..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="flex-1 bg-transparent font-bold text-sm text-slate-800 dark:text-white outline-none placeholder:text-slate-300 uppercase"
                    />
                    {search && <button onClick={() => setSearch('')} className="text-slate-300"><X size={14} /></button>}
                </div>

                {/* Filtres */}
                <div className="flex gap-2">
                    {(['ALL', 'HEALTHY', 'WARNING', 'CRITICAL'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilterHealth(f)}
                            className={`flex-1 py-2.5 rounded-[14px] font-bold text-[9px] uppercase tracking-wider transition-all ${filterHealth === f
                                ? f === 'ALL' ? 'bg-emerald-600 text-white'
                                    : f === 'HEALTHY' ? 'bg-emerald-500 text-white'
                                        : f === 'WARNING' ? 'bg-amber-500 text-white'
                                            : 'bg-rose-500 text-white'
                                : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800'}`}
                        >
                            {f === 'ALL' ? 'Tous' : f === 'HEALTHY' ? 'Actifs' : f === 'WARNING' ? 'Inactifs' : 'Critiques'}
                        </button>
                    ))}
                </div>

                {/* Liste */}
                {loading ? (
                    <div className="space-y-3">
                        {[0, 1, 2, 3].map(i => <div key={i} className="bg-white dark:bg-slate-900 h-20 rounded-[20px] border border-slate-100 dark:border-slate-800 animate-pulse" />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-[24px] p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800">
                        <Store size={40} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
                        <p className="font-bold text-slate-300 dark:text-slate-700 uppercase text-[10px] tracking-widest">
                            {search ? 'Aucun résultat' : 'Aucune boutique'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((s, i) => {
                            const cfg = HEALTH_CONFIG[s.health];
                            const HealthIcon = cfg.icon;
                            return (
                                <motion.div
                                    key={s.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 p-4 shadow-sm flex items-center gap-3"
                                >
                                    <div className={`w-12 h-12 shrink-0 rounded-[14px] ${cfg.bg} flex items-center justify-center`}>
                                        <Store size={20} className={cfg.color} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{s.name}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-bold text-slate-400 uppercase">
                                            <span>{s.ownerName}</span>
                                            <span>·</span>
                                            <span className="flex items-center gap-0.5"><Activity size={9} /> {formatLastSeen(s.lastTxDate)}</span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-bold text-sm text-slate-800 dark:text-white">{formatCFA(s.monthlyVolume)}</p>
                                        <div className={`flex items-center justify-end gap-0.5 text-[9px] font-black uppercase tracking-wider ${cfg.color}`}>
                                            <HealthIcon size={9} />
                                            {cfg.label}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Banner critique */}
                {!loading && criticalCount > 0 && filterHealth !== 'CRITICAL' && (
                    <button
                        onClick={() => setFilterHealth('CRITICAL')}
                        className="w-full p-4 bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-200 dark:border-rose-800 rounded-[18px] text-rose-600 font-black text-xs uppercase tracking-widest text-center active:scale-95 transition-all"
                    >
                        ⚠ {criticalCount} boutique{criticalCount > 1 ? 's' : ''} critique{criticalCount > 1 ? 's' : ''} — Visites requises
                    </button>
                )}

            </div>
        </div>
    );
}
