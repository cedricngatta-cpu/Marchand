'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Package, CreditCard, Barcode, Camera } from 'lucide-react';
import { BarcodeScanner } from './BarcodeScanner';

interface AddProductModalProps {
    onClose: () => void;
    onAdd: (product: { name: string, price: number, barcode?: string, imageUrl?: string }) => Promise<void>;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({ onClose, onAdd }) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [barcode, setBarcode] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !price) return;

        setIsSaving(true);
        await onAdd({
            name: name.toUpperCase(),
            price: parseInt(price),
            barcode: barcode || undefined,
            imageUrl: imageUrl || undefined
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
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800"
            >
                <div className="p-6 overflow-y-auto">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Nouveau Produit</h2>
                            <p className="text-slate-400 font-medium text-xs mt-1">Ajoutez un article à votre catalogue</p>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-2 block">Nom du Produit</label>
                            <div className="relative">
                                <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Ex: Savon de Marseille"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-800 rounded-xl py-4 pr-4 pl-12 font-semibold text-base text-slate-900 dark:text-white outline-none focus:border-primary transition-all placeholder:text-slate-300"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-2 block">Prix de Vente (FCFA)</label>
                            <div className="relative">
                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-800 rounded-xl py-4 pr-4 pl-12 font-semibold text-base text-slate-900 dark:text-white outline-none focus:border-primary transition-all placeholder:text-slate-300"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-2 block">Code-Barres (Optionnel)</label>
                            <div className="relative flex gap-2">
                                <div className="relative flex-1">
                                    <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Scanner ou taper"
                                        value={barcode}
                                        onChange={e => setBarcode(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-800 rounded-xl py-4 pr-4 pl-12 font-semibold text-base text-slate-900 dark:text-white outline-none focus:border-primary transition-all placeholder:text-slate-300"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsScanning(true)}
                                    className="w-14 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-all outline-none focus:outline-none border border-slate-200"
                                >
                                    <Barcode size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Champ Prise de Photo */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-2 block">Photo du Produit (Optionnel)</label>
                            <div className="flex gap-4 items-center">
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    ref={fileInputRef}
                                    onChange={handlePhotoCapture}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex-1 bg-slate-50 dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-800 rounded-xl py-4 font-semibold text-sm text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
                                >
                                    <Camera size={20} className={imageUrl ? "text-emerald-500" : "text-slate-400"} />
                                    {imageUrl ? 'Photo capturée ! (Réessayer)' : 'Prendre une photo'}
                                </button>
                                {imageUrl && (
                                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                                        <img src={imageUrl} alt="Aperçu" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`w-full ${isSaving ? 'bg-slate-400' : 'bg-primary'} text-white p-4 rounded-xl font-bold uppercase tracking-wider text-sm shadow-md active:scale-[0.98] transition-all mt-6 flex items-center justify-center gap-2`}
                        >
                            {isSaving ? 'Enregistrement...' : <><Save size={20} /> Enregistrer le produit</>}
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
