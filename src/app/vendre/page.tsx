'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Mic, ShoppingBag, Trash2, CheckCircle2, ShoppingCart, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ProductGrid } from '@/components/ProductGrid';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { useAssistant } from '@/hooks/useAssistant';
import { useCart } from '@/hooks/useCart';
import { useStock } from '@/hooks/useStock';
import { useHistory } from '@/hooks/useHistory';
import { useProductContext } from '@/context/ProductContext';
import { Barcode } from 'lucide-react';

export default function VendrePage() {
    const router = useRouter();
    const { products } = useProductContext();
    const { speak, listen, isSpeaking, isListening, handleAction } = useAssistant();
    const { items, addItem, removeItem, clearCart, total } = useCart();
    const { updateStock } = useStock();
    const { addTransaction } = useHistory();
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [clientName, setClientName] = useState('');
    const [paymentStatus, setPaymentStatus] = useState<'PAYÉ' | 'DETTE' | 'MOMO'>('PAYÉ');

    React.useEffect(() => {
        const handleAssistantClient = (e: any) => {
            if (e.detail?.name) {
                setClientName(e.detail.name);
            }
            if (e.detail?.status) {
                setPaymentStatus(e.detail.status);
            }
        };
        window.addEventListener('assistant-set-client', handleAssistantClient);
        return () => window.removeEventListener('assistant-set-client', handleAssistantClient);
    }, [speak]);

    const handleFinish = async () => {
        if (items.length === 0) {
            speak("Ton panier est vide, Kouamé.");
            return;
        }

        const isDebt = paymentStatus === 'DETTE';
        const isMomo = paymentStatus === 'MOMO';
        const message = isDebt
            ? `${total} francs mis en dette pour ${clientName || 'ce client'}.`
            : isMomo ? `Paiement Mobile Money de ${total} francs initié.`
                : `${total} francs. C'est vendu ${clientName ? `à ${clientName}` : ''} !`;

        speak(message);
        setShowConfirmation(true);

        // On lance les mises à jour en arrière-plan pendant l'animation
        try {
            const updates = items.map(async (item) => {
                await updateStock(item.id, -item.quantity);
                await addTransaction({
                    type: 'VENTE',
                    productId: item.id,
                    productName: item.name,
                    quantity: item.quantity,
                    price: item.price * item.quantity,
                    clientName: clientName || undefined,
                    status: paymentStatus
                });
            });

            await Promise.all(updates);

            // On attend la fin du message vocal/animation
            setTimeout(() => {
                clearCart();
                router.push('/');
            }, 6000); // 6 seconds to let user view the receipt
        } catch (err) {
            console.error("Erreur lors de la validation :", err);
            speak("Désolé Kouamé, il y a eu un petit problème technique.");
        }
    };

    const handleBarcodeScan = (barcode: string) => {
        const product = products.find(p => p.barcode === barcode);
        if (product) {
            addItem(product);
            speak(`${product.name} ajouté.`);
            // Petit feedback sonore visuel si possible (ici on a speak)
        } else {
            speak("Produit non reconnu.");
        }
        setIsScanning(false);
    };

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-3 pb-32 md:pb-64 lg:pb-40">
            {/* Header Retour */}
            <header className="flex items-center gap-3 mb-4 pt-1">
                <button
                    onClick={() => router.push('/')}
                    className="w-9 h-9 md:w-12 md:h-12 bg-white dark:bg-slate-800 rounded-full shadow-md flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-95 transition-all"
                >
                    <ChevronLeft size={20} className="md:w-8 md:h-8" />
                </button>
                <h1 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Vendre</h1>

                <button
                    onClick={() => setIsScanning(true)}
                    className="ml-auto flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 md:py-2.5 rounded-lg md:rounded-2xl font-black text-[9px] md:text-xs uppercase shadow-lg shadow-blue-100 dark:shadow-none active:scale-95 transition-all"
                >
                    <Barcode size={14} className="md:w-[18px] md:h-[18px]" />
                    <span className="hidden sm:inline">Scanner</span>
                    <span className="sm:hidden">SCAN</span>
                </button>
            </header>

            <AnimatePresence>
                {isScanning && (
                    <BarcodeScanner
                        onScan={handleBarcodeScan}
                        onClose={() => setIsScanning(false)}
                    />
                )}
            </AnimatePresence>

            {/* Conteneur principal adaptatif */}
            <div className="flex flex-col lg:flex-row gap-6 md:gap-8 items-start max-w-7xl mx-auto">
                {/* Section Gauche : Résumé Panier (Visuel) - Fixé sur Desktop */}
                <section className="w-full lg:w-96 lg:sticky lg:top-24 bg-white dark:bg-slate-900 rounded-[24px] md:rounded-[32px] p-4 md:p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-3 gap-2">
                        <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] md:text-sm whitespace-nowrap">Panier</span>
                        {clientName && (
                            <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full text-[8px] md:text-xs font-black uppercase flex items-center gap-1 min-w-0">
                                <span className="truncate">Client: {clientName}</span>
                            </div>
                        )}
                        {items.length > 0 && (
                            <button onClick={clearCart} className="text-red-500 font-bold text-[9px] md:text-sm flex items-center gap-1 text-right whitespace-nowrap shrink-0">
                                <Trash2 size={12} className="md:w-4 md:h-4" /> VIDER
                            </button>
                        )}
                    </div>

                    {items.length === 0 ? (
                        <div className="py-6 md:py-8 text-center text-slate-300 font-bold uppercase italic text-xs md:text-sm">
                            Appuie sur les produits
                        </div>
                    ) : (
                        <div className="space-y-2 md:space-y-3 max-h-[30vh] lg:max-h-[50vh] overflow-y-auto pr-2 scrollbar-none">
                            {items.map(item => (
                                <div key={item.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl gap-3">
                                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                        <div className="relative w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm flex items-center justify-center border border-slate-100 dark:border-slate-700 shrink-0">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} className="w-full h-full object-contain" alt="" />
                                            ) : (
                                                <ShoppingBag size={18} className="text-slate-300" />
                                            )}
                                            <div className="absolute top-0 right-0 bg-blue-500 text-white text-[9px] md:text-[10px] font-black w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-bl-lg">
                                                {item.quantity}
                                            </div>
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-black text-slate-800 dark:text-slate-100 uppercase text-[10px] md:text-xs leading-tight truncate">{item.name}</span>
                                            <span className="text-[9px] md:text-[10px] font-bold text-slate-400">{item.price} F / u</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 md:gap-4 shrink-0">
                                        <span className="font-black text-slate-900 dark:text-white text-xs md:text-sm">{item.price * item.quantity} F</span>
                                        <button onClick={() => removeItem(item.id)} className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors">✕</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-3 md:mt-6 pt-3 md:pt-6 border-t-2 md:border-t-4 border-slate-50 dark:border-slate-800 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <span className="text-base md:text-xl font-black text-slate-400 uppercase tracking-tighter">TOTAL</span>
                            <span className="text-xl md:text-3xl font-black text-emerald-600">{total} F</span>
                        </div>

                        <div className="flex gap-1.5 md:gap-2">
                            <button
                                onClick={() => setPaymentStatus('PAYÉ')}
                                className={`flex-1 py-2.5 rounded-lg md:rounded-2xl font-black text-[8px] md:text-xs uppercase tracking-widest border-2 transition-all ${paymentStatus === 'PAYÉ' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}
                            >
                                Cash
                            </button>
                            <button
                                onClick={() => setPaymentStatus('MOMO')}
                                className={`flex-1 py-2.5 rounded-lg md:rounded-2xl font-black text-center text-[8px] md:text-xs uppercase tracking-widest border-2 transition-all ${paymentStatus === 'MOMO' ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}
                            >
                                MOMO
                            </button>
                            <button
                                onClick={() => setPaymentStatus('DETTE')}
                                className={`flex-1 py-2.5 rounded-lg md:rounded-2xl font-black text-center text-[8px] md:text-xs uppercase tracking-widest border-2 transition-all ${paymentStatus === 'DETTE' ? 'bg-red-600 border-red-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}
                            >
                                Dette
                            </button>
                        </div>
                    </div>
                </section>

                {/* Section Droite : Grille de Produits */}
                <div className="flex-1 w-full">
                    <ProductGrid onAdd={addItem} onSpeak={speak} />
                </div>
            </div>

            {/* Actions Fixes adaptatifs */}
            <div className="fixed bottom-6 left-0 right-0 px-4 md:px-6 flex items-center justify-center z-50 pointer-events-none">
                <div className="flex items-center gap-3 md:gap-4 w-full max-w-2xl pointer-events-auto">
                    {/* Micro */}
                    <button
                        onClick={handleAction}
                        className={`h-20 w-20 md:h-28 md:w-28 shrink-0 rounded-full flex items-center justify-center shadow-2xl border-4 border-white dark:border-slate-900 transition-all ${isListening ? 'bg-red-500 scale-105 md:scale-110 animate-pulse' : isSpeaking ? 'bg-blue-500' : 'bg-amber-500 active:bg-amber-600'}`}
                    >
                        <Mic size={28} className="md:w-8 md:h-8 md:scale-110" color="white" fill={isListening || isSpeaking ? "white" : "none"} />
                    </button>

                    {/* Bouton Valider */}
                    <button
                        onClick={handleFinish}
                        className="flex-1 h-20 md:h-28 bg-emerald-600 rounded-[24px] md:rounded-[45px] shadow-2xl text-white flex items-center justify-center gap-2 md:gap-3 border-4 border-white dark:border-slate-900 active:bg-emerald-700 transition-all overflow-hidden"
                    >
                        <CheckCircle2 size={24} className="md:w-7 md:h-7 md:scale-110" />
                        <span className="text-lg md:text-3xl font-black uppercase tracking-tighter">C'EST FINI</span>
                    </button>
                </div>
            </div>

            {/* Overlay de Confirmation Success - Reçu Numérique */}
            <AnimatePresence>
                {showConfirmation && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            transition={{ type: "spring", damping: 15 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[35px] overflow-hidden shadow-2xl relative border-4 border-slate-100 dark:border-slate-800"
                        >
                            {/* Receipt Header */}
                            <div className="bg-emerald-500 p-8 text-center text-white">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1, rotate: 360 }}
                                    transition={{ type: "spring", damping: 10, delay: 0.2 }}
                                    className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm"
                                >
                                    <CheckCircle2 size={40} className="text-white" />
                                </motion.div>
                                <h2 className="text-2xl font-black uppercase tracking-widest mb-1">Paiement Réussi</h2>
                                <p className="text-xs font-bold uppercase tracking-widest opacity-80">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>

                            {/* Ticket ZigZag border simulation */}
                            <div className="h-4 bg-emerald-500 w-full relative" style={{ backgroundImage: 'radial-gradient(circle at 10px 0, transparent 10px, white 11px)', backgroundSize: '20px 20px', backgroundRepeat: 'repeat-x', top: '-2px' }} />

                            {/* Receipt Content */}
                            <div className="p-6 md:p-8 pt-4 space-y-4 md:space-y-6">
                                <div className="text-center">
                                    <span className="block text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Montant Total</span>
                                    <span className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{total} <span className="text-xl md:text-2xl opacity-50">F</span></span>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm font-bold border-b border-dashed border-slate-200 dark:border-slate-800 pb-3">
                                        <span className="text-slate-400 uppercase tracking-widest">Mode</span>
                                        <span className="text-slate-900 dark:text-white uppercase tracking-widest">
                                            {paymentStatus === 'MOMO' ? 'Mobile Money' : paymentStatus === 'DETTE' ? 'Crédit' : 'Espèces'}
                                        </span>
                                    </div>
                                    {clientName && (
                                        <div className="flex justify-between items-center text-sm font-bold border-b border-dashed border-slate-200 dark:border-slate-800 pb-3">
                                            <span className="text-slate-400 uppercase tracking-widest">Client</span>
                                            <span className="text-slate-900 dark:text-white uppercase tracking-widest">{clientName}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center text-sm font-bold">
                                        <span className="text-slate-400 uppercase tracking-widest">Articles</span>
                                        <span className="text-slate-900 dark:text-white uppercase tracking-widest">{items.length} produit(s)</span>
                                    </div>
                                </div>

                                <button
                                    className="w-full py-4 mt-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest rounded-2xl flex justify-center items-center gap-2 active:scale-95 transition-all"
                                >
                                    Partager le reçu
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
