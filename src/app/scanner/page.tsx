'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Package, AlertCircle, ShoppingCart, Info } from 'lucide-react';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { useProductContext } from '@/context/ProductContext';
import { useStock } from '@/hooks/useStock';
import { useHistory } from '@/hooks/useHistory';
import { useVoice } from '@/hooks/useVoice';
import { StockDetailModal } from '@/components/StockDetailModal';

export default function ScannerPage() {
    const router = useRouter();
    const { products } = useProductContext();
    const { stock } = useStock();
    const { addTransaction } = useHistory();
    const { speakIfNecessary } = useVoice();

    const [scannedProduct, setScannedProduct] = useState<any>(null);
    const [isScanning, setIsScanning] = useState(true);
    const [scanError, setScanError] = useState('');
    const [showDetails, setShowDetails] = useState(false);

    // Play a beep sound (optional, assuming sound.play() logic or just visual feedback)
    const playScanSound = () => {
        try {
            const audio = new Audio('/beep.mp3'); // Add a short beep sound in public folder if possible
            audio.play().catch(() => { });
        } catch (e) {
            // ignore
        }
    };

    const handleScanSuccess = (decodedText: string) => {
        playScanSound();
        setIsScanning(false);
        setScanError('');

        // Find the product in the local DB
        const foundProduct = products.find(p => p.barcode === decodedText || p.id === decodedText);

        if (foundProduct) {
            setScannedProduct(foundProduct);
            const shortName = foundProduct.audioName.replace(/^[Ll]e\s+/, '').replace(/^[Ll]a\s+/, '').replace(/^[Ll]'\s+/, '');
            speakIfNecessary(`${shortName} trouvé. Prix : ${foundProduct.price} francs.`, 'NORMAL');
        } else {
            setScanError(`Code non reconnu : ${decodedText}`);
            speakIfNecessary("Produit non trouvé dans le catalogue.", 'HIGH');
        }
    };

    const resetScanner = () => {
        setScannedProduct(null);
        setScanError('');
        setIsScanning(true);
    };

    const handleQuickSell = () => {
        if (!scannedProduct) return;

        const currentStock = stock[scannedProduct.id] || 0;
        if (currentStock <= 0) {
            setScanError("Stock épuisé !");
            speakIfNecessary("Attention, ce produit est en rupture de stock.", 'HIGH');
            return;
        }

        // Add to history directly as a sale (simplified flow for scanner)
        addTransaction({
            type: 'VENTE',
            productId: scannedProduct.id,
            productName: scannedProduct.name,
            quantity: 1,
            price: scannedProduct.price
        });

        const shortName = scannedProduct.audioName.replace(/^[Ll]e\s+/, '').replace(/^[Ll]a\s+/, '').replace(/^[Ll]'\s+/, '');
        speakIfNecessary(`Vendu : un ${shortName}.`, 'LOW');

        // Return to scanner after 1.5s
        setTimeout(() => resetScanner(), 1500);
    };

    return (
        <main className="min-h-screen bg-slate-950 text-white flex flex-col fixed inset-0 z-50 overflow-hidden">
            {/* Header / Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex items-center justify-between z-20 bg-gradient-to-b from-slate-900/80 to-transparent">
                <button
                    onClick={() => router.back()}
                    className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white active:scale-95 transition-all"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="text-center">
                    <h1 className="text-xl font-black uppercase tracking-tight">Scanner</h1>
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Recherche Rapide</p>
                </div>
                <div className="w-12" /> {/* Spacer */}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 relative flex flex-col">

                {/* Scanner View */}
                <AnimatePresence mode="wait">
                    {isScanning && (
                        <motion.div
                            key="scanner-view"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center"
                        >
                            <div className="w-full max-w-md mx-auto aspect-square p-6 md:p-8">
                                <div className="rounded-[40px] overflow-hidden border-4 border-amber-500 shadow-2xl relative">
                                    <BarcodeScanner
                                        onScan={handleScanSuccess}
                                        onClose={() => router.back()}
                                    />
                                    {/* Scanning Line Animation overlay handled within BarcodeScanner now, or add generic one here */}
                                </div>
                                <p className="text-center mt-6 text-sm font-bold text-slate-400 uppercase tracking-widest">Placez le code-barres dans le cadre</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Status / Error Message */}
                {scanError && !scannedProduct && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-32 left-4 right-4 md:left-auto md:right-auto md:w-96 md:mx-auto bg-rose-500 text-white p-4 rounded-3xl flex items-start gap-3 shadow-2xl z-20"
                    >
                        <AlertCircle className="shrink-0" />
                        <div>
                            <p className="font-black text-sm uppercase">{scanError}</p>
                            <button onClick={resetScanner} className="text-rose-200 mt-2 text-xs font-bold uppercase underline">Réessayer</button>
                        </div>
                    </motion.div>
                )}

                {/* Results Panel - Wave Style Bottom Sheet */}
                <AnimatePresence>
                    {!isScanning && scannedProduct && (
                        <motion.div
                            key="result-view"
                            initial={{ opacity: 0, y: '100%' }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: '100%' }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[40px] p-6 pb-12 shadow-[0_-15px_50px_rgba(0,0,0,0.4)] z-30"
                        >
                            {/* Handle bars style Wave */}
                            <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-8" />

                            <div className="flex items-center gap-5 mb-8">
                                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[28px] flex items-center justify-center shrink-0 shadow-sm border border-slate-100 dark:border-slate-700">
                                    {scannedProduct.imageUrl ? (
                                        <img src={scannedProduct.imageUrl} className="w-full h-full object-contain p-2" alt="" />
                                    ) : (
                                        <Package size={36} className="text-slate-700 dark:text-slate-300" />
                                    )}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-tight">
                                        {scannedProduct.name}
                                    </h2>
                                    <p className="text-orange-500 font-black text-2xl tracking-tight">
                                        {scannedProduct.price.toLocaleString()} F
                                    </p>
                                </div>
                            </div>

                            {/* Info Card Stock style Wave */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[32px] mb-8 border border-slate-100 dark:border-slate-700/50">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">En Stock</p>
                                <p className="text-3xl font-black text-emerald-500 leading-none">
                                    {stock[scannedProduct.id] || 0}
                                </p>
                            </div>

                            <div className="flex gap-4 mb-6">
                                <button
                                    onClick={() => setShowDetails(true)}
                                    className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-[24px] font-black uppercase text-xs tracking-[0.15em] active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2"
                                >
                                    <Info size={16} />
                                    Détails
                                </button>
                                <button
                                    onClick={handleQuickSell}
                                    className="flex-[1.5] py-5 bg-primary text-white rounded-[24px] font-black uppercase text-xs tracking-[0.15em] active:scale-95 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2.5"
                                >
                                    <ShoppingCart size={18} />
                                    Vendre
                                </button>
                            </div>

                            <button
                                onClick={resetScanner}
                                className="w-full text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] active:opacity-50 transition-opacity"
                            >
                                Scanner un autre produit
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showDetails && scannedProduct && (
                    <StockDetailModal
                        product={scannedProduct}
                        currentStock={stock[scannedProduct.id] || 0}
                        onClose={() => setShowDetails(false)}
                    />
                )}
            </AnimatePresence>
        </main>
    );
}

