'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Package, CreditCard, Barcode, Camera } from 'lucide-react';
import { BarcodeScanner } from './BarcodeScanner';

interface AddProductModalProps {
    onClose: () => void;
    onAdd: (product: { name: string, price: number, barcode?: string }) => Promise<void>;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({ onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [barcode, setBarcode] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !price) return;

        setIsSaving(true);
        await onAdd({
            name: name.toUpperCase(),
            price: parseInt(price),
            barcode: barcode || undefined
        });
        setIsSaving(false);
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        >
            <motion.div
                initial={{ y: 100, scale: 0.95 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 100, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[24px] sm:rounded-[32px] mt-auto sm:mt-0 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
                <div className="p-4 sm:p-6 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6 sm:mb-8">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Nouveau Produit</h2>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] mt-0.5">Ajoute un article à ton catalogue</p>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 shrink-0">
                            <X size={16} className="sm:w-5 sm:h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                        <div className="space-y-2 sm:space-y-3">
                            <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4 block">Nom du Produit</label>
                            <div className="relative">
                                <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 sm:w-6 sm:h-6" />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="EX: SAVON"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 pl-12 font-black text-sm sm:text-base text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all placeholder:text-slate-200"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2 sm:space-y-3">
                            <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4 block">Prix de Vente (FCFA)</label>
                            <div className="relative">
                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 sm:w-6 sm:h-6" />
                                <input
                                    type="number"
                                    placeholder="500"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 pl-12 font-black text-sm sm:text-base text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all placeholder:text-slate-200"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2 sm:space-y-3">
                            <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4 block">Code-Barres</label>
                            <div className="relative flex gap-2">
                                <div className="relative flex-1">
                                    <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 sm:w-6 sm:h-6" />
                                    <input
                                        type="text"
                                        placeholder="Scanner / Taper"
                                        value={barcode}
                                        onChange={e => setBarcode(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 pl-12 font-black text-sm sm:text-base text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all placeholder:text-slate-200"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsScanning(true)}
                                    className="w-12 sm:w-16 bg-blue-600 text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-all"
                                >
                                    <Camera size={20} className="sm:w-6 sm:h-6" />
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`w-full ${isSaving ? 'bg-slate-400' : 'bg-emerald-600'} text-white p-3 sm:p-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-[0.2em] text-sm sm:text-base shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 sm:gap-3 active:scale-95 transition-all mt-4 shrink-0`}
                        >
                            {isSaving ? 'Enregistrement...' : <><Save size={20} className="sm:w-6 sm:h-6" /> Enregistrer</>}
                        </button>
                    </form>
                </div>
            </motion.div>

            <AnimatePresence>
                {isScanning && (
                    <BarcodeScanner
                        onScan={(code) => {
                            setBarcode(code);
                            setIsScanning(false);
                        }}
                        onClose={() => setIsScanning(false)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};
