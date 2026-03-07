'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, UserPlus, RefreshCcw, Clock, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface Enrollment {
    id: string;
    name: string;
    phone: string;
    role: string;
    store_name: string;
    status: string;
    created_at: string;
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const min = Math.floor(diff / 60000);
    if (min < 60) return `Il y a ${min}min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `Il y a ${h}h`;
    const day = Math.floor(h / 24);
    if (day === 1) return 'Hier';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function AgentActivities() {
    const router = useRouter();
    const { user } = useAuth();
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('agent_enrollments')
                .select('id, name, phone, role, store_name, status, created_at')
                .eq('agent_id', user?.id)
                .order('created_at', { ascending: false })
                .limit(50);
            setEnrollments(data ?? []);
        } catch (err) {
            console.error('[Activites] fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (user?.id) load(); }, [user?.id]);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthCount = enrollments.filter(e => new Date(e.created_at) >= monthStart).length;
    const validatedCount = enrollments.filter(e => e.status === 'VALIDATED').length;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 overflow-x-hidden">

            {/* ── Header ── */}
            <div className="bg-rose-500 pt-8 pb-32 px-4 rounded-b-[2.5rem] shadow-lg">
                <div className="flex items-center justify-between mb-6 max-w-lg mx-auto">
                    <button onClick={() => router.back()} className="w-10 h-10 bg-white text-rose-500 rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm shrink-0">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-center">
                        <h1 className="text-white font-bold text-lg tracking-wide uppercase leading-none">Mes Activités</h1>
                        <p className="text-rose-200 text-[10px] font-bold uppercase tracking-widest mt-0.5">Historique des enrôlements</p>
                    </div>
                    <button onClick={load} className="w-10 h-10 bg-white text-rose-500 rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm shrink-0">
                        <RefreshCcw size={16} />
                    </button>
                </div>

                <div className="max-w-lg mx-auto flex items-center justify-center gap-8 mt-2">
                    {[
                        { value: thisMonthCount, label: 'Ce mois' },
                        { value: enrollments.length, label: 'Total' },
                        { value: validatedCount, label: 'Validés' },
                    ].map((item, i) => (
                        <React.Fragment key={item.label}>
                            {i > 0 && <div className="w-px h-10 bg-white/20" />}
                            <div className="text-center">
                                {loading
                                    ? <div className="h-10 w-12 bg-white/10 rounded-xl animate-pulse mx-auto" />
                                    : <span className="text-4xl font-black text-white tracking-tighter">{item.value}</span>
                                }
                                <p className="text-rose-200/70 text-[10px] font-bold uppercase tracking-wider mt-0.5">{item.label}</p>
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* ── Liste ── */}
            <div className="px-4 max-w-lg mx-auto relative mt-[-40px] z-10 space-y-3">
                {loading ? (
                    <div className="space-y-3">
                        {[0, 1, 2, 3].map(i => <div key={i} className="bg-white dark:bg-slate-900 h-20 rounded-[20px] border border-slate-100 dark:border-slate-800 animate-pulse" />)}
                    </div>
                ) : enrollments.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-[24px] p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800">
                        <UserPlus size={40} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
                        <p className="font-bold text-slate-300 dark:text-slate-700 uppercase text-[10px] tracking-widest">Aucun enrôlement</p>
                        <p className="text-slate-300 dark:text-slate-600 text-[10px] mt-1">Commence par enrôler un nouveau membre</p>
                    </div>
                ) : (
                    enrollments.map((e, i) => (
                        <motion.div
                            key={e.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.025 }}
                            className="bg-white dark:bg-slate-900 rounded-[18px] border border-slate-100 dark:border-slate-800 p-3.5 shadow-sm flex items-center gap-3"
                        >
                            <div className={`w-10 h-10 shrink-0 rounded-[12px] flex items-center justify-center ${e.status === 'VALIDATED' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                                {e.status === 'VALIDATED'
                                    ? <CheckCircle2 size={18} className="text-emerald-600" />
                                    : <Clock size={18} className="text-amber-500" />
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-xs text-slate-800 dark:text-white truncate">{e.name}</p>
                                <p className="text-[10px] text-slate-400 truncate">
                                    {e.store_name} · {e.role === 'MERCHANT' ? 'Marchand' : 'Producteur'} · {formatDate(e.created_at)}
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${e.status === 'VALIDATED' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'}`}>
                                    {e.status === 'VALIDATED' ? 'Validé' : 'En attente'}
                                </span>
                            </div>
                        </motion.div>
                    ))
                )}

                {!loading && enrollments.length > 0 && (
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/agent/enrolement')}
                        className="w-full bg-rose-500 text-white py-5 rounded-[20px] font-black text-sm uppercase tracking-widest shadow-lg shadow-rose-200 dark:shadow-none flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                        <UserPlus size={18} />
                        Nouvel enrôlement
                    </motion.button>
                )}
            </div>
        </div>
    );
}
