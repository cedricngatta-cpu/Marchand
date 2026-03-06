'use client';

import React, { useState } from 'react';
import { ShoppingBag, Search, Filter, LayoutGrid, Wheat, CupSoda, Sparkles } from 'lucide-react';
import { useProductContext } from '../context/ProductContext';
import { useStock } from '../hooks/useStock';

interface ProductGridProps {
    onAdd: (product: any) => void;
    onSpeak: (text: string) => void;
}

export const ProductGrid = ({ onAdd, onSpeak }: ProductGridProps) => {
    const { products } = useProductContext();
    const { stock } = useStock();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('TOUS');

    const categories = [
        { id: 'TOUS', label: 'Tous', icon: LayoutGrid },
        { id: 'VIVRES', label: 'Vivres', icon: Wheat },
        { id: 'BOISSON', label: 'Boisson', icon: CupSoda },
        { id: 'ENTRETIEN', label: 'Entretien', icon: Sparkles },
    ];

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCat = activeFilter === 'TOUS' || p.category === activeFilter;
        return matchesSearch && matchesCat;
    });

    return (
        <div className="space-y-6">
            {/* Search and Filters */}
            <div className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-950 pt-2 pb-4 space-y-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                    <input
                        type="search"
                        placeholder="Rechercher un produit..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 py-4 pl-12 pr-4 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>

                <div className="flex flex-wrap gap-2 pb-2">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveFilter(cat.id)}
                            className={`flex flex-col items-center justify-center gap-1.5 p-3 w-16 h-16 rounded-[20px] transition-all border ${activeFilter === cat.id ? 'bg-primary border-primary text-white shadow-md scale-105' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200'} active:scale-95`}
                        >
                            <cat.icon size={20} strokeWidth={activeFilter === cat.id ? 2.5 : 2} />
                            <span className="font-bold text-[8px] uppercase tracking-widest">{cat.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((p) => {
                    const stockLevel = stock[p.id] || 0;
                    return (
                        <div
                            key={p.id}
                            onClick={() => {
                                onAdd(p);
                                onSpeak(`${p.name} ajouté.`);
                            }}
                            className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer active:scale-95 transition-all group relative"
                        >
                            <div className="absolute top-2 right-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-2 py-1 rounded-lg text-[11px] font-black shadow-lg z-10 border border-white/20 dark:border-slate-200">
                                {stockLevel}
                            </div>
                            <div className="relative aspect-square bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden mb-4 border border-slate-50 dark:border-slate-700">
                                {p.imageUrl ? (
                                    <img src={p.imageUrl} className="w-full h-full object-contain p-2" alt={p.name} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <ShoppingBag size={24} />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider truncate">{p.name}</h3>
                                <p className="text-primary font-bold text-sm">{p.price} F</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredProducts.length === 0 && (
                <div className="py-20 text-center">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Aucun produit trouvé</p>
                </div>
            )}
        </div>
    );
};
