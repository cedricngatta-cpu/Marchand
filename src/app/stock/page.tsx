'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Package, AlertTriangle, Volume2, Mic, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StockItem } from '@/components/StockItem';
import { StockDetailModal } from '@/components/StockDetailModal';
import { AddProductModal } from '@/components/AddProductModal';
import { useAssistant } from '@/hooks/useAssistant';
import { useStock } from '@/hooks/useStock';
import { useHistory } from '@/hooks/useHistory';
import { useProductContext } from '@/context/ProductContext';

export default function StockPage() {
    const router = useRouter();
    const { products, addProduct } = useProductContext();
    const { speak, handleAction, isSpeaking, isListening } = useAssistant();
    const { stock, updateStock } = useStock();
    const { addTransaction } = useHistory();
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [isAddMode, setIsAddMode] = useState(false);
    const [activeCategory, setActiveCategory] = useState('TOUS');

    const categories = ['TOUS', 'VIVRES', 'BOISSON', 'ENTRETIEN', 'AUTRE'];

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

        speak(`Kouamé, tu as : ${stockItems} en stock.`);
    };


    const lowStockCount = products.filter(p => (stock[p.id] || 0) < 5).length;

    const handleAddProduct = async (newProduct: { name: string, price: number, barcode?: string }) => {
        await addProduct({
            name: newProduct.name,
            price: newProduct.price,
            barcode: newProduct.barcode,
            color: 'bg-slate-50',
            iconColor: 'text-slate-600',
            audioName: newProduct.name.toLowerCase(),
            icon: Package
        });
        speak(`${newProduct.name} a été ajouté à ton catalogue.`);
    };

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-3 pb-32 md:pb-32 lg:pb-32 max-w-6xl mx-auto">
            {/* Header Retour */}
            <header className="flex items-center gap-2 md:gap-4 mb-4 md:mb-8 pt-2">
                <button
                    onClick={() => router.push('/')}
                    className="w-9 h-9 md:w-12 md:h-12 bg-white dark:bg-slate-800 rounded-full shadow-md flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-95 transition-all shrink-0 border border-slate-100 dark:border-slate-800"
                >
                    <ChevronLeft size={20} className="md:w-8 md:h-8" />
                </button>
                <div className="min-w-0">
                    <h1 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none truncate">Mon Stock</h1>
                    <p className="text-amber-600 font-bold text-[8px] md:text-[10px] uppercase tracking-widest mt-0.5">Inventaire</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                    <button
                        onClick={() => setIsAddMode(true)}
                        className="flex items-center gap-1.5 bg-emerald-600 text-white px-2.5 md:px-4 py-1.5 md:py-2.5 rounded-lg md:rounded-2xl font-black text-[8px] md:text-xs uppercase shadow-lg shadow-emerald-100 dark:shadow-none active:scale-95 transition-all"
                    >
                        <PlusCircle size={14} className="md:w-[18px] md:h-[18px]" />
                        <span className="hidden sm:inline">Nouveau</span>
                        <span className="sm:hidden">ADD</span>
                    </button>
                    <button
                        onClick={speakFullStock}
                        className="w-9 h-9 md:w-12 md:h-12 bg-white dark:bg-slate-800 rounded-full shadow-md flex items-center justify-center text-blue-600 active:scale-90 transition-transform border border-slate-100 dark:border-slate-800 shrink-0"
                    >
                        <Volume2 size={18} className="md:w-6 md:h-6" />
                    </button>
                </div>
            </header>

            {/* Alerte Stock Bas */}
            {lowStockCount > 0 && (
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={() => speak(`Kouamé, il y a ${lowStockCount} produits presque finis.`)}
                    className="bg-red-50 dark:bg-red-900/10 border-2 md:border-4 border-red-500 p-3 md:p-6 rounded-[20px] md:rounded-[32px] mb-4 flex items-center gap-2 md:gap-4 text-red-700 dark:text-red-400 shadow-lg shadow-red-200 dark:shadow-none cursor-pointer"
                >
                    <div className="bg-red-500 p-1.5 md:p-3 rounded-full text-white shrink-0">
                        <AlertTriangle size={20} className="md:w-8 md:h-8" />
                    </div>
                    <div>
                        <h2 className="font-black uppercase text-base md:text-xl leading-none">Attention !</h2>
                        <p className="font-bold text-[10px] md:text-sm">Des produits sont bientôt finis.</p>
                    </div>
                </motion.div>
            )}

            {/* Filtres Catégories */}
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 mb-4">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap border-2 ${activeCategory === cat ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Liste des items de stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                    <StockItem
                        key={product.id}
                        name={product.name}
                        icon={product.icon}
                        quantity={stock[product.id] || 0}
                        color={product.color}
                        iconColor={product.iconColor}
                        onAdd={() => {
                            const shortName = product.audioName.replace(/^[Ll]e\s+/, '').replace(/^[Ll]a\s+/, '').replace(/^[Ll]'\s+/, '');
                            updateStock(product.id, 1);
                            addTransaction({
                                type: 'LIVRAISON',
                                productId: product.id,
                                productName: product.name,
                                quantity: 1,
                                price: product.price
                            });
                            speak(`un ${shortName} ajouté au stock.`);
                        }}
                        onRemove={() => {
                            const shortName = product.audioName.replace(/^[Ll]e\s+/, '').replace(/^[Ll]a\s+/, '').replace(/^[Ll]'\s+/, '');
                            updateStock(product.id, -1);
                            addTransaction({
                                type: 'RETRAIT',
                                productId: product.id,
                                productName: product.name,
                                quantity: 1,
                                price: product.price
                            });
                            speak(`un ${shortName} retiré du stock.`);
                        }}
                        onViewDetails={() => setSelectedProduct(product)}
                        onSpeak={() => {
                            const qty = stock[product.id] || 0;
                            const shortName = product.audioName.replace(/^[Ll]e\s+/, '').replace(/^[Ll]a\s+/, '').replace(/^[Ll]'\s+/, '');
                            const formatted = qty === 1 ? `un ${shortName}` : `${qty} ${shortName}${shortName.endsWith('s') || shortName.endsWith('x') ? '' : 's'}`;
                            speak(`Il reste ${formatted}.`);
                        }}
                    />
                ))}
            </div>

            <AnimatePresence>
                {selectedProduct && (
                    <StockDetailModal
                        product={selectedProduct}
                        currentStock={stock[selectedProduct.id] || 0}
                        onClose={() => setSelectedProduct(null)}
                    />
                )}
                {isAddMode && (
                    <AddProductModal
                        onClose={() => setIsAddMode(false)}
                        onAdd={handleAddProduct}
                    />
                )}
            </AnimatePresence>

            {/* Aide Vocale */}
            <div className="mt-8 bg-white dark:bg-slate-900 p-5 md:p-6 rounded-[28px] md:rounded-[40px] border-2 border-slate-100 dark:border-slate-800 flex items-center gap-4 shadow-sm mb-20 md:mb-24">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-900 rounded-full flex items-center justify-center text-white shrink-0">
                    <Package size={20} className="md:w-6 md:h-6" />
                </div>
                <p className="font-bold text-slate-600 dark:text-slate-300 leading-tight text-xs md:text-sm">
                    Appuie sur le bouton noir pour me parler et gérer ton stock.
                </p>
            </div>

            {/* Micro Global Fixé */}
            <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 pointer-events-none z-50">
                <motion.button
                    onClick={handleAction}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`h-22 md:h-22 px-6 md:px-8 rounded-[28px] md:rounded-[35px] shadow-2xl text-white flex items-center gap-4 md:gap-6 pointer-events-auto border-4 border-white dark:border-slate-900 transition-all ${isListening ? 'bg-red-500' : 'bg-slate-900 active:bg-slate-800'}`}
                >
                    <div className={`p-3 md:p-4 rounded-full ${isSpeaking || isListening ? 'bg-white text-slate-900' : 'bg-white/20 text-white'} transition-all duration-300 shrink-0`}>
                        <Mic size={28} className="md:w-9 md:h-9" fill={isSpeaking || isListening ? "currentColor" : "none"} strokeWidth={3} />
                    </div>
                    <div className="flex flex-col items-start pr-2 md:pr-4 text-left">
                        <span className="text-lg md:text-xl font-black leading-none uppercase">{isListening ? "ÉCOUTE..." : "PARLER"}</span>
                        <span className="text-[9px] md:text-[10px] font-bold opacity-80 tracking-tighter italic">Appuie pour me parler</span>
                    </div>
                </motion.button>
            </div>
        </main>
    );
}
