'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronLeft, Package, Tag, Wheat } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db';
import { useProfileContext } from '@/context/ProfileContext';
import { useSync } from '@/context/SyncContext';

// ─── Config ───────────────────────────────────────────────────────────────────

const UNITS = ['sac', 'kg', 'tonne', 'botte', 'caisse', 'pièce'] as const;
type Unit = typeof UNITS[number];

interface CategoryConfig {
    id: string;
    label: string;
    color: string;
    iconColor: string;
    activeCls: string;
}

const CATEGORIES: CategoryConfig[] = [
    { id: 'CEREALE',   label: 'Céréale',   color: 'bg-amber-500',   iconColor: 'text-white', activeCls: 'bg-amber-500 text-white' },
    { id: 'LEGUME',    label: 'Légume',    color: 'bg-emerald-500', iconColor: 'text-white', activeCls: 'bg-emerald-500 text-white' },
    { id: 'FRUIT',     label: 'Fruit',     color: 'bg-orange-500',  iconColor: 'text-white', activeCls: 'bg-orange-500 text-white' },
    { id: 'TUBERCULE', label: 'Tubercule', color: 'bg-stone-500',   iconColor: 'text-white', activeCls: 'bg-stone-500 text-white' },
    { id: 'RECOLTE',   label: 'Récolte',   color: 'bg-lime-600',    iconColor: 'text-white', activeCls: 'bg-lime-600 text-white' },
    { id: 'OTHER',     label: 'Autre',     color: 'bg-slate-500',   iconColor: 'text-white', activeCls: 'bg-slate-500 text-white' },
];

const formatCFA = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + '\u00A0F';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PublierProduit() {
    const router = useRouter();
    const { activeProfile } = useProfileContext();
    const { triggerSync } = useSync();

    const [name, setName]         = useState('');
    const [price, setPrice]       = useState('');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit]         = useState<Unit>('sac');
    const [category, setCategory] = useState('CEREALE');
    const [isPublishing, setIsPublishing] = useState(false);
    const [done, setDone]         = useState(false);

    const canSubmit = !!name.trim() && !!price && Number(price) > 0 && !isPublishing && !!activeProfile;

    const handlePublish = async () => {
        if (!canSubmit || !activeProfile) return;
        setIsPublishing(true);
        try {
            const productId  = crypto.randomUUID();
            const now        = Date.now();
            const parsedQty  = quantity ? Math.max(0, parseInt(quantity, 10)) : 0;
            const cat        = CATEGORIES.find(c => c.id === category)!;
            const productName = `${name.trim()} (${unit})`;

            // 1. Écriture locale Dexie — source de vérité
            await db.products.add({
                id:         productId,
                name:       productName,
                price:      Number(price),
                audio_name: productName,
                category,
                color:      cat.color,
                icon_color: cat.iconColor,
                store_id:   activeProfile.id,
                synced:     0,
            });

            if (parsedQty > 0) {
                await db.stocks.add({
                    id:         crypto.randomUUID(),
                    product_id: productId,
                    quantity:   parsedQty,
                    store_id:   activeProfile.id,
                    synced:     0,
                });
            }

            // 2. SyncQueue — ADD_PRODUCT trié en premier par processQueue (priorité absolue)
            await db.syncQueue.add({
                action: 'ADD_PRODUCT',
                payload: {
                    id:         productId,
                    store_id:   activeProfile.id,
                    name:       productName,
                    price:      Number(price),
                    audio_name: productName,
                    category,
                    color:      cat.color,
                    icon_color: cat.iconColor,
                },
                status:      'PENDING',
                retry_count: 0,
                created_at:  now,
            });

            if (parsedQty > 0) {
                await db.syncQueue.add({
                    action:  'UPDATE_STOCK',
                    payload: { product_id: productId, quantity: parsedQty },
                    status:      'PENDING',
                    retry_count: 0,
                    created_at:  now + 1, // +1 ms : UPDATE_STOCK passe après ADD_PRODUCT
                });
            }

            triggerSync();
            setDone(true);
        } catch (err) {
            console.error('[Publier] Error:', err);
        } finally {
            setIsPublishing(false);
        }
    };

    // ── Success screen ────────────────────────────────────────────────────────

    if (done) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-6 pb-24">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    className="flex flex-col items-center text-center gap-5"
                >
                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 size={52} className="text-emerald-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            Récolte Publiée !
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">
                            Votre produit est maintenant visible par les marchands.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/producteur')}
                        className="mt-4 bg-primary text-white py-4 px-10 rounded-[20px] font-bold text-sm uppercase tracking-widest shadow-lg shadow-emerald-200 dark:shadow-none active:scale-95 transition-all"
                    >
                        Retour au tableau de bord
                    </button>
                    <button
                        onClick={() => {
                            setName(''); setPrice(''); setQuantity('');
                            setUnit('sac'); setCategory('CEREALE'); setDone(false);
                        }}
                        className="text-slate-400 text-xs font-bold uppercase tracking-wider"
                    >
                        Publier un autre produit
                    </button>
                </motion.div>
            </div>
        );
    }

    // ── Form ─────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 overflow-x-hidden">

            {/* ── Header wave ── */}
            <div className="bg-primary pt-8 pb-28 px-4 rounded-b-[2.5rem] shadow-lg">
                <div className="flex items-center gap-4 max-w-lg mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm shrink-0"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-white font-bold text-lg tracking-wide uppercase leading-none">
                            Déclarer une Récolte
                        </h1>
                        <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                            Nouveau produit
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Form overlap ── */}
            <div className="px-4 max-w-lg mx-auto relative mt-[-40px] z-10 space-y-4">

                <div className="bg-white dark:bg-slate-900 rounded-[24px] p-5 shadow-xl border border-slate-100 dark:border-slate-800 space-y-5">

                    {/* Nom */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                            Nom du produit
                        </label>
                        <div className="relative">
                            <Wheat className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Ex: Maïs blanc"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 px-4 pl-11 font-bold text-slate-800 dark:text-white text-sm outline-none focus:border-primary transition-all placeholder:text-slate-300"
                            />
                        </div>
                    </div>

                    {/* Prix + Quantité */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                                Prix (CFA)
                            </label>
                            <div className="relative">
                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 px-4 pl-10 font-bold text-slate-800 dark:text-white text-sm outline-none focus:border-primary transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                                Quantité
                            </label>
                            <div className="relative">
                                <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={quantity}
                                    onChange={e => setQuantity(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 px-4 pl-10 font-bold text-slate-800 dark:text-white text-sm outline-none focus:border-primary transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Unité */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                            Unité
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {UNITS.map(u => (
                                <button
                                    key={u}
                                    onClick={() => setUnit(u)}
                                    className={`px-3 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all active:scale-95 ${
                                        unit === u
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                    }`}
                                >
                                    {u}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Catégorie */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                            Catégorie
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setCategory(cat.id)}
                                    className={`px-3 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all active:scale-95 ${
                                        category === cat.id
                                            ? cat.activeCls
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Preview */}
                {name && price && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-900 rounded-[24px] px-5 py-4 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3"
                    >
                        <div className="min-w-0">
                            <p className="font-bold text-sm text-slate-800 dark:text-white truncate">
                                {name.trim()} ({unit})
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider truncate">
                                {CATEGORIES.find(c => c.id === category)?.label}
                                {quantity ? ` · ${quantity} ${unit}` : ''}
                            </p>
                        </div>
                        <p className="font-bold text-sm text-slate-800 dark:text-white shrink-0">
                            {formatCFA(Number(price))} / {unit}
                        </p>
                    </motion.div>
                )}

                {/* CTA */}
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePublish}
                    disabled={!canSubmit}
                    className="w-full bg-primary disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 py-5 rounded-[20px] font-bold text-sm uppercase tracking-widest shadow-lg shadow-emerald-200 dark:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                    {isPublishing ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <CheckCircle2 size={18} />
                    )}
                    {isPublishing ? 'Publication...' : 'Publier la récolte'}
                </motion.button>

            </div>
        </div>
    );
}
