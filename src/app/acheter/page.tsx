'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ShoppingCart, Truck, PlusCircle, Volume2, Mic, CheckCircle2, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAssistant } from '@/hooks/useAssistant';
import { useStock } from '@/hooks/useStock';
import { useHistory } from '@/hooks/useHistory';
import { useProductContext } from '@/context/ProductContext';
import { useAuth } from '@/context/AuthContext';
import { useVoice } from '@/hooks/useVoice'; // Added import for useVoice

export default function AcheterPage() {
    const router = useRouter();
    const { products } = useProductContext();
    const { user } = useAuth();
    const { speakIfNecessary } = useVoice(); // Added this line
    const name = user?.name?.split(' ')[0] || 'Marchand';
    const { handleAction, isSpeaking, isListening } = useAssistant(); // Modified this line to remove 'speak'
    const { updateStock } = useStock();
    const { addTransaction } = useHistory();
    const [lastOrdered, setLastOrdered] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState('TOUS');

    const categories = ['TOUS', 'VIVRES', 'FRUITS & LÉGUMES', 'TUBERCULES', 'BOISSON', 'ENTRETIEN', 'AUTRE'];

    const filteredProducts = activeCategory === 'TOUS'
        ? products
        : products.filter(p => {
            const name = (p.name || '').toUpperCase();
            const isFruitsLegumes = name.includes('TOMATE') || name.includes('OIGNON') || name.includes('CAROTTE') || name.includes('ANANAS') || name.includes('BANANE') || name.includes('FRUIT') || name.includes('LÉGUME');
            const isTubercules = name.includes('IGNAME') || name.includes('MANIOC') || name.includes('POMME DE TERRE') || name.includes('TUBERCULE');
            const isVivres = (name.includes('RIZ') || name.includes('HUILE') || name.includes('LAIT') || name.includes('ATTIÉKÉ') || name.includes('PAIN') || name.includes('SUCRE') || name.includes('VIVRE')) && !isFruitsLegumes && !isTubercules;
            const isBoisson = name.includes('EAU') || name.includes('CAFÉ') || name.includes('JUS') || name.includes('BOISSON') || name.includes('BIÈRE') || name.includes('VIN');
            const isEntretien = name.includes('SAVON') || name.includes('JAVEL') || name.includes('PAPIER') || name.includes('ENTRETIEN') || name.includes('LESSIVE');

            if (activeCategory === 'FRUITS & LÉGUMES') return isFruitsLegumes;
            if (activeCategory === 'TUBERCULES') return isTubercules;
            if (activeCategory === 'VIVRES') return isVivres;
            if (activeCategory === 'BOISSON') return isBoisson;
            if (activeCategory === 'ENTRETIEN') return isEntretien;
            if (activeCategory === 'AUTRE') return !isVivres && !isBoisson && !isEntretien && !isFruitsLegumes && !isTubercules;
            return false;
        });

    const handleOrder = (product: any, qty: number) => {
        const shortName = (product.audioName || product.name).replace(/^[Ll]e\s+/, '').replace(/^[Ll]a\s+/, '').replace(/^[Ll]'\s+/, '');
        const formattedName = qty === 1 ? `un ${shortName}` : `${qty} ${shortName}${shortName.endsWith('s') || shortName.endsWith('x') ? '' : 's'}`;

        updateStock(product.id, qty);
        addTransaction({
            type: 'LIVRAISON',
            productId: product.id,
            productName: product.name,
            quantity: qty,
            price: product.price
        });
        setLastOrdered(product.name);
        speakIfNecessary(`Bravo ${name}, tu as reçu ${formattedName}. C'est ajouté à ton stock.`, 'LOW');
        setTimeout(() => setLastOrdered(null), 3000);
    };

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-3 pb-32 md:pb-64 lg:pb-48 max-w-5xl mx-auto">
            <header className="flex items-center gap-2 md:gap-4 mb-3 md:mb-8 pt-2">
                <button
                    onClick={() => router.push('/')}
                    className="w-9 h-9 md:w-12 md:h-12 bg-white dark:bg-slate-800 rounded-full shadow-md flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-90 transition-transform shrink-0"
                >
                    <ChevronLeft size={20} className="md:w-8 md:h-8" />
                </button>
                <h1 className="text-lg md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate">Acheter / Reçu</h1>
            </header>

            <section className="bg-blue-600 rounded-[24px] md:rounded-[40px] p-4 md:p-12 text-white mb-4 md:mb-8 shadow-xl shadow-blue-100 dark:shadow-blue-900/20 overflow-hidden relative">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
                        <Truck size={24} className="md:w-10 md:h-10" />
                        <span className="font-black uppercase tracking-widest text-blue-100 text-[9px] md:text-base">Nouvel Arrivage</span>
                    </div>
                    <p className="text-sm md:text-2xl font-bold max-w-2xl leading-tight">
                        {name}, quand tu reçois des produits, appuie sur le bouton <PlusCircle className="inline w-4 h-4 md:w-6 md:h-6" /> ou parle-moi simplement.
                    </p>
                </div>
                <Truck size={180} className="absolute -right-8 -bottom-8 text-white/10 rotate-12 hidden md:block" />
                <Truck size={60} className="absolute -right-2 -bottom-2 text-white/10 rotate-12 md:hidden" />
            </section>

            {/* Filtres Catégories */}
            <div className="flex gap-2 md:gap-3 overflow-x-auto pb-4 md:pb-6 scrollbar-hide -mx-4 px-4 mb-4 md:mb-6">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-6 md:px-8 py-3 md:py-4 rounded-[16px] md:rounded-[20px] font-black text-xs md:text-sm uppercase tracking-widest transition-all whitespace-nowrap border-[1.5px] md:border-2 ${activeCategory === cat ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredProducts.map(product => (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-[28px] md:rounded-[35px] border-2 border-slate-100 dark:border-slate-800 flex flex-col gap-5 md:gap-6 shadow-sm hover:border-blue-200 dark:hover:border-blue-900 transition-colors group overflow-hidden relative"
                    >
                        <div className="flex items-center gap-3 md:gap-4 relative z-10">
                            <div className={`w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-[20px] md:rounded-3xl ${product.color || 'bg-slate-100'} flex items-center justify-center shadow-inner overflow-hidden border-2 border-white dark:border-slate-700 bg-white/50 backdrop-blur-sm`}>
                                {product.imageUrl ? (
                                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <Package size={28} className="text-slate-300 md:w-9 md:h-9" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-black text-slate-800 dark:text-white uppercase text-base md:text-lg leading-tight mb-1 truncate">{product.name}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] md:text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full uppercase tracking-widest border border-blue-100 dark:border-blue-800">Enregistrer</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 md:gap-3 relative z-10">
                            {[5, 10, 20].map(qty => (
                                <button
                                    key={qty}
                                    onClick={() => handleOrder(product, qty)}
                                    className="flex-1 h-10 md:h-16 bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-lg md:rounded-2xl flex items-center justify-center font-black text-sm md:text-xl text-slate-900 dark:text-white border-2 border-slate-100 dark:border-slate-700 active:bg-blue-600 active:text-white active:border-blue-600 transition-all shadow-sm"
                                >
                                    +{qty}
                                </button>
                            ))}
                        </div>

                        {/* Decoration Icon background */}
                        {!product.imageUrl && (
                            <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none transition-opacity group-hover:opacity-10">
                                <Package size={120} />
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Micro Global (Centré et Responsive) */}
            <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 md:px-6 pointer-events-none z-50">
                <motion.button
                    onClick={handleAction}
                    whileTap={{ scale: 0.95 }}
                    className={`h-22 w-auto px-6 md:h-32 md:px-16 rounded-[28px] md:rounded-[50px] shadow-2xl text-white flex items-center justify-center gap-4 md:gap-6 pointer-events-auto border-4 border-white dark:border-slate-900 transition-all ${isListening ? 'bg-red-500 scale-105 md:scale-110 animate-pulse' : 'bg-blue-600 active:bg-blue-700'}`}
                >
                    <div className={`p-4 md:p-6 rounded-2xl md:rounded-3xl ${isSpeaking || isListening ? 'bg-white text-blue-600' : 'bg-white/20 text-white'} transition-all duration-300 shrink-0`}>
                        <Mic size={28} className="md:w-12 md:h-12 md:scale-110" fill={isSpeaking || isListening ? "currentColor" : "none"} strokeWidth={3} />
                    </div>
                    <div className="flex flex-col items-start pr-2 md:pr-4 text-left">
                        <span className="text-xl md:text-3xl font-black leading-none uppercase">{isListening ? "ÉCOUTE..." : "PARLER"}</span>
                        <span className="text-[10px] md:text-base font-bold opacity-80 italic tracking-tighter text-blue-100 uppercase">"J'ai reçu 10 pains"</span>
                    </div>
                </motion.button>
            </div>

            <AnimatePresence>
                {lastOrdered && (
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        className="fixed bottom-40 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-blue-900 bg-opacity-95 text-white px-10 py-5 rounded-full font-black uppercase tracking-widest text-sm shadow-2xl border-4 border-white/20 z-[60] flex items-center gap-4 whitespace-nowrap"
                    >
                        <CheckCircle2 size={24} className="text-emerald-400" /> {lastOrdered} AJOUTÉ AU STOCK !
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
