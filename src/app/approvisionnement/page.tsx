'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Package, Search, ShoppingCart, Store, Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useProfileContext } from '@/context/ProfileContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CatalogueItem {
    id: string;
    name: string;
    price: number;
    category: string;
    store_id: string;
    storeName: string;
    stockQty: number;
}

const formatCFA = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + '\u00A0F';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApprovisionnementPage() {
    const router = useRouter();
    const { activeProfile } = useProfileContext();

    const [items, setItems]       = useState<CatalogueItem[]>([]);
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]     = useState('');

    // Commandes actives du marchand (badge)
    const activeOrderCount = useLiveQuery(
        async () => {
            if (!activeProfile) return 0;
            const rows = await db.orders.where('buyer_store_id').equals(activeProfile.id).toArray();
            return rows.filter(o => o.status === 'PENDING' || o.status === 'ACCEPTED' || o.status === 'SHIPPED').length;
        },
        [activeProfile?.id]
    ) ?? 0;

    // ── Fetch catalogue depuis Supabase ───────────────────────────────────────

    useEffect(() => {
        const fetchCatalogue = async () => {
            setLoading(true);
            try {
                // 1. Récupérer les magasins producteurs
                const { data: storeData, error: storeErr } = await supabase
                    .from('stores')
                    .select('id, name')
                    .eq('store_type', 'PRODUCER');

                if (storeErr || !storeData?.length) { setItems([]); return; }

                const storeMap: Record<string, string> = {};
                storeData.forEach(s => { storeMap[s.id] = s.name; });
                const storeIds = storeData.map(s => s.id);

                // 2. Produits de ces magasins
                const { data: prodData, error: prodErr } = await supabase
                    .from('products')
                    .select('id, name, price, category, store_id')
                    .in('store_id', storeIds);

                if (prodErr || !prodData?.length) { setItems([]); return; }

                // 3. Stocks
                const productIds = prodData.map(p => p.id);
                const { data: stockData } = await supabase
                    .from('stock')
                    .select('product_id, quantity')
                    .in('product_id', productIds);

                const stockMap: Record<string, number> = {};
                stockData?.forEach(s => { stockMap[s.product_id] = s.quantity; });

                const catalogue: CatalogueItem[] = prodData.map(p => ({
                    id:        p.id,
                    name:      p.name,
                    price:     p.price,
                    category:  p.category,
                    store_id:  p.store_id,
                    storeName: storeMap[p.store_id] ?? 'Producteur',
                    stockQty:  stockMap[p.id] ?? 0,
                }));

                setItems(catalogue);
            } catch (err) {
                console.error('[Approvisionnement] fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCatalogue();
    }, []);

    const filtered = items.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.storeName.toLowerCase().includes(search.toLowerCase())
    );

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32 overflow-x-hidden">

            {/* ── Header wave ── */}
            <div className="bg-primary pt-8 pb-32 px-4 rounded-b-[2.5rem] shadow-lg">
                <div className="flex items-center justify-between mb-6 max-w-lg mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm shrink-0"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-center">
                        <h1 className="text-white font-bold text-lg tracking-wide uppercase leading-none">
                            Marché Virtuel
                        </h1>
                        <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                            Produits des producteurs
                        </p>
                    </div>
                    {/* Bouton Mes Commandes */}
                    <button
                        onClick={() => router.push('/commercant/livraisons')}
                        className="w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm shrink-0 relative"
                    >
                        <ShoppingCart size={18} />
                        {activeOrderCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white leading-none">
                                {activeOrderCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Search */}
                <div className="max-w-lg mx-auto relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Maïs, Tomate, Riz..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full h-12 bg-white dark:bg-slate-900 rounded-[18px] pl-11 pr-4 font-bold text-sm text-slate-800 dark:text-white shadow-md outline-none focus:ring-2 focus:ring-emerald-400 transition-all placeholder:text-slate-400 uppercase"
                    />
                </div>
            </div>

            {/* ── Content overlap ── */}
            <div className="px-4 max-w-lg mx-auto relative mt-[-40px] z-10 space-y-3">

                {loading ? (
                    [0, 1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-slate-900 h-24 rounded-[20px] border border-slate-100 dark:border-slate-800 animate-pulse" />
                    ))
                ) : filtered.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-[24px] p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800">
                        <Store size={40} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
                        <p className="font-bold text-slate-300 dark:text-slate-700 uppercase text-[10px] tracking-widest">
                            {search ? 'Aucun résultat' : 'Aucun producteur disponible'}
                        </p>
                    </div>
                ) : (
                    filtered.map((item, i) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => router.push(`/approvisionnement/${item.id}`)}
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm cursor-pointer flex items-center justify-between gap-3"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-12 h-12 rounded-[14px] bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                                    <Package size={20} className="text-indigo-600" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-sm text-slate-800 dark:text-white truncate leading-tight">
                                        {item.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase truncate">
                                            {item.storeName}
                                        </p>
                                        {item.stockQty > 0 ? (
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                                                {item.stockQty} dispo
                                            </span>
                                        ) : (
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400 shrink-0">
                                                Rupture
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="font-bold text-sm text-slate-800 dark:text-white">
                                    {formatCFA(item.price)}
                                </p>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">/ unité</p>
                            </div>
                        </motion.div>
                    ))
                )}

            </div>
        </div>
    );
}
