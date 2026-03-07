'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ChevronLeft,
    Clock,
    ShoppingBag,
    PlusCircle,
    MinusCircle,
    Volume2,
    TrendingUp,
    Package,
    ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useVoice } from '@/hooks/useVoice';
import { useHistory } from '@/hooks/useHistory';
import { useAuth } from '@/context/AuthContext';
import { useProductContext } from '@/context/ProductContext';
import { useStock } from '@/hooks/useStock';

export default function StockDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const router = useRouter();
    const { products } = useProductContext();
    const { stock } = useStock();
    const { speakIfNecessary } = useVoice();
    const { getProductHistory } = useHistory();
    const { user } = useAuth();

    const product = products.find(p => p.id.toString() === id);
    const currentStock = product ? (stock[product.id] || 0) : 0;

    const name = user?.name?.split(' ')[0] || 'Marchand';
    const capitalValue = product ? (currentStock * product.price) : 0;
    const productHistory = product ? getProductHistory(product.id).slice(0, 5) : [];

    useEffect(() => {
        if (product) {
            speakIfNecessary(`Détails de ${product.name}. Ton stock actuel est de ${currentStock}.`, 'NORMAL', true);
        }
    }, [product]);

    if (!product) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <Package size={64} className="text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-800 dark:text-white uppercase mb-4">Produit introuvable</h2>
                <button
                    onClick={() => router.push('/stock')}
                    className="px-8 py-3 bg-primary text-white rounded-2xl font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
                >
                    Retour au stock
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
            {/* Header Coloré (Card Overlap Style) */}
            <div className={`pt-8 pb-32 px-4 rounded-b-[2.5rem] relative shadow-lg ${product.color.split(' ')[0] === 'bg-white' ? 'bg-primary' : product.color.split(' ')[0]}`}>
                <div className="flex justify-between items-center max-w-lg mx-auto mb-6">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 bg-white text-slate-900 rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="text-center flex-1 pr-10">
                        <h1 className="text-slate-900 font-black text-lg tracking-wide uppercase truncate px-2">{product.name}</h1>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Détails du Stock</p>
                    </div>
                </div>
            </div>

            {/* Main Content Overlap */}
            <main className="mt-[-60px] relative z-10 px-4 max-w-lg mx-auto space-y-4">
                {/* Product Stats Card */}
                <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-5 mb-8">
                        <div className={`p-4 rounded-[24px] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 ${product.iconColor} shrink-0`}>
                            <product.icon size={40} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Stock Actuel</span>
                            <div className="flex items-end gap-2">
                                <span className="text-5xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">{currentStock}</span>
                                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest pb-1">Unités</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-700/50 text-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1 tracking-widest">Prix Unité</span>
                            <span className="text-xl font-black text-slate-900 dark:text-white">{product.price.toLocaleString()} F</span>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-3xl border border-emerald-100 dark:border-emerald-800/50 text-center">
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block mb-1 tracking-widest">Valeur Stock</span>
                            <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">{capitalValue.toLocaleString()} F</span>
                        </div>
                    </div>
                </div>

                {/* Voice Interaction */}
                <motion.div
                    whileTap={{ scale: 0.98 }}
                    onClick={() => speakIfNecessary(`Ce produit représente ${capitalValue} francs de ton capital marchand actuel, ${name}.`, 'NORMAL', true)}
                    className="bg-primary p-5 rounded-[24px] flex items-center gap-4 text-white shadow-lg cursor-pointer"
                >
                    <div className="bg-white/20 p-2.5 rounded-xl">
                        <Volume2 size={24} />
                    </div>
                    <p className="font-bold text-xs leading-tight uppercase tracking-wider">
                        Écouter l'analyse de l'assistant sur ce produit
                    </p>
                </motion.div>

                {/* History Section */}
                <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-slate-400" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Historique Récent</h3>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                    </div>

                    <div className="space-y-3">
                        {productHistory.length === 0 ? (
                            <div className="py-10 text-center">
                                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest italic">Aucun mouvement</p>
                            </div>
                        ) : (
                            productHistory.map((t, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-700/30">
                                    <div className="flex items-center gap-4 min-w-0 pr-2">
                                        <div className={`p-2.5 rounded-xl shrink-0 ${t.type === 'VENTE' ? 'bg-emerald-100 text-emerald-600' :
                                            t.type === 'LIVRAISON' ? 'bg-blue-100 text-blue-600' :
                                                'bg-rose-100 text-rose-600'
                                            }`}>
                                            {t.type === 'VENTE' ? <ShoppingBag size={18} /> :
                                                t.type === 'LIVRAISON' ? <PlusCircle size={18} /> :
                                                    <MinusCircle size={18} />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black text-slate-800 dark:text-white text-xs leading-none uppercase tracking-wider truncate mb-1">{t.type}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">{new Date(t.timestamp).toLocaleDateString()} • {t.quantity} unité(s)</p>
                                        </div>
                                    </div>
                                    <p className="font-black text-xs text-slate-900 dark:text-white shrink-0 whitespace-nowrap">
                                        {t.type === 'VENTE' ? '+' : '-'}{t.price.toLocaleString()} F
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Performance Hint */}
                <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-[24px] border border-amber-100 dark:border-amber-900/20 flex items-start gap-4">
                    <div className="bg-amber-100 dark:bg-amber-800 p-2 rounded-xl shrink-0">
                        <TrendingUp size={20} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <h4 className="font-black text-[10px] text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-1">Performance</h4>
                        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500/80 leading-snug">
                            Ce produit est dans ton Top 5 des ventes ce mois-ci. Pense à commander du stock demain.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
