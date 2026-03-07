'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Plus, Trash2, Truck, Wheat } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, LocalProduct, LocalStock } from '@/lib/db';
import { useProfileContext } from '@/context/ProfileContext';
import { useConfirm } from '@/context/ConfirmContext';
import { useSync } from '@/context/SyncContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCFA = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + '\u00A0F';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProducerStock() {
    const router = useRouter();
    const { activeProfile } = useProfileContext();
    const confirm = useConfirm();
    const { triggerSync } = useSync();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (p: LocalProduct) => {
        const ok = await confirm({
            title: 'Supprimer ce produit ?',
            message: `"${p.name}" sera retiré de ton catalogue et de ton stock. Cette action est irréversible.`,
            confirmLabel: 'Supprimer',
            dangerMode: true,
        });
        if (!ok) return;

        setDeletingId(p.id);
        try {
            // Suppression locale Dexie
            await db.products.delete(p.id);
            await db.stocks.where('product_id').equals(p.id).delete();

            // Enqueue pour Supabase
            await db.syncQueue.add({
                action:      'DELETE_PRODUCT',
                payload:     { id: p.id, store_id: activeProfile?.id },
                status:      'PENDING',
                retry_count: 0,
                created_at:  Date.now(),
            });
            triggerSync();
        } finally {
            setDeletingId(null);
        }
    };

    // Données réactives Dexie
    const products = useLiveQuery<LocalProduct[]>(
        () => activeProfile
            ? db.products.where('store_id').equals(activeProfile.id).toArray()
            : Promise.resolve([]),
        [activeProfile?.id]
    );

    const stocks = useLiveQuery<LocalStock[]>(
        () => activeProfile
            ? db.stocks.where('store_id').equals(activeProfile.id).toArray()
            : Promise.resolve([]),
        [activeProfile?.id]
    );

    const isLoading = products === undefined || stocks === undefined;

    // Map stock par product_id
    const stockMap = (stocks ?? []).reduce<Record<string, number>>((acc, s) => {
        acc[s.product_id] = (acc[s.product_id] ?? 0) + s.quantity;
        return acc;
    }, {});

    // Produits avec stock > 0
    const displayProducts = (products ?? []).filter(p => (stockMap[p.id] ?? 0) > 0);

    // Valeur totale (prix produit + livraison optionnelle) × quantité
    const totalValue = displayProducts.reduce((sum, p) => {
        const qty = stockMap[p.id] ?? 0;
        const pricePerUnit = p.price + (p.delivery_price ?? 0);
        return sum + qty * pricePerUnit;
    }, 0);

    const totalUnits = displayProducts.reduce((sum, p) => sum + (stockMap[p.id] ?? 0), 0);

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 max-w-4xl mx-auto pb-24 md:pb-32">
            <header className="flex items-center gap-4 mb-8 md:mb-10 pt-4">
                <button
                    onClick={() => router.back()}
                    className="w-12 h-12 shrink-0 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm text-slate-600 dark:text-slate-300 active:scale-90 transition-all border border-slate-100 dark:border-slate-800"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Mon Stock</h1>
                    <p className="text-amber-600 font-bold text-[10px] uppercase tracking-widest mt-1">
                        {isLoading ? '...' : `${totalUnits} unité${totalUnits > 1 ? 's' : ''} · ${displayProducts.length} produit${displayProducts.length > 1 ? 's' : ''}`}
                    </p>
                </div>
            </header>

            <div className="space-y-4">
                {isLoading ? (
                    <div className="space-y-4">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="bg-white dark:bg-slate-900 h-28 rounded-[28px] animate-pulse border border-slate-100 dark:border-slate-800" />
                        ))}
                    </div>
                ) : displayProducts.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 p-12 rounded-[40px] text-center border-4 border-dashed border-slate-100 dark:border-slate-800">
                        <Package size={64} className="mx-auto text-slate-200 mb-4" />
                        <p className="font-black text-slate-400 uppercase tracking-widest text-sm">Aucun produit en stock</p>
                    </div>
                ) : (
                    displayProducts.map(p => {
                        const qty = stockMap[p.id] ?? 0;
                        const hasDelivery = (p.delivery_price ?? 0) > 0;
                        return (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`bg-white dark:bg-slate-900 rounded-[28px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-opacity ${deletingId === p.id ? 'opacity-40 pointer-events-none' : ''}`}
                            >
                                <div className="p-5 flex items-center gap-4">
                                    {/* Photo ou couleur */}
                                    <div className={`w-16 h-16 shrink-0 rounded-[20px] overflow-hidden border-2 border-white dark:border-slate-700 ${p.image_url ? '' : (p.color || 'bg-slate-100')} flex items-center justify-center shadow-inner`}>
                                        {p.image_url ? (
                                            <img src={p.image_url} className="w-full h-full object-cover" alt={p.name} />
                                        ) : (
                                            <Wheat className="text-white opacity-80" size={28} />
                                        )}
                                    </div>

                                    {/* Infos */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-black uppercase tracking-tight text-slate-900 dark:text-white text-base leading-none mb-1.5 truncate">
                                            {p.name}
                                        </h3>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-2xl font-black text-emerald-600 leading-none">{qty}</span>
                                            <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest">Unités</span>
                                            <span className="h-3.5 w-[1.5px] bg-slate-100 dark:bg-slate-700 shrink-0" />
                                            <span className="text-emerald-500 font-black text-xs whitespace-nowrap">{formatCFA(p.price)} / u</span>
                                            {hasDelivery && (
                                                <>
                                                    <span className="h-3.5 w-[1.5px] bg-slate-100 dark:bg-slate-700 shrink-0" />
                                                    <span className="text-blue-500 font-bold text-[10px] flex items-center gap-0.5">
                                                        <Truck size={9} />
                                                        {formatCFA(p.delivery_price!)}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                                            Valeur : {formatCFA(qty * (p.price + (p.delivery_price ?? 0)))}
                                        </p>
                                    </div>

                                    {/* Bouton supprimer */}
                                    <button
                                        onClick={() => handleDelete(p)}
                                        className="w-10 h-10 shrink-0 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-100 active:scale-90 transition-all"
                                    >
                                        {deletingId === p.id
                                            ? <span className="w-4 h-4 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
                                            : <Trash2 size={16} />
                                        }
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })
                )}

                {/* Bouton ajouter */}
                <button
                    onClick={() => router.push('/producteur/publier')}
                    className="w-full h-32 bg-white dark:bg-slate-900 rounded-[35px] border-4 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 text-slate-300 hover:border-amber-400 hover:text-amber-400 transition-all group"
                >
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-full group-hover:scale-110 transition-transform">
                        <Plus size={32} />
                    </div>
                    <span className="font-black uppercase tracking-widest text-[10px]">Ajouter une récolte</span>
                </button>
            </div>

            {/* Total valeur stock */}
            {!isLoading && (
                <div className="mt-8 md:mt-10 bg-slate-900 dark:bg-emerald-900/40 p-6 md:p-10 rounded-[32px] md:rounded-[45px] text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                        <span className="text-white/60 font-black uppercase text-[10px] md:text-xs tracking-widest">Valeur Estimée du Stock</span>
                        <div className="text-3xl md:text-5xl font-black tracking-tighter mt-1">
                            {new Intl.NumberFormat('fr-FR').format(totalValue)}{' '}
                            <span className="text-xl md:text-2xl opacity-60">F</span>
                        </div>
                        {displayProducts.some(p => (p.delivery_price ?? 0) > 0) && (
                            <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                                <Truck size={9} />
                                Livraison incluse
                            </p>
                        )}
                    </div>
                    <Package size={100} className="md:w-[140px] md:h-[140px] absolute -right-6 -bottom-6 md:-right-8 md:-bottom-8 opacity-10 rotate-12" />
                </div>
            )}
        </main>
    );
}
