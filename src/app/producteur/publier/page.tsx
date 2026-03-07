'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Check, Plus, Save, Tag, Wheat } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useVoice } from '@/hooks/useVoice';

export default function PublierProduit() {
    const router = useRouter();
    const { speak } = useVoice();
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [category, setCategory] = useState('RECOLTE');

    const handlePublish = () => {
        // speak(`Bravo...`); - SILENCED Mission 1
        router.push('/producteur');
    };

    return (
        <main className="min-h-screen bg-white dark:bg-slate-950 p-4 md:p-6 max-w-2xl mx-auto pb-24 md:pb-32">
            <header className="flex items-center gap-4 mb-8 md:mb-10 pt-4">
                <button
                    onClick={() => router.back()}
                    className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-90 transition-all shrink-0"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Publier un Produit</h1>
                    <p className="text-amber-600 font-bold text-[10px] uppercase tracking-widest mt-1">Nouvelle récolte</p>
                </div>
            </header>

            <div className="space-y-6 md:space-y-8">
                {/* Photo Placeholder */}
                <div className="aspect-video bg-slate-50 dark:bg-slate-900 rounded-[32px] md:rounded-[40px] border-4 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3 md:gap-4 text-slate-400 group cursor-pointer hover:border-amber-400 transition-colors">
                    <div className="p-4 md:p-6 bg-white dark:bg-slate-800 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                        <Camera size={32} className="md:w-12 md:h-12" />
                    </div>
                    <span className="font-black uppercase tracking-widest text-[10px] md:text-xs">Prendre une photo</span>
                </div>

                {/* Form */}
                <div className="space-y-4 md:space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-6 mb-1 block">Nom du produit</label>
                        <div className="relative">
                            <Wheat className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 md:w-6 md:h-6" size={20} />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Ex: Sac de Maïs"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border-4 border-slate-100 dark:border-slate-800 rounded-[28px] md:rounded-[32px] p-4 md:p-6 pl-14 md:pl-16 font-black text-xl md:text-2xl text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-all placeholder:text-slate-300"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-6 mb-1 block">Prix (CFA)</label>
                            <div className="relative">
                                <Tag className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 md:w-6 md:h-6" size={20} />
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border-4 border-slate-100 dark:border-slate-800 rounded-[28px] md:rounded-[32px] p-4 md:p-6 pl-14 md:pl-16 font-black text-xl md:text-2xl text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-6 mb-1 block">Quantité</label>
                            <div className="relative">
                                <Plus className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 md:w-6 md:h-6" size={20} />
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={quantity}
                                    onChange={e => setQuantity(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border-4 border-slate-100 dark:border-slate-800 rounded-[28px] md:rounded-[32px] p-4 md:p-6 pl-14 md:pl-16 font-black text-xl md:text-2xl text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 md:pt-8">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePublish}
                        disabled={!name || !price}
                        className="w-full bg-amber-500 disabled:bg-slate-200 text-white p-6 md:p-8 rounded-[24px] md:rounded-[35px] font-black uppercase tracking-[0.2em] text-lg md:text-xl shadow-2xl shadow-amber-200 dark:shadow-none active:scale-95 transition-all flex items-center justify-center gap-3 md:gap-4"
                    >
                        <Save size={24} className="md:w-8 md:h-8" />
                        Publier Maintenant
                    </motion.button>
                </div>
            </div>

            {/* Hint */}
            <div className="mt-8 md:mt-12 p-6 md:p-8 bg-amber-50 dark:bg-amber-900/10 rounded-[32px] md:rounded-[40px] border-2 border-amber-100 dark:border-amber-900/20 text-center">
                <p className="text-amber-800 dark:text-amber-200 font-bold italic leading-relaxed text-sm md:text-base">
                    "Une fois publié, tout le secteur verra que ton produit est disponible !"
                </p>
            </div>
        </main>
    );
}
