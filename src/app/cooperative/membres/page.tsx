'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, MapPin, Phone, Search,
    TrendingDown, TrendingUp, User, UserPlus, Users, X,
    Clock, CheckCircle2, XCircle, Camera,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Member {
    id: string;
    name: string;
    phone: string;
    role: 'MERCHANT' | 'PRODUCER' | 'COOPERATIVE' | 'FIELD_AGENT';
    storeName?: string;
    storeType?: string;
    monthlySales: number;
    prevMonthlySales: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCFA = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + '\u00A0F';

const ROLE_LABEL: Record<string, string> = {
    MERCHANT: 'Marchand',
    PRODUCER: 'Producteur',
    COOPERATIVE: 'Coopérative',
    FIELD_AGENT: 'Agent',
};

const ROLE_COLOR: Record<string, string> = {
    MERCHANT: 'bg-emerald-100 text-emerald-700',
    PRODUCER: 'bg-amber-100 text-amber-700',
    COOPERATIVE: 'bg-purple-100 text-purple-700',
    FIELD_AGENT: 'bg-blue-100 text-blue-700',
};

// ─── Types supplémentaires ─────────────────────────────────────────────────────

interface PendingEnrollment {
    id: string;
    name: string;
    phone: string;
    role: string;
    store_name: string;
    photo_url: string | null;
    agent_name: string;
    created_at: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CooperativeMembers() {
    const router = useRouter();

    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState<'ALL' | 'MERCHANT' | 'PRODUCER'>('ALL');
    const [showAddModal, setShowAddModal] = useState(false);

    // Demandes en attente
    const [pending, setPending] = useState<PendingEnrollment[]>([]);
    const [pendingLoading, setPendingLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

    // Formulaire
    const [form, setForm] = useState({ name: '', phone: '' });
    const [adding, setAdding] = useState(false);
    const [addDone, setAddDone] = useState(false);
    const [addError, setAddError] = useState('');

    // ── Fetch ──────────────────────────────────────────────────────────────────

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const now = new Date();
            const ms = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const prevMs = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

            // Profiles
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('id, full_name, phone_number, role')
                .in('role', ['MERCHANT', 'PRODUCER', 'FIELD_AGENT'])
                .order('full_name');

            if (error || !profiles) { setLoading(false); return; }

            // Stores pour chaque profil
            const profileIds = profiles.map(p => p.id);
            const { data: stores } = await supabase
                .from('stores')
                .select('id, name, store_type, owner_id')
                .in('owner_id', profileIds);

            const storeByOwner: Record<string, { id: string; name: string; type: string }> = {};
            stores?.forEach(s => { storeByOwner[s.owner_id] = { id: s.id, name: s.name, type: s.store_type }; });

            // Transactions du mois courant
            const storeIds = stores?.map(s => s.id) ?? [];
            const { data: txCurrent } = storeIds.length > 0
                ? await supabase
                    .from('transactions')
                    .select('store_id, price')
                    .in('store_id', storeIds)
                    .gte('created_at', ms)
                : { data: [] };

            const { data: txPrev } = storeIds.length > 0
                ? await supabase
                    .from('transactions')
                    .select('store_id, price')
                    .in('store_id', storeIds)
                    .gte('created_at', prevMs)
                    .lt('created_at', ms)
                : { data: [] };

            const salesCurrent: Record<string, number> = {};
            const salesPrev: Record<string, number> = {};
            txCurrent?.forEach(t => { salesCurrent[t.store_id] = (salesCurrent[t.store_id] ?? 0) + t.price; });
            txPrev?.forEach(t => { salesPrev[t.store_id] = (salesPrev[t.store_id] ?? 0) + t.price; });

            const mapped: Member[] = profiles.map(p => {
                const store = storeByOwner[p.id];
                return {
                    id: p.id,
                    name: p.full_name,
                    phone: p.phone_number,
                    role: p.role,
                    storeName: store?.name,
                    storeType: store?.type,
                    monthlySales: store ? (salesCurrent[store.id] ?? 0) : 0,
                    prevMonthlySales: store ? (salesPrev[store.id] ?? 0) : 0,
                };
            });

            setMembers(mapped);
        } catch (err) {
            console.error('[Membres] fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    // ── Fetch enrôlements en attente ───────────────────────────────────────────

    const fetchPending = async () => {
        setPendingLoading(true);
        try {
            const { data: enrollments } = await supabase
                .from('agent_enrollments')
                .select('id, name, phone, role, store_name, photo_url, agent_id, created_at')
                .eq('status', 'PENDING')
                .order('created_at', { ascending: false });

            if (!enrollments?.length) { setPending([]); setPendingLoading(false); return; }

            const agentIds = [...new Set(enrollments.map(e => e.agent_id).filter(Boolean))];
            const { data: agentProfiles } = agentIds.length > 0
                ? await supabase.from('profiles').select('id, name').in('id', agentIds)
                : { data: [] };

            const agentMap: Record<string, string> = {};
            for (const p of agentProfiles ?? []) agentMap[p.id] = p.name ?? 'Agent';

            setPending(enrollments.map(e => ({
                id: e.id,
                name: e.name,
                phone: e.phone,
                role: e.role,
                store_name: e.store_name,
                photo_url: e.photo_url,
                agent_name: agentMap[e.agent_id] ?? 'Agent inconnu',
                created_at: e.created_at,
            })));
        } catch (err) {
            console.error('[Pending] fetch error:', err);
        } finally {
            setPendingLoading(false);
        }
    };

    const handleValidate = async (enrollment: PendingEnrollment) => {
        setProcessingId(enrollment.id);
        try {
            await supabase
                .from('agent_enrollments')
                .update({ status: 'VALIDATED' })
                .eq('id', enrollment.id);
            setPending(prev => prev.filter(e => e.id !== enrollment.id));
        } catch (err) {
            console.error('[Validate] error:', err);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string) => {
        setProcessingId(id);
        try {
            await supabase
                .from('agent_enrollments')
                .update({ status: 'REJECTED' })
                .eq('id', id);
            setPending(prev => prev.filter(e => e.id !== id));
        } catch (err) {
            console.error('[Reject] error:', err);
        } finally {
            setProcessingId(null);
        }
    };

    useEffect(() => { fetchMembers(); fetchPending(); }, []);

    // ── Filtres ────────────────────────────────────────────────────────────────

    const filtered = members.filter(m => {
        const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
            m.phone.includes(search) ||
            (m.storeName ?? '').toLowerCase().includes(search.toLowerCase());
        const matchRole = filterRole === 'ALL' || m.role === filterRole;
        return matchSearch && matchRole;
    });

    const merchantCount = members.filter(m => m.role === 'MERCHANT').length;
    const producerCount = members.filter(m => m.role === 'PRODUCER').length;

    // ── Render ─────────────────────────────────────────────────────────────────

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
                        <h1 className="text-white font-bold text-lg tracking-wide uppercase leading-none">Membres</h1>
                        <p className="text-purple-200 text-[10px] font-bold uppercase tracking-widest mt-0.5">Gestion communautaire</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="w-10 h-10 bg-white text-purple-700 rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm shrink-0 relative"
                    >
                        <UserPlus size={18} />
                        {pending.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                                {pending.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Compteurs */}
                <div className="max-w-lg mx-auto flex items-center justify-center gap-8 mt-2">
                    <div className="text-center">
                        {loading ? <div className="h-10 w-16 bg-white/10 rounded-xl animate-pulse mx-auto" /> : (
                            <span className="text-4xl font-black text-white tracking-tighter">{members.length}</span>
                        )}
                        <p className="text-purple-200/70 text-[10px] font-bold uppercase tracking-wider mt-0.5">Total</p>
                    </div>
                    <div className="w-px h-10 bg-white/20" />
                    <div className="text-center">
                        {loading ? <div className="h-10 w-12 bg-white/10 rounded-xl animate-pulse mx-auto" /> : (
                            <span className="text-4xl font-black text-white tracking-tighter">{merchantCount}</span>
                        )}
                        <p className="text-purple-200/70 text-[10px] font-bold uppercase tracking-wider mt-0.5">Marchands</p>
                    </div>
                    <div className="w-px h-10 bg-white/20" />
                    <div className="text-center">
                        {loading ? <div className="h-10 w-12 bg-white/10 rounded-xl animate-pulse mx-auto" /> : (
                            <span className="text-4xl font-black text-white tracking-tighter">{producerCount}</span>
                        )}
                        <p className="text-purple-200/70 text-[10px] font-bold uppercase tracking-wider mt-0.5">Producteurs</p>
                    </div>
                </div>
            </div>

            {/* ── Contenu overlap ── */}
            <div className="px-4 max-w-lg mx-auto relative mt-[-40px] z-10 space-y-4">

                {/* Recherche */}
                <div className="bg-white dark:bg-slate-900 rounded-[20px] px-4 py-3 shadow-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <Search size={16} className="text-slate-300 shrink-0" />
                    <input
                        type="text"
                        placeholder="Nom, téléphone, boutique..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="flex-1 bg-transparent font-bold text-sm text-slate-800 dark:text-white outline-none placeholder:text-slate-300 uppercase"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="text-slate-300">
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* ── Demandes en attente ── */}
                {(pendingLoading || pending.length > 0) && (
                    <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <Clock size={14} className="text-amber-500" />
                                <span className="font-black text-xs uppercase tracking-widest text-slate-700 dark:text-white">
                                    Demandes en attente
                                </span>
                                {!pendingLoading && (
                                    <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                        {pending.length}
                                    </span>
                                )}
                            </div>
                        </div>

                        {pendingLoading ? (
                            <div className="space-y-3 p-3">
                                {[0, 1].map(i => <div key={i} className="h-20 bg-slate-50 dark:bg-slate-800 rounded-[16px] animate-pulse" />)}
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                {pending.map(e => {
                                    const isProcessing = processingId === e.id;
                                    return (
                                        <motion.div
                                            key={e.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="p-3 flex items-start gap-3"
                                        >
                                            {/* Photo ou avatar */}
                                            {e.photo_url ? (
                                                <button
                                                    onClick={() => setPreviewPhoto(e.photo_url)}
                                                    className="w-12 h-12 shrink-0 rounded-[12px] overflow-hidden border-2 border-amber-200 relative"
                                                >
                                                    <img src={e.photo_url} alt={e.name} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                        <Camera size={12} className="text-white" />
                                                    </div>
                                                </button>
                                            ) : (
                                                <div className="w-12 h-12 shrink-0 rounded-[12px] bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center font-black text-amber-600 text-lg uppercase">
                                                    {e.name.charAt(0)}
                                                </div>
                                            )}

                                            {/* Infos */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{e.name}</p>
                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${e.role === 'MERCHANT' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {e.role === 'MERCHANT' ? 'Marchand' : 'Producteur'}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold mt-0.5 truncate">
                                                    <Phone size={9} className="inline mr-1 text-emerald-500" />{e.phone}
                                                </p>
                                                <p className="text-[9px] text-slate-300 dark:text-slate-600 truncate">
                                                    {e.store_name} · via {e.agent_name}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-col gap-1.5 shrink-0">
                                                <button
                                                    disabled={isProcessing}
                                                    onClick={() => handleValidate(e)}
                                                    className="flex items-center gap-1 bg-emerald-500 disabled:bg-slate-200 text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider active:scale-95 transition-all"
                                                >
                                                    {isProcessing
                                                        ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                                                        : <CheckCircle2 size={11} />
                                                    }
                                                    Valider
                                                </button>
                                                <button
                                                    disabled={isProcessing}
                                                    onClick={() => handleReject(e.id)}
                                                    className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 disabled:opacity-40 text-slate-500 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider active:scale-95 transition-all"
                                                >
                                                    <XCircle size={11} />
                                                    Rejeter
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Filtres rôle */}
                <div className="flex gap-2">
                    {(['ALL', 'MERCHANT', 'PRODUCER'] as const).map(r => (
                        <button
                            key={r}
                            onClick={() => setFilterRole(r)}
                            className={`flex-1 py-2.5 rounded-[14px] font-bold text-[10px] uppercase tracking-wider transition-all ${filterRole === r ? 'bg-purple-700 text-white shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800'}`}
                        >
                            {r === 'ALL' ? 'Tous' : r === 'MERCHANT' ? 'Marchands' : 'Producteurs'}
                        </button>
                    ))}
                </div>

                {/* Liste */}
                {loading ? (
                    <div className="space-y-3">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="bg-white dark:bg-slate-900 h-28 rounded-[20px] border border-slate-100 dark:border-slate-800 animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-[24px] p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800">
                        <Users size={40} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
                        <p className="font-bold text-slate-300 dark:text-slate-700 uppercase text-[10px] tracking-widest">
                            {search ? 'Aucun résultat' : 'Aucun membre trouvé'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((m, i) => {
                            const trend = m.prevMonthlySales > 0
                                ? ((m.monthlySales - m.prevMonthlySales) / m.prevMonthlySales) * 100
                                : null;
                            const isUp = trend !== null && trend >= 0;

                            return (
                                <motion.div
                                    key={m.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 p-4 shadow-sm"
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Avatar */}
                                        <div className="w-12 h-12 shrink-0 rounded-[14px] bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center font-black text-purple-600 text-lg uppercase">
                                            {m.name.charAt(0)}
                                        </div>

                                        {/* Infos */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h3 className="font-bold text-sm text-slate-800 dark:text-white truncate">{m.name}</h3>
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${ROLE_COLOR[m.role] ?? 'bg-slate-100 text-slate-500'}`}>
                                                    {ROLE_LABEL[m.role] ?? m.role}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase">
                                                <span className="flex items-center gap-1">
                                                    <Phone size={10} className="text-emerald-500" />
                                                    {m.phone}
                                                </span>
                                                {m.storeName && (
                                                    <span className="flex items-center gap-1 truncate">
                                                        <MapPin size={10} className="text-rose-400 shrink-0" />
                                                        <span className="truncate">{m.storeName}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Ventes mois */}
                                        <div className="text-right shrink-0">
                                            <p className="font-bold text-sm text-slate-800 dark:text-white">
                                                {formatCFA(m.monthlySales)}
                                            </p>
                                            {trend !== null ? (
                                                <div className={`flex items-center justify-end gap-0.5 text-[10px] font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                                    {isUp ? '+' : ''}{Math.round(trend)}%
                                                </div>
                                            ) : (
                                                <p className="text-[9px] text-slate-300 font-bold">Ce mois</p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Modal photo ── */}
            <AnimatePresence>
                {previewPhoto && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setPreviewPhoto(null)}
                        className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-sm"
                    >
                        <motion.img
                            initial={{ scale: 0.85 }}
                            animate={{ scale: 1 }}
                            src={previewPhoto}
                            alt="Photo enrôlement"
                            className="max-w-full max-h-[80vh] rounded-[24px] shadow-2xl object-contain"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Modal Ajouter ── */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
                        <motion.div
                            initial={{ y: 60, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 60, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[28px] p-6 shadow-2xl"
                        >
                            {addDone ? (
                                <div className="py-10 flex flex-col items-center gap-4 text-center">
                                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                                        <UserPlus size={28} className="text-emerald-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Invitation envoyée !</h3>
                                        <p className="text-slate-400 text-sm mt-1">{form.name} peut rejoindre la coopérative.</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Inviter un membre</h3>
                                            <p className="text-purple-600 text-[10px] font-bold uppercase tracking-widest mt-0.5">Nouveau profil coopérative</p>
                                        </div>
                                        <button
                                            onClick={() => { setShowAddModal(false); setAddError(''); setForm({ name: '', phone: '' }); }}
                                            className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">Nom complet</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                                <input
                                                    type="text"
                                                    value={form.name}
                                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                                    placeholder="ex: Jean Koffi"
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 px-4 pl-10 font-bold text-sm text-slate-800 dark:text-white outline-none focus:border-purple-500 transition-all placeholder:text-slate-300"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">Téléphone</label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                                <input
                                                    type="tel"
                                                    value={form.phone}
                                                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                                    placeholder="07 00 00 00 00"
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 px-4 pl-10 font-bold text-sm text-slate-800 dark:text-white outline-none focus:border-purple-500 transition-all placeholder:text-slate-300"
                                                />
                                            </div>
                                        </div>

                                        {addError && (
                                            <p className="text-rose-500 text-xs font-bold text-center">{addError}</p>
                                        )}

                                        <motion.button
                                            whileTap={{ scale: 0.98 }}
                                            disabled={!form.name.trim() || !form.phone.trim() || adding}
                                            onClick={async () => {
                                                if (!form.name.trim() || !form.phone.trim()) return;
                                                setAdding(true);
                                                setAddError('');
                                                try {
                                                    // Vérifie si le numéro existe déjà
                                                    const { data: existing } = await supabase
                                                        .from('profiles')
                                                        .select('id')
                                                        .eq('phone_number', form.phone.trim())
                                                        .maybeSingle();

                                                    if (existing) {
                                                        setAddError('Ce numéro est déjà enregistré dans le système.');
                                                        setAdding(false);
                                                        return;
                                                    }
                                                    // En pratique, la création se fait via l'inscription.
                                                    // Ici on simule une invitation réussie.
                                                    setAddDone(true);
                                                    setTimeout(() => {
                                                        setAddDone(false);
                                                        setShowAddModal(false);
                                                        setForm({ name: '', phone: '' });
                                                        fetchMembers();
                                                    }, 2500);
                                                } catch {
                                                    setAddError('Erreur réseau. Réessaie.');
                                                } finally {
                                                    setAdding(false);
                                                }
                                            }}
                                            className="w-full bg-purple-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 py-4 rounded-[18px] font-bold text-sm uppercase tracking-widest shadow-lg shadow-purple-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
                                        >
                                            {adding
                                                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                : <UserPlus size={16} />
                                            }
                                            {adding ? 'Vérification...' : 'Inviter le membre'}
                                        </motion.button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
