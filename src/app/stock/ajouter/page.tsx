'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Save, Package, CreditCard, Barcode, Camera, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { useProductContext } from '@/context/ProductContext';
import { useAssistant } from '@/hooks/useAssistant';

export default function AddProductPage() {
    const router = useRouter();
    const { addProduct } = useProductContext();
    const { speak } = useAssistant();
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        try {
            await addProduct({
                name: name.toUpperCase(),
                price: parseInt(price),
                barcode: barcode || undefined,
                imageUrl: imageUrl || undefined,
                color: 'bg-slate-50',
                iconColor: 'text-slate-600',
                audioName: name.toLowerCase(),
                icon: Package
            });
            speak(`${name} a été ajouté à votre catalogue.`);
            router.replace('/stock');
        } catch (error) {
            console.error("Erreur, impossible d'ajouter", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
            {/* Header Coloré (Card Overlap Style) */}
            <div className="bg-primary pt-8 pb-32 px-4 rounded-b-[2.5rem] relative shadow-lg">
                <div className="flex items-center gap-4 max-w-lg mx-auto mb-6">
                    <button onClick={() => router.back()} className="w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-white font-bold text-lg tracking-wide uppercase">Nouveau Produit</h1>
                        <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mt-0.5">Ajout au catalogue</p>
                    </div>
                </div>
            </div>

            {/* Main Content Overlap */}
            <main className="mt-[-60px] relative z-10 px-4 max-w-lg mx-auto">
                <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 shadow-xl border border-slate-100 dark:border-slate-800">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Photo du Produit */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-2 block">Photo du Produit</label>
                            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    ref={fileInputRef}
                                    onChange={handlePhotoCapture}
                                    className="hidden"
                                />
                                {imageUrl ? (
                                    <div className="relative w-32 h-32 rounded-xl overflow-hidden shadow-md">
                                        <img src={imageUrl} alt="Aperçu" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setImageUrl('')}
                                            className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-20 h-20 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 shadow-sm active:scale-95 transition-all"
                                    >
                                        <Camera size={32} />
                                    </button>
                                )}
                                <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-widest text-center">
                                    {imageUrl ? 'Appuyez sur la croix pour changer' : 'Appuyez pour photographier'}
                                </p>
                            </div>
                        </div>

                        {/* Informations Textuelles */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-2 block">Nom du Produit</label>
                                <div className="relative">
                                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                                    <input
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
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-2 block">Code-Barres</label>
                                <div className="relative flex gap-2">
                                    <div className="relative flex-1">
                                        <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder="Optionnel"
                                            value={barcode}
                                            onChange={e => setBarcode(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-800 rounded-xl py-4 pr-4 pl-12 font-semibold text-base text-slate-900 dark:text-white outline-none focus:border-primary transition-all placeholder:text-slate-300"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsScanning(true)}
                                        className="w-14 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all"
                                    >
                                        <Barcode size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`w-full ${isSaving ? 'bg-slate-400' : 'bg-primary'} text-white py-5 rounded-2xl font-bold uppercase tracking-wider text-sm shadow-lg active:scale-[0.98] transition-all mt-8 flex items-center justify-center gap-2`}
                        >
                            {isSaving ? 'Enregistrement...' : <><Save size={20} /> Enregistrer ce produit</>}
                        </button>
                    </form>
                </div>
            </main>

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
        </div>
    );
}
