'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Package, AlertTriangle, Volume2, Mic, PlusCircle, LayoutGrid, Wheat, CupSoda, Sparkles, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StockItem } from '@/components/StockItem';
import { useAssistant } from '@/hooks/useAssistant';
import { useStock } from '@/hooks/useStock';
import { useHistory } from '@/hooks/useHistory';
import { useProductContext } from '@/context/ProductContext';
import { useAuth } from '@/context/AuthContext';

export default function StockPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { products, addProduct } = useProductContext();
    const { speak, handleAction, isSpeaking, isListening } = useAssistant();
    const { stock, updateStock } = useStock();
    const { addTransaction } = useHistory();
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

    const speakFullStock = () => {
        const stockItems = products.map(p => {
            const qty = stock[p.id] || 0;
            // On enlève "Le" ou "La" pour dire "Tu as 20 pains"
            const simpleName = p.audioName.replace(/^[Ll]e\s+/, '').replace(/^[Ll]a\s+/, '').replace(/^[Ll]'\s+/, '');
            return `${qty} ${simpleName}`;
        }).join(', ');

        speak(`${user?.name?.split(' ')[0] || 'Marchand'}, tu as : ${stockItems} en stock.`);
    };


    const lowStockCount = products.filter(p => (stock[p.id] || 0) < 5).length;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
            {/* Header Coloré (Card Overlap Style) */}
            <div className="bg-primary pt-8 pb-32 px-4 rounded-b-[2.5rem] relative shadow-lg">
                <div className="flex justify-between items-center mb-6 max-w-lg mx-auto">
                    <button onClick={() => router.push('/')} className="w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-center">
                        <h1 className="text-white font-bold text-lg tracking-wide uppercase">Mon Stock</h1>
                        <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mt-0.5">État des réserves</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={speakFullStock} className="w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm">
                            <Volume2 size={18} />
                        </button>
                    </div>
                </div>

                {/* Bouton Ajouter (Centré dans le header) */}
                <div className="flex justify-center max-w-lg mx-auto mt-6">
                    <button
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
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={() => speak(`${user?.name?.split(' ')[0] || 'Marchand'}, il y a ${lowStockCount} produits presque finis.`)}
                        className="bg-red-50 dark:bg-red-900/10 border md:border-2 border-red-500 p-2 md:p-4 rounded-xl md:rounded-2xl mb-3 flex items-center gap-2 md:gap-3 text-red-700 dark:text-red-400 shadow-md shadow-red-200 dark:shadow-none cursor-pointer"
                    >
                        <div className="bg-red-500 p-1.5 md:p-2 rounded-lg text-white shrink-0">
                            <AlertTriangle size={16} className="md:w-6 md:h-6" />
                        </div>
                        <div>
                            <h2 className="font-black uppercase text-xs md:text-sm leading-none">Attention !</h2>
                            <p className="font-bold text-[9px] md:text-xs">Des produits sont bientôt finis.</p>
                        </div>
                    </motion.div>
                )}

                {/* Filtres Catégories (Sans défilement horizontal avec flex-wrap) */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-xl border border-slate-100 dark:border-slate-800 mb-6">
                    <div className="flex flex-wrap justify-between gap-y-3 gap-x-1">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
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
                    {filteredProducts.map((product) => (
                        <StockItem
                            key={product.id}
                            name={product.name}
                            icon={product.icon}
                            imageUrl={product.imageUrl}
                            quantity={stock[product.id] || 0}
                            color={product.color}
                            iconColor={product.iconColor}
                            onAdd={() => {
                                updateStock(product.id, 1);
                                addTransaction({
                                    type: 'LIVRAISON',
                                    productId: product.id,
                                    productName: product.name,
                                    quantity: 1,
                                    price: product.price
                                });
                            }}
                            onRemove={() => {
                                updateStock(product.id, -1);
                                addTransaction({
                                    type: 'RETRAIT',
                                    productId: product.id,
                                    productName: product.name,
                                    quantity: 1,
                                    price: product.price
                                });
                            }}
                            onViewDetails={() => router.push(`/stock/${product.id}`)}
                            onSpeak={() => {
                                const qty = stock[product.id] || 0;
                                const shortName = product.audioName.replace(/^[Ll]e\s+/, '').replace(/^[Ll]a\s+/, '').replace(/^[Ll]'\s+/, '');
                                const formatted = qty === 1 ? `un ${shortName}` : `${qty} ${shortName}${shortName.endsWith('s') || shortName.endsWith('x') ? '' : 's'}`;
                                speak(`Il reste ${formatted}.`);
                            }}
                        />
                    ))}
                </div>



                {/* Aide Vocale */}
                <div className="mt-6 bg-white dark:bg-slate-900 p-3 md:p-4 rounded-[20px] md:rounded-[24px] border border-slate-100 dark:border-slate-800 flex items-center gap-2 md:gap-4 shadow-sm mb-16 md:mb-20">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-900 rounded-full flex items-center justify-center text-white shrink-0">
                        <Package size={16} className="md:w-5 md:h-5" />
                    </div>
                    <p className="font-bold text-slate-600 dark:text-slate-300 leading-tight text-[10px] md:text-xs">
                        Appuie sur le bouton noir pour me parler et gérer ton stock.
                    </p>
                </div>

                {/* Micro Global Fixé (Style Wave) */}
                <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 pointer-events-none z-50">
                    <button
                        onClick={handleAction}
                        className={`h-16 px-6 rounded-2xl shadow-xl text-white flex items-center gap-4 w-auto pointer-events-auto transition-all ${isListening ? 'bg-rose-500' : 'bg-slate-900'}`}
                    >
                        <div className={`p-2 bg-slate-800 dark:bg-slate-700 text-white rounded-full transition-all shrink-0`}>
                            <Mic size={20} fill={isSpeaking || isListening ? "currentColor" : "none"} />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-xs font-bold uppercase tracking-widest">{isListening ? "ÉCOUTE..." : "PARLER"}</span>
                            <span className="text-[9px] font-medium opacity-60 italic">Appuie pour parler</span>
                        </div>
                    </button>
                </div>
            </main>
        </div>
    );
}
