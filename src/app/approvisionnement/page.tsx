'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, MapPin, Truck, PhoneCall, Star, CheckCircle2, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useVoice } from '@/hooks/useVoice';

// Mock data for producers/suppliers
export const SUPPLIERS = [
    { id: 1, name: 'Grossiste Diallo', product: 'Riz Local', price: 17500, unit: 'Sac (25kg)', stock: 50, distance: '2 km', rating: 4.8, type: 'WHOLESALER', imageUrl: '/images/products/riz.png' },
    { id: 2, name: 'Ferme Bamba', product: 'Attiéké Frais', price: 500, unit: 'Sachet', stock: 120, distance: '5 km', rating: 4.5, type: 'PRODUCER', imageUrl: '/images/products/attieke.png' },
    { id: 3, name: 'Distributeur Koné', product: 'Huile 1.5L', price: 1500, unit: 'Bouteille', stock: 100, distance: '1 km', rating: 4.9, type: 'WHOLESALER', imageUrl: '/images/products/huile.png' },
    { id: 4, name: 'Coopérative N\'Zassa', product: 'Sucre en Morceaux', price: 900, unit: 'Paquet (1kg)', stock: 65, distance: '8 km', rating: 4.2, type: 'PRODUCER', imageUrl: '/images/products/sucre.png' },
];

export default function ApprovisionnementPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredSuppliers = SUPPLIERS.filter(s =>
        s.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
            {/* Header Coloré (Card Overlap Style) */}
            <div className="bg-primary pt-8 pb-32 px-4 rounded-b-[2.5rem] relative shadow-lg">
                <div className="flex justify-between items-center max-w-lg mx-auto mb-6">
                    <button onClick={() => router.back()} className="w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="text-center flex-1 pr-10">
                        <h1 className="text-white font-bold text-lg tracking-wide uppercase">Marché Virtuel</h1>
                        <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mt-0.5">Fournisseurs & Grossistes</p>
                    </div>
                </div>

                {/* Search Bar (Inside Header) */}
                <div className="max-w-lg mx-auto relative mt-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Chercher Tomate, Riz..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-14 bg-white dark:bg-slate-900 rounded-[20px] pl-12 pr-4 font-semibold text-sm text-slate-800 dark:text-white shadow-md border-none focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all uppercase placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Main Content Overlap */}
            <main className="mt-[-40px] relative z-10 px-4 max-w-lg mx-auto space-y-4">

                {/* Supplier List */}
                <div className="grid grid-cols-1 gap-4">
                    {filteredSuppliers.map(supplier => (
                        <motion.div
                            key={supplier.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => router.push(`/approvisionnement/${supplier.id}`)}
                            className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col gap-4 shadow-xl cursor-pointer hover:border-emerald-200 transition-all group"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-14 h-14 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border border-blue-100 dark:border-slate-700 shadow-sm">
                                        {supplier.imageUrl ? (
                                            <img src={supplier.imageUrl} alt={supplier.product} className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform duration-500" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                                        ) : null}
                                        <div className={supplier.imageUrl ? "hidden" : ""}>
                                            <Truck size={24} />
                                        </div>
                                    </div>
                                    <div className="min-w-0 pr-2">
                                        <h3 className="font-black text-slate-800 dark:text-white uppercase leading-tight text-sm truncate">{supplier.product}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate mt-0.5">{supplier.name}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="font-black text-base text-emerald-600 whitespace-nowrap">{supplier.price} F</div>
                                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest whitespace-nowrap mt-0.5">/ {supplier.unit}</div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-[9px] font-black uppercase tracking-widest pt-3 border-t-2 border-slate-50 dark:border-slate-800">
                                <div className="flex items-center gap-1 text-slate-400">
                                    <MapPin size={12} /> {supplier.distance}
                                </div>
                                <div className="flex items-center gap-1 text-amber-500 bg-amber-50 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-amber-100 dark:border-slate-700">
                                    <Star size={12} fill="currentColor" />
                                    <span className="font-black">{supplier.rating}</span>
                                </div>
                                <div className="flex items-center gap-1 text-blue-500 bg-blue-50 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-blue-100 dark:border-slate-700 ml-auto">
                                    STOCK: {supplier.stock}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

            </main>
        </div>
    );
}
