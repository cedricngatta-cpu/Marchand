'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, MapPin, Truck, PhoneCall, Star, CheckCircle2, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useVoice } from '@/hooks/useVoice';

// Mock data for producers/suppliers
const SUPPLIERS = [
    { id: 1, name: 'Coopérative N\'Zassa', product: 'Tomates Fraîches', price: 2500, unit: 'Bassine', stock: 50, distance: '2 km', rating: 4.8, type: 'PRODUCER' },
    { id: 2, name: 'Ferme Bamba', product: 'Oignons', price: 15000, unit: 'Sac (25kg)', stock: 20, distance: '5 km', rating: 4.5, type: 'PRODUCER' },
    { id: 3, name: 'Grossiste Diallo', product: 'Riz Local', price: 18000, unit: 'Sac (50kg)', stock: 100, distance: '1 km', rating: 4.9, type: 'WHOLESALER' },
    { id: 4, name: 'Plantation Koné', product: 'Banane Plantain', price: 3000, unit: 'Régime', stock: 15, distance: '8 km', rating: 4.2, type: 'PRODUCER' },
];

export default function ApprovisionnementPage() {
    const router = useRouter();
    const { speak } = useVoice();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);
    const [orderQuantity, setOrderQuantity] = useState(1);
    const [orderSuccess, setOrderSuccess] = useState(false);

    const filteredSuppliers = SUPPLIERS.filter(s =>
        s.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleOrder = () => {
        if (!selectedSupplier) return;

        speak(`Commande de ${orderQuantity} ${selectedSupplier.unit} de ${selectedSupplier.product} envoyée à ${selectedSupplier.name}.`);
        setOrderSuccess(true);
        setTimeout(() => {
            setOrderSuccess(false);
            setSelectedSupplier(null);
            setOrderQuantity(1);
        }, 4000);
    };

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-3 md:p-6 pb-32 max-w-5xl mx-auto">
            {/* Header */}
            <header className="flex items-center gap-2 md:gap-4 mb-4 md:mb-8 pt-2">
                <button
                    onClick={() => router.back()}
                    className="w-9 h-9 md:w-12 md:h-12 bg-white dark:bg-slate-800 rounded-lg md:rounded-2xl flex items-center justify-center shadow-sm text-slate-600 dark:text-slate-300 active:scale-90 transition-all border border-slate-100 dark:border-slate-800 shrink-0"
                >
                    <ArrowLeft size={20} className="w-6 h-6 md:w-7 md:h-7" />
                </button>
                <div className="min-w-0">
                    <h1 className="text-lg md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none truncate">Marché Virtuel</h1>
                    <p className="text-blue-600 font-bold text-[8px] md:text-[11px] uppercase tracking-widest mt-0.5 truncate">Trouver des fournisseurs</p>
                </div>
            </header>

            {/* Search Bar */}
            <div className="relative mb-4 md:mb-8">
                <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 md:w-6 md:h-6" />
                <input
                    type="text"
                    placeholder="Chercher Tomate, Riz..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 md:h-16 bg-white dark:bg-slate-900 border-2 md:border-4 border-slate-100 dark:border-slate-800 rounded-xl md:rounded-[32px] pl-10 md:pl-16 pr-4 md:pr-6 font-black text-xs md:text-lg text-slate-900 dark:text-white shadow-sm outline-none focus:border-blue-500 transition-all uppercase placeholder:text-slate-200"
                />
            </div>

            {/* Supplier List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {filteredSuppliers.map(supplier => (
                    <motion.div
                        key={supplier.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedSupplier(supplier)}
                        className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-[24px] md:rounded-[35px] border-2 border-slate-100 dark:border-slate-800 flex flex-col gap-4 shadow-sm cursor-pointer hover:border-blue-200 transition-colors"
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-[14px] md:rounded-2xl flex items-center justify-center shrink-0">
                                    <Truck size={24} className="md:w-8 md:h-8" />
                                </div>
                                <div className="min-w-0 pr-2">
                                    <h3 className="font-black text-slate-900 dark:text-white uppercase leading-tight text-sm md:text-base truncate">{supplier.product}</h3>
                                    <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest truncate">{supplier.name}</p>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="font-black text-base md:text-xl text-emerald-600 whitespace-nowrap">{supplier.price} F</div>
                                <div className="text-[9px] md:text-[10px] items-center text-slate-400 font-bold uppercase tracking-widest whitespace-nowrap">/ {supplier.unit}</div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest pt-3 md:pt-4 border-t-2 border-slate-50 dark:border-slate-800">
                            <div className="flex items-center gap-1 text-slate-400">
                                <MapPin size={12} className="md:w-[14px] md:h-[14px]" /> {supplier.distance}
                            </div>
                            <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2 md:px-3 py-0.5 md:py-1 rounded-full">
                                <Star size={12} className="md:w-[14px] md:h-[14px]" fill="currentColor" />
                                <span className="font-black">{supplier.rating}</span>
                                <span className="text-[7px] md:text-[8px] opacity-60 ml-0.5 md:ml-1 hidden sm:inline">SCORE</span>
                            </div>
                            <div className="flex items-center gap-1 text-blue-500 ml-auto">
                                Stock: {supplier.stock}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Order Modal */}
            <AnimatePresence>
                {selectedSupplier && !orderSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex flex-col justify-end p-4"
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-lg mx-auto rounded-[32px] md:rounded-[40px] p-6 md:p-8 shadow-2xl relative"
                        >
                            <button
                                onClick={() => setSelectedSupplier(null)}
                                className="absolute top-4 right-4 md:top-6 md:right-6 w-8 h-8 md:w-10 md:h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 active:scale-90 transition-transform"
                            >
                                ✕
                            </button>

                            <h2 className="text-xl md:text-2xl font-black uppercase text-slate-900 dark:text-white mb-1 md:mb-2 pr-10">{selectedSupplier.product}</h2>
                            <p className="text-slate-400 font-bold text-xs md:text-sm uppercase tracking-widest mb-6 md:mb-8">{selectedSupplier.name}</p>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8 bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-[20px] md:rounded-[24px]">
                                <span className="font-black text-slate-400 text-xs md:text-sm uppercase tracking-widest">Quantité ({selectedSupplier.unit})</span>
                                <div className="flex items-center justify-center gap-4 md:gap-6">
                                    <button
                                        onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                                        className="w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-slate-700 rounded-full shadow-sm flex items-center justify-center text-lg md:text-xl font-black text-slate-900 dark:text-white active:scale-95"
                                    >-</button>
                                    <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white w-8 text-center">{orderQuantity}</span>
                                    <button
                                        onClick={() => setOrderQuantity(Math.min(selectedSupplier.stock, orderQuantity + 1))}
                                        className="w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-slate-700 rounded-full shadow-sm flex items-center justify-center text-lg md:text-xl font-black text-slate-900 dark:text-white active:scale-95"
                                    >+</button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-6 md:mb-8">
                                <span className="text-base md:text-lg font-black text-slate-400 uppercase">Total :</span>
                                <span className="text-3xl md:text-4xl font-black text-emerald-600">{selectedSupplier.price * orderQuantity} F</span>
                            </div>

                            <div className="flex gap-3 md:gap-4">
                                <button className="flex-1 py-4 md:py-5 rounded-[20px] md:rounded-[24px] border-[3px] md:border-4 border-slate-100 dark:border-slate-800 font-black text-[10px] md:text-xs uppercase tracking-widest text-slate-400 flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all">
                                    <PhoneCall size={16} className="md:w-[18px] md:h-[18px]" /> <span className="hidden sm:inline">Appeler</span>
                                </button>
                                <button
                                    onClick={handleOrder}
                                    className="flex-[2] py-4 md:py-5 bg-blue-600 text-white rounded-[20px] md:rounded-[24px] shadow-xl shadow-blue-200 dark:shadow-none font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform"
                                >
                                    <ShoppingCart size={16} className="md:w-[18px] md:h-[18px]" /> Commander
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Success Overlay */}
                {orderSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-blue-600 z-[100] flex flex-col items-center justify-center text-white p-8 text-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", damping: 12 }}
                        >
                            <CheckCircle2 size={120} strokeWidth={3} />
                        </motion.div>
                        <h2 className="text-5xl font-black mt-8 mb-4 uppercase leading-none">Commandé !</h2>
                        <p className="text-xl font-bold opacity-80 uppercase tracking-widest">Le fournisseur vous contactera pour la livraison.</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
