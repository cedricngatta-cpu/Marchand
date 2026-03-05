'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit3, Package, Plus, Trash2, Wheat } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useProductContext, Product } from '@/context/ProductContext';
import { useStock } from '@/hooks/useStock';

export default function ProducerStock() {
    const router = useRouter();
    const { products } = useProductContext();
    const { stock } = useStock();

    const displayProducts = products.filter((p: Product) => (stock[p.id] || 0) > 0);

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
                    <p className="text-amber-600 font-bold text-[10px] uppercase tracking-widest mt-1">Inventaire Récolte</p>
                </div>
            </header>

            <div className="space-y-4">
                {displayProducts.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 p-12 rounded-[40px] text-center border-4 border-dashed border-slate-100 dark:border-slate-800">
                        <Package size={64} className="mx-auto text-slate-200 mb-4" />
                        <p className="font-black text-slate-400 uppercase tracking-widest text-sm">Aucun produit en stock</p>
                    </div>
                ) : (
                    displayProducts.map((p: Product) => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-[28px] md:rounded-[35px] shadow-sm border-2 border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 md:gap-6 group overflow-hidden relative"
                        >
                            <div className="flex items-center gap-4 md:gap-6 relative z-10 w-full sm:w-auto">
                                <div className={`w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-[20px] md:rounded-[28px] ${p.color || 'bg-slate-100'} flex items-center justify-center shadow-inner overflow-hidden border-2 border-white dark:border-slate-700 bg-white/50 backdrop-blur-sm`}>
                                    {p.imageUrl ? (
                                        <img src={p.imageUrl} className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform duration-500" alt={p.name} />
                                    ) : (
                                        <Package className="text-slate-300" size={32} />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-black uppercase tracking-tight text-slate-900 dark:text-white text-base md:text-xl leading-none mb-2 md:mb-1 truncate">{p.name}</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl md:text-3xl font-black text-emerald-600 leading-none">{stock[p.id] || 0}</span>
                                            <span className="text-[9px] md:text-[10px] uppercase font-black text-slate-400 tracking-widest">Unités</span>
                                        </div>
                                        <span className="h-4 w-[2px] bg-slate-100 dark:bg-slate-800 mx-1 shrink-0" />
                                        <span className="text-emerald-500 font-black text-xs md:text-sm whitespace-nowrap">{p.price} F / u</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-row sm:flex-col gap-2 relative z-10 w-full sm:w-auto justify-end sm:justify-start">
                                <button className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-500 transition-colors">
                                    <Edit3 size={20} />
                                </button>
                                <button className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">
                                    <Trash2 size={20} />
                                </button>
                            </div>

                            {/* Decoration background icon */}
                            {!p.imageUrl && (
                                <Package size={120} className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity" />
                            )}
                        </motion.div>
                    ))
                )}

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

            {/* Total Value */}
            <div className="mt-8 md:mt-10 bg-slate-900 dark:bg-emerald-900/40 p-6 md:p-10 rounded-[32px] md:rounded-[45px] text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                    <span className="text-white/60 font-black uppercase text-[10px] md:text-xs tracking-widest">Valeur Estimée</span>
                    <div className="text-3xl md:text-5xl font-black tracking-tighter mt-1">425 000 <span className="text-xl md:text-2xl opacity-60">F</span></div>
                </div>
                <Package size={100} className="md:w-[140px] md:h-[140px] absolute -right-6 -bottom-6 md:-right-8 md:-bottom-8 opacity-10 rotate-12" />
            </div>
        </main>
    );
}
