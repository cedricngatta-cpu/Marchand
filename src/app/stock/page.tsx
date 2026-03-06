'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Package, AlertTriangle, Volume2, Mic, PlusCircle, LayoutGrid, Wheat, CupSoda, Sparkles, MoreHorizontal, Minus, Plus, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useStock } from '@/hooks/useStock';
import { useProductContext } from '@/context/ProductContext';
import { useAuth } from '@/context/AuthContext';

export default function StockPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { products } = useProductContext();
    const { stock, updateStock } = useStock();
    const [activeCategory, setActiveCategory] = useState('TOUS');

    const categories = [
        { id: 'TOUS', label: 'Tous', icon: LayoutGrid },
        { id: 'VIVRES', label: 'Vivres', icon: Wheat },
        { id: 'BOISSON', label: 'Boisson', icon: CupSoda },
        { id: 'ENTRETIEN', label: 'Entretien', icon: Sparkles },
        { id: 'AUTRE', label: 'Autre', icon: MoreHorizontal },
    ];

    const filteredProducts = activeCategory === 'TOUS'
        ? products
        : products.filter(p => {
            const name = p.name.toUpperCase();
            const isVivres = name.includes('RIZ') || name.includes('HUILE') || name.includes('LAIT') || name.includes('ATTIÉKÉ') || name.includes('PAIN') || name.includes('SUCRE') || name.includes('VIVRE');
            const isBoisson = name.includes('EAU') || name.includes('CAFÉ') || name.includes('JUS') || name.includes('BOISSON') || name.includes('BIÈRE') || name.includes('VIN');
            const isEntretien = name.includes('SAVON') || name.includes('JAVEL') || name.includes('PAPIER') || name.includes('ENTRETIEN') || name.includes('LESSIVE');

            if (activeCategory === 'VIVRES') return isVivres;
            if (activeCategory === 'BOISSON') return isBoisson;
            if (activeCategory === 'ENTRETIEN') return isEntretien;
            if (activeCategory === 'AUTRE') return !isVivres && !isBoisson && !isEntretien;

            return false;
        });

    const lowStockCount = products.filter(p => (stock[p.id] || 0) < 5).length;

    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    const handleUpdateStock = async (productId: string, amount: number) => {
        if (isUpdating) return;
        setIsUpdating(productId);
        try {
            await updateStock(productId, amount);
        } finally {
            // Petit délai pour laisser le re-render se faire proprement
            setTimeout(() => setIsUpdating(null), 100);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
            {/* Header Coloré (Card Overlap Style) */}
            <div className="bg-primary pt-8 pb-32 px-4 rounded-b-[2.5rem] relative shadow-lg">
                <div className="flex justify-between items-center mb-6 max-w-lg mx-auto">
                    <button
                        type="button"
                        onClick={() => router.push('/commercant')}
                        className="w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-center">
                        <h1 className="text-white font-bold text-lg tracking-wide uppercase">Mon Stock</h1>
                        <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mt-0.5">État des réserves</p>
                    </div>
                    <div className="w-10 h-10" /> {/* Spacer */}
                </div>

                {/* Bouton Ajouter (Centré dans le header) */}
                <div className="flex justify-center max-w-lg mx-auto mt-6">
                    <button
                        type="button"
                        onClick={() => router.push('/stock/ajouter')}
                        className="bg-white text-primary px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-widest flex items-center gap-2 shadow-md active:scale-95 transition-transform"
                    >
                        <PlusCircle size={18} />
                        Ajouter un produit
                    </button>
                </div>
            </div>

            {/* Main Content Overlap */}
            <main className="mt-[-40px] relative z-10 px-4 max-w-lg mx-auto space-y-6">

                {/* Alerte Stock Bas */}
                {lowStockCount > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/10 border md:border-2 border-red-500 p-2 md:p-4 rounded-xl md:rounded-2xl mb-3 flex items-center gap-2 md:gap-3 text-red-700 dark:text-red-400 shadow-md shadow-red-200 dark:shadow-none">
                        <div className="bg-red-500 p-1.5 md:p-2 rounded-lg text-white shrink-0">
                            <AlertTriangle size={16} className="md:w-6 md:h-6" />
                        </div>
                        <div>
                            <h2 className="font-black uppercase text-xs md:text-sm leading-none">Attention !</h2>
                            <p className="font-bold text-[9px] md:text-xs">{lowStockCount} produit(s) bientôt fini(s).</p>
                        </div>
                    </div>
                )}

                {/* Filtres Catégories */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-xl border border-slate-100 dark:border-slate-800 mb-6">
                    <div className="flex flex-wrap justify-between gap-y-3 gap-x-1">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setActiveCategory(cat.id)}
                                className={`flex flex-col items-center justify-center gap-1 p-2 w-14 h-16 rounded-[20px] transition-all border ${activeCategory === cat.id ? 'bg-primary border-primary text-white shadow-md scale-105' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 hover:border-slate-200'} active:scale-95`}
                            >
                                <cat.icon size={20} strokeWidth={activeCategory === cat.id ? 2.5 : 2} />
                                <span className="font-bold text-[8px] uppercase tracking-widest truncate w-full text-center px-0.5">{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Liste des items de stock */}
                <div className="grid grid-cols-1 gap-4">
                    {filteredProducts.map((product) => {
                        const qty = stock[product.id] || 0;
                        const isLow = qty < 5;
                        const updating = isUpdating === product.id;
                        return (
                            <div
                                key={product.id}
                                className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-5 min-w-0">
                                    <div className={`w-14 h-14 rounded-xl ${product.imageUrl ? 'bg-slate-100' : product.color} flex items-center justify-center shrink-0 border border-slate-50 overflow-hidden relative`}>
                                        {product.imageUrl ? (
                                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <product.icon className={product.iconColor} size={28} />
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider truncate mb-1">{product.name}</h3>
                                        <div className="flex items-baseline gap-2">
                                            <span className={`text-2xl font-bold ${isLow ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                                                {qty}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400">UNITÉS</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        type="button"
                                        disabled={updating}
                                        onClick={() => handleUpdateStock(product.id, -1)}
                                        className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors active:scale-90 disabled:opacity-50"
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={updating}
                                        onClick={() => handleUpdateStock(product.id, 1)}
                                        className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-colors active:scale-90 disabled:opacity-50"
                                    >
                                        <Plus size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => router.push(`/stock/${product.id}`)}
                                        className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg active:bg-slate-800 transition-colors active:scale-90"
                                    >
                                        <Eye size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Aide */}
                <div className="mt-6 bg-white dark:bg-slate-900 p-3 md:p-4 rounded-[20px] md:rounded-[24px] border border-slate-100 dark:border-slate-800 flex items-center gap-2 md:gap-4 shadow-sm mb-16 md:mb-20">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-900 rounded-full flex items-center justify-center text-white shrink-0">
                        <Package size={16} className="md:w-5 md:h-5" />
                    </div>
                    <p className="font-bold text-slate-600 dark:text-slate-300 leading-tight text-[10px] md:text-xs">
                        Utilise les boutons + et - pour ajuster ton stock.
                    </p>
                </div>

            </main>
        </div>
    );
}
