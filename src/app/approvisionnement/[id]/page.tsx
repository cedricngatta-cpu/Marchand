'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronLeft, Minus, Package, Plus, ShoppingCart, Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db';
import { useProfileContext } from '@/context/ProfileContext';
import { useSync } from '@/context/SyncContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductDetail {
    id: string;
    name: string;
    price: number;
    delivery_price?: number;
    category: string;
    store_id: string;
    storeName: string;
    stockQty: number;
    image_url?: string;
}

const formatCFA = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + '\u00A0F';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CommanderProduitPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const router = useRouter();
    const { activeProfile } = useProfileContext();
    const { triggerSync } = useSync();

    const [product, setProduct]   = useState<ProductDetail | null>(null);
    const [loading, setLoading]   = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes]       = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone]         = useState(false);

    // ── Fetch produit depuis Supabase ─────────────────────────────────────────

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            try {
                const { data: prod, error } = await supabase
                    .from('products')
                    .select('id, name, price, delivery_price, category, store_id, image_url')
                    .eq('id', id)
                    .single();

                if (error || !prod) { setLoading(false); return; }

                const { data: storeData } = await supabase
                    .from('stores')
                    .select('id, name')
                    .eq('id', prod.store_id)
                    .single();

                const { data: stockData } = await supabase
                    .from('stock')
                    .select('quantity')
                    .eq('product_id', id)
                    .maybeSingle();

                setProduct({
                    id:             prod.id,
                    name:           prod.name,
                    price:          prod.price,
                    delivery_price: prod.delivery_price ?? undefined,
                    category:       prod.category,
                    store_id:       prod.store_id,
                    storeName:      storeData?.name ?? 'Producteur',
                    stockQty:       stockData?.quantity ?? 0,
                    image_url:      prod.image_url ?? undefined,
                });
            } catch (err) {
                console.error('[Commander] fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    // ── CREATE_ORDER offline-first ────────────────────────────────────────────

    const handleOrder = async () => {
        if (!product || !activeProfile || submitting) return;
        setSubmitting(true);
        try {
            const orderId     = crypto.randomUUID();
            const now         = new Date().toISOString();
            const unitTotal   = product.price + (product.delivery_price ?? 0);
            const total       = unitTotal * quantity;

            // 1. Écriture locale Dexie
            await db.orders.add({
                id:               orderId,
                buyer_store_id:   activeProfile.id,
                seller_store_id:  product.store_id,
                product_id:       product.id,
                product_name:     product.name,
                quantity,
                unit_price:       product.price,
                total_amount:     total,
                status:           'PENDING',
                buyer_name:       activeProfile.name,
                seller_name:      product.storeName,
                notes:            notes.trim() || undefined,
                created_at:       now,
                updated_at:       now,
                synced:           0,
            });

            // 2. SyncQueue → Supabase
            await db.syncQueue.add({
                action: 'CREATE_ORDER',
                payload: {
                    id:              orderId,
                    buyer_store_id:  activeProfile.id,
                    seller_store_id: product.store_id,
                    product_id:      product.id,
                    product_name:    product.name,
                    quantity,
                    unit_price:      product.price,
                    total_amount:    total,
                    buyer_name:      activeProfile.name,
                    seller_name:     product.storeName,
                    notes:           notes.trim() || null,
                    created_at:      now,
                    updated_at:      now,
                },
                status:      'PENDING',
                retry_count: 0,
                created_at:  Date.now(),
            });

            triggerSync();
            setDone(true);
        } catch (err) {
            console.error('[Commander] order error:', err);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Success screen ────────────────────────────────────────────────────────

    if (done && product) {
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
                            Commande Envoyée !
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">
                            {product.storeName} recevra votre demande et la validera.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-[20px] p-4 border border-slate-100 dark:border-slate-800 w-full text-left">
                        <p className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-1">Récapitulatif</p>
                        <p className="font-bold text-sm text-slate-800 dark:text-white">{product.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                            {quantity} u · {formatCFA(product.price)} / u
                            {(product.delivery_price ?? 0) > 0 && ` + ${formatCFA(product.delivery_price!)} livr.`}
                            {' '}= {formatCFA((product.price + (product.delivery_price ?? 0)) * quantity)}
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/commercant/livraisons')}
                        className="w-full bg-primary text-white py-4 rounded-[20px] font-bold text-sm uppercase tracking-widest shadow-lg shadow-emerald-200 dark:shadow-none active:scale-95 transition-all"
                    >
                        Voir mes commandes
                    </button>
                    <button
                        onClick={() => router.push('/approvisionnement')}
                        className="text-slate-400 text-xs font-bold uppercase tracking-wider"
                    >
                        Retour au catalogue
                    </button>
                </motion.div>
            </div>
        );
    }

    // ── Loading ───────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 overflow-x-hidden">
                <div className="bg-primary pt-8 pb-28 px-4 rounded-b-[2.5rem] shadow-lg">
                    <div className="flex items-center gap-4 max-w-lg mx-auto">
                        <button onClick={() => router.back()} className="w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm shrink-0">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="h-5 w-40 bg-white/20 rounded-lg animate-pulse" />
                    </div>
                </div>
                <div className="px-4 max-w-lg mx-auto mt-[-40px] z-10 relative space-y-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[24px] h-64 border border-slate-100 dark:border-slate-800 animate-pulse" />
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
                <Package size={40} className="text-slate-200 mb-4" />
                <p className="font-bold text-slate-400 uppercase text-xs tracking-widest mb-4">Produit introuvable</p>
                <button onClick={() => router.back()} className="bg-primary text-white px-6 py-3 rounded-[16px] font-bold text-sm">
                    Retour
                </button>
            </div>
        );
    }

    const maxQty = product.stockQty > 0 ? product.stockQty : 999;

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
                    <div className="min-w-0">
                        <h1 className="text-white font-bold text-lg tracking-wide uppercase leading-none truncate">
                            {product.name}
                        </h1>
                        <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                            {product.storeName}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Form overlap ── */}
            <div className="px-4 max-w-lg mx-auto relative mt-[-40px] z-10 space-y-4">

                {/* Infos produit */}
                <div className="bg-white dark:bg-slate-900 rounded-[24px] p-5 shadow-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4 mb-4">
                        {/* Photo ou icône */}
                        <div className="w-14 h-14 rounded-[14px] bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 overflow-hidden">
                            {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <Package size={24} className="text-indigo-600" />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="font-bold text-base text-slate-800 dark:text-white leading-tight truncate">
                                {product.name}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                                {product.storeName}
                            </p>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="font-bold text-lg text-slate-800 dark:text-white">
                                {formatCFA(product.price)}
                            </p>
                            {(product.delivery_price ?? 0) > 0 ? (
                                <p className="text-[10px] text-blue-500 font-bold flex items-center justify-end gap-0.5">
                                    <Truck size={9} />
                                    +{formatCFA(product.delivery_price!)} livr.
                                </p>
                            ) : (
                                <p className="text-[10px] text-slate-400 font-bold">/ unité</p>
                            )}
                        </div>
                    </div>

                    {/* Stock disponible */}
                    <div className={`inline-block text-[10px] font-bold px-3 py-1 rounded-full ${
                        product.stockQty > 0
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                    }`}>
                        {product.stockQty > 0 ? `${product.stockQty} unités disponibles` : 'Stock non renseigné'}
                    </div>
                </div>

                {/* Quantité */}
                <div className="bg-white dark:bg-slate-900 rounded-[24px] p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Quantité</p>
                    <div className="flex items-center justify-between gap-4">
                        <button
                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                            className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                        >
                            <Minus size={18} className="text-slate-600 dark:text-slate-300" />
                        </button>
                        <span className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">
                            {quantity}
                        </span>
                        <button
                            onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                            className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                        >
                            <Plus size={18} className="text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 space-y-1.5">
                        {(product.delivery_price ?? 0) > 0 && (
                            <div className="flex justify-between items-baseline">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Produit ({quantity} × {formatCFA(product.price)})
                                </span>
                                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                                    {formatCFA(product.price * quantity)}
                                </span>
                            </div>
                        )}
                        {(product.delivery_price ?? 0) > 0 && (
                            <div className="flex justify-between items-baseline">
                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                                    <Truck size={9} />
                                    Livraison ({quantity} × {formatCFA(product.delivery_price!)})
                                </span>
                                <span className="text-sm font-bold text-blue-500">
                                    {formatCFA(product.delivery_price! * quantity)}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between items-baseline">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total estimé</span>
                            <span className="text-2xl font-black text-slate-800 dark:text-white">
                                {formatCFA((product.price + (product.delivery_price ?? 0)) * quantity)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div className="bg-white dark:bg-slate-900 rounded-[24px] p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                        Note pour le producteur (optionnel)
                    </p>
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Livraison avant jeudi, conditionnement spécifique..."
                        rows={2}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-700 dark:text-slate-200 font-medium outline-none focus:border-primary transition-all placeholder:text-slate-300 resize-none"
                    />
                </div>

                {/* CTA */}
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleOrder}
                    disabled={submitting || !activeProfile}
                    className="w-full bg-primary disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 py-5 rounded-[20px] font-bold text-sm uppercase tracking-widest shadow-lg shadow-emerald-200 dark:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                    {submitting ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <ShoppingCart size={18} />
                    )}
                    {submitting ? 'Envoi en cours...' : `Commander · ${formatCFA((product.price + (product.delivery_price ?? 0)) * quantity)}`}
                </motion.button>

            </div>
        </div>
    );
}
