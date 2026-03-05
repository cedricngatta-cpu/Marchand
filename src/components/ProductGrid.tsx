'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useProductContext } from '../context/ProductContext';
import { useStock } from '../hooks/useStock';

interface ProductGridProps {
    onAdd: (product: any) => void;
    onSpeak: (text: string) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ onAdd, onSpeak }) => {
    const { products } = useProductContext();
    const { stock } = useStock();
    const [activeCategory, setActiveCategory] = React.useState('TOUS');

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

    return (
        <div className="space-y-6">
            {/* Filtres Catégories */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
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

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product) => {
                    const stockLevel = stock[product.id] || 0;

                    return (
                        <motion.button
                            key={product.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                onAdd(product);
                                onSpeak(`Ajouté : ${product.audioName}`);
                            }}
                            className={`${product.color} p-3 rounded-[20px] sm:rounded-[24px] flex flex-col items-center justify-center gap-1.5 shadow-sm border border-black/5 active:shadow-inner transition-all h-32 relative`}
                        >
                            {/* Badge Stock */}
                            <div className="absolute top-2 right-2 bg-white/90 px-1.5 py-0.5 rounded-lg border border-black/5 shadow-sm flex items-center">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mr-1 hidden sm:inline">Stock</span>
                                <span className={`text-[10px] sm:text-xs font-black leading-none ${stockLevel <= 5 ? 'text-red-500' : 'text-slate-900'}`}>{stockLevel}</span>
                            </div>

                            <div className="w-full h-14 sm:h-16 mb-0.5 flex items-center justify-center relative overflow-hidden rounded-xl">
                                {product.imageUrl ? (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        className="w-full h-full object-contain hover:scale-110 transition-transform duration-500"
                                    />
                                ) : (
                                    <product.icon size={28} className={`${product.iconColor} sm:w-8 sm:h-8`} />
                                )}
                            </div>
                            <span className="font-black text-slate-900 tracking-tight text-[10px] sm:text-xs uppercase leading-tight text-center line-clamp-2 px-1">{product.name}</span>
                            {product.price > 0 && (
                                <span className="bg-white/60 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold text-slate-600 leading-none">
                                    {product.price} F
                                </span>
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};
