'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, PieChart, ArrowUpRight, Package, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const formatCFA = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + '\u00A0F';

interface ProductStat {
    name: string;
    volume: number;
    count: number;
}

interface AnalyticsData {
    currentVolume: number;
    prevVolume: number;
    growthPct: number | null;
    topProducts: ProductStat[];
    totalTx: number;
    loading: boolean;
}

const COLORS = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500'];

export default function CooperativeAnalyses() {
    const router = useRouter();
    const [data, setData] = useState<AnalyticsData>({
        currentVolume: 0, prevVolume: 0, growthPct: null,
        topProducts: [], totalTx: 0, loading: true,
    });

    const load = async () => {
        setData(d => ({ ...d, loading: true }));
        try {
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

            const [{ data: currentTx }, { data: prevTx }] = await Promise.all([
                supabase.from('transactions').select('product_name, price').gte('created_at', monthStart),
                supabase.from('transactions').select('price').gte('created_at', prevMonthStart).lt('created_at', monthStart),
            ]);

            const currentVolume = (currentTx ?? []).reduce((s, t) => s + (t.price ?? 0), 0);
            const prevVolume = (prevTx ?? []).reduce((s, t) => s + (t.price ?? 0), 0);
            const growthPct = prevVolume > 0 ? ((currentVolume - prevVolume) / prevVolume * 100) : null;

            const productMap: Record<string, { volume: number; count: number }> = {};
            for (const tx of currentTx ?? []) {
                const k = tx.product_name ?? 'Inconnu';
                if (!productMap[k]) productMap[k] = { volume: 0, count: 0 };
                productMap[k].volume += tx.price ?? 0;
                productMap[k].count += 1;
            }
            const topProducts = Object.entries(productMap)
                .sort((a, b) => b[1].volume - a[1].volume)
                .slice(0, 5)
                .map(([name, stats]) => ({ name, ...stats }));

            setData({
                currentVolume, prevVolume, growthPct,
                topProducts, totalTx: (currentTx ?? []).length, loading: false,
            });
        } catch (err) {
            console.error('[Analyses] fetch error:', err);
            setData(d => ({ ...d, loading: false }));
        }
    };

    useEffect(() => { load(); }, []);

    const growthPositive = data.growthPct === null || data.growthPct >= 0;
    const growthLabel = data.growthPct !== null
        ? `${data.growthPct >= 0 ? '+' : ''}${data.growthPct.toFixed(1)}% vs mois précédent`
        : 'Premier mois de données';

    const topProduct = data.topProducts[0];

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 max-w-4xl mx-auto pb-24 md:pb-32">
            <header className="flex items-center justify-between gap-4 mb-8 md:mb-10 pt-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm text-slate-600 dark:text-slate-300 active:scale-90 transition-all border border-slate-100 dark:border-slate-800 shrink-0"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Analyses Sectorielles</h1>
                        <p className="text-blue-600 font-bold text-[10px] uppercase tracking-widest mt-1">Intelligence de Marché</p>
                    </div>
                </div>
                <button
                    onClick={load}
                    className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm text-slate-400 border border-slate-100 dark:border-slate-700 active:scale-90 transition-all shrink-0"
                >
                    <RefreshCcw size={16} />
                </button>
            </header>

            <div className="space-y-6 md:space-y-8">

                {/* Main Insight Card */}
                <div className={`p-6 md:p-10 rounded-[32px] md:rounded-[45px] text-white shadow-2xl relative overflow-hidden dark:shadow-none ${growthPositive ? 'bg-blue-600 shadow-blue-200' : 'bg-rose-600 shadow-rose-200'}`}>
                    <div className="relative z-10">
                        <span className="text-blue-100 font-black uppercase text-[10px] md:text-xs tracking-widest">
                            Tendance Globale — Ce mois
                        </span>
                        {data.loading ? (
                            <div className="h-10 w-56 bg-white/10 rounded-xl animate-pulse mt-3 mb-4" />
                        ) : (
                            <div className="mt-2 mb-4 md:mb-6">
                                <h2 className="text-2xl md:text-4xl font-black leading-tight">
                                    {formatCFA(data.currentVolume)}
                                </h2>
                                <p className="text-white/70 font-bold text-sm mt-1">{growthLabel}</p>
                            </div>
                        )}
                        <div className="flex items-center gap-2 bg-white/20 w-fit px-3 py-1.5 md:px-4 md:py-2 rounded-full backdrop-blur-md">
                            {growthPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            <span className="font-black uppercase text-[9px] md:text-[10px] tracking-widest">
                                {data.loading ? '...' : `${data.totalTx} transaction${data.totalTx > 1 ? 's' : ''} ce mois`}
                            </span>
                        </div>
                    </div>
                    <PieChart size={160} className="absolute -right-12 -bottom-12 md:-right-16 md:-bottom-16 text-white/10 rotate-12 md:w-[200px] md:h-[200px]" />
                </div>

                {/* Top Products */}
                <section>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4 mb-4 text-center md:text-left">
                        Top Produits ce mois
                    </h3>
                    {data.loading ? (
                        <div className="space-y-3">
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} className="bg-white dark:bg-slate-900 h-20 rounded-[24px] animate-pulse border border-slate-100 dark:border-slate-800" />
                            ))}
                        </div>
                    ) : data.topProducts.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 p-12 rounded-[24px] text-center border-2 border-dashed border-slate-100 dark:border-slate-800">
                            <Package size={40} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
                            <p className="font-bold text-slate-300 dark:text-slate-700 uppercase text-[10px] tracking-widest">
                                Aucune vente ce mois
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {data.topProducts.map((p, i) => (
                                <motion.div
                                    key={p.name}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.07 }}
                                    className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border-2 border-slate-50 dark:border-slate-800 flex items-center justify-between gap-4 hover:border-blue-200 transition-colors"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className={`w-12 h-12 shrink-0 rounded-[18px] ${COLORS[i] ?? 'bg-slate-500'} flex items-center justify-center text-white shadow-lg`}>
                                            <Package size={22} />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-black text-slate-900 dark:text-white uppercase text-sm tracking-tight truncate">{p.name}</h4>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                {p.count} vente{p.count > 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-sm font-black text-slate-800 dark:text-white">{formatCFA(p.volume)}</div>
                                        <div className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Volume</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Market Advice */}
                <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[32px] md:rounded-[40px] border-2 border-slate-100 dark:border-slate-800 relative group overflow-hidden">
                    <div className="relative z-10 flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                        <div className="bg-slate-900 dark:bg-white p-3 md:p-4 rounded-xl md:rounded-2xl text-white dark:text-slate-900 shrink-0">
                            <BarChart3 size={20} className="md:w-6 md:h-6" />
                        </div>
                        <div>
                            <p className="text-slate-900 dark:text-white font-black uppercase tracking-widest text-[10px] md:text-xs mb-1 md:mb-2">
                                {topProduct ? 'Produit leader' : 'Opportunité'}
                            </p>
                            {data.loading ? (
                                <div className="h-12 w-full bg-slate-50 dark:bg-slate-800 rounded-xl animate-pulse" />
                            ) : topProduct ? (
                                <p className="text-slate-600 dark:text-slate-400 font-bold text-sm md:text-base leading-relaxed">
                                    <span className="text-slate-900 dark:text-white">{topProduct.name}</span> est le
                                    produit le plus vendu ce mois avec {formatCFA(topProduct.volume)} sur{' '}
                                    {topProduct.count} transaction{topProduct.count > 1 ? 's' : ''}.
                                    {data.topProducts.length > 1 && (
                                        <> Suivi par <span className="text-slate-900 dark:text-white">{data.topProducts[1].name}</span> ({formatCFA(data.topProducts[1].volume)}).</>
                                    )}
                                </p>
                            ) : (
                                <p className="text-slate-600 dark:text-slate-400 font-bold text-sm leading-relaxed">
                                    Aucune transaction enregistrée ce mois. Encouragez les marchands à saisir leurs ventes.
                                </p>
                            )}
                        </div>
                    </div>
                    <ArrowUpRight size={100} className="absolute -right-4 -bottom-4 text-slate-50 dark:text-slate-800 group-hover:scale-110 transition-transform" />
                </div>

            </div>
        </main>
    );
}
