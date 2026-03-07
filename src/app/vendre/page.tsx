'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Mic, ShoppingBag, Trash2, CheckCircle2, ShoppingCart, Smartphone, Landmark, Banknote, Barcode, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ProductGrid } from '@/components/ProductGrid';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { useAssistant } from '@/hooks/useAssistant';
import { useCart } from '@/hooks/useCart';
import { useStock } from '@/hooks/useStock';
import { useHistory } from '@/hooks/useHistory';
import { useProductContext } from '@/context/ProductContext';
import { useAuth } from '@/context/AuthContext';

export default function VendrePage() {
    const router = useRouter();
    const { products } = useProductContext();
    const { speakIfNecessary, isSpeaking, isListening, handleAction } = useAssistant();
    const { items, addItem, removeItem, clearCart, total } = useCart();
    const { updateStock } = useStock();
    const { addTransaction } = useHistory();
    const { user } = useAuth();
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [clientName, setClientName] = useState('');
    const [paymentStatus, setPaymentStatus] = useState<'PAYÉ' | 'DETTE' | 'MOMO'>('PAYÉ');
    const lastScanRef = React.useRef<{ code: string, time: number } | null>(null);

    const handleFinish = async () => {
        if (items.length === 0) {
            speakIfNecessary(`Ton panier est vide, ${user?.name?.split(' ')[0] || 'Marchand'}.`, 'LOW');
            return;
        }

        const isDebt = paymentStatus === 'DETTE';
        const isMomo = paymentStatus === 'MOMO';
        // speakIfNecessary(message, 'NORMAL'); - SILENCED PER MISSION 1
        setShowConfirmation(true);

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

            setTimeout(() => {
                clearCart();
                setClientName('');
                setPaymentStatus('PAYÉ');
                setShowConfirmation(false);
            }, 3000);
        } catch (err) {
            console.error("Erreur lors de la validation :", err);
            speakIfNecessary(`Désolé ${user?.name?.split(' ')[0] || 'Marchand'}, il y a eu un petit problème technique.`, 'HIGH');
        }
    };

    React.useEffect(() => {
        const handleAssistantClient = (e: any) => {
            if (e.detail?.name) {
                setClientName(e.detail.name);
            }
            if (e.detail?.status) {
                setPaymentStatus(e.detail.status);
            }
        };

        const handleAssistantFinish = () => {
            handleFinish();
        };

        window.addEventListener('assistant-set-client', handleAssistantClient);
        window.addEventListener('assistant-finish-sale', handleAssistantFinish);
        return () => {
            window.removeEventListener('assistant-set-client', handleAssistantClient);
            window.removeEventListener('assistant-finish-sale', handleAssistantFinish);
        };
    }, [speakIfNecessary, items, clientName, paymentStatus, handleFinish]);

    const handleBarcodeScan = (barcode: string) => {
        const now = Date.now();
        if (lastScanRef.current && lastScanRef.current.code === barcode && (now - lastScanRef.current.time) < 2000) {
            return;
        }
        lastScanRef.current = { code: barcode, time: now };

        const product = products.find(p => p.barcode === barcode);
        if (product) {
            addItem(product);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32 font-sans">
            {/* Header Vert Type Wave CI */}
            <div className="bg-primary pt-8 pb-32 px-4 rounded-b-[2.5rem] relative shadow-lg">
                {/* Navbar */}
                <div className="flex justify-between items-center mb-8 max-w-lg mx-auto">
                    <button onClick={() => router.push('/commercant')} className="w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 dark:bg-emerald-700" />
                        <div className="w-2 h-2 rounded-full bg-emerald-300 dark:bg-emerald-700" />
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 dark:bg-emerald-700" />
                    </div>
                    <button onClick={() => setIsScanning(true)} className="w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center active:scale-95 transition-transform relative shadow-sm">
                        <Barcode size={20} />
                        {items.length > 0 && (
                            <div className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full border-2 border-primary" />
                        )}
                    </button>
                </div>

                {/* Total du panier */}
                <div className="text-center px-4">
                    <p className="text-emerald-100 font-bold text-[10px] uppercase tracking-widest mb-1">TOTAL À PAYER</p>
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-5xl sm:text-6xl font-black text-white tracking-tighter">
                            {total.toLocaleString('fr-FR')}
                        </span>
                        <span className="text-2xl text-emerald-200 font-bold mt-2">F</span>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isScanning && (
                    <BarcodeScanner
                        onScan={handleBarcodeScan}
                        onClose={() => setIsScanning(false)}
                    />
                )}
            </AnimatePresence>

            {/* Conteneur principal (Overlaps the header) */}
            <div className="px-4 max-w-lg mx-auto relative -mt-20 z-10 flex flex-col gap-6">

                {/* Carte Overlap : Le Panier */}
                <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-xl w-full border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex flex-col">
                            <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-widest">Contenu du Panier</h3>
                            {clientName && <span className="text-emerald-500 text-[10px] font-bold mt-0.5">CLIENT: {clientName}</span>}
                        </div>
                        {items.length > 0 && (
                            <button onClick={clearCart} className="text-rose-500 hover:text-rose-600 font-bold text-[10px] uppercase tracking-wider bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 rounded-full active:scale-95 transition-all">
                                Vider tout
                            </button>
                        )}
                    </div>

                    {/* Liste des articles */}
                    {items.length === 0 ? (
                        <div className="py-10 text-center text-slate-400">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full mx-auto flex items-center justify-center mb-3">
                                <ShoppingCart size={24} className="opacity-50" />
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest">Le panier est vide</p>
                            <p className="text-[9px] mt-1 opacity-70">Ajoute des produits via le catalogue</p>
                        </div>
                    ) : (
                        <div className="max-h-[35vh] overflow-y-auto space-y-4 pr-1 scrollbar-none mb-6">
                            {items.map(item => (
                                <div key={item.id} className="flex justify-between items-center group bg-slate-50/50 dark:bg-slate-800/50 p-3 rounded-2xl border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="relative w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} className="w-full h-full object-cover rounded-xl" alt="" />
                                            ) : (
                                                <ShoppingBag size={18} className="text-slate-400" />
                                            )}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-bold text-slate-900 dark:text-white text-[11px] leading-tight truncate uppercase tracking-tight">{item.name}</span>
                                            <span className="text-[9px] font-bold text-slate-400 mt-0.5">{item.price} F</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        {/* Contrôles de quantité */}
                                        <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-1">
                                            <button
                                                onClick={() => item.quantity > 1 ? addItem(item, -1) : removeItem(item.id)}
                                                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-500 active:scale-90 transition-all"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                            <span className="w-8 text-center font-black text-xs text-slate-900 dark:text-white">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => addItem(item, 1)}
                                                className="w-7 h-7 flex items-center justify-center text-primary hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg active:scale-90 transition-all"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>

                                        <div className="text-right min-w-[60px]">
                                            <p className="font-black text-slate-900 dark:text-white text-xs leading-none">{item.price * item.quantity} F</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Sélecteur de Paiement (Style Toggle Wave) */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-5 mt-2">
                        <p className="font-bold text-slate-400 text-[10px] uppercase tracking-widest mb-3 text-center">Choix du Règlement</p>
                        <div className="flex gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full border border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => setPaymentStatus('PAYÉ')}
                                className={`flex-1 py-3 px-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex flex-col items-center gap-1.5 ${paymentStatus === 'PAYÉ' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500'}`}
                            >
                                <Banknote size={16} /> CASH
                            </button>
                            <button
                                onClick={() => setPaymentStatus('MOMO')}
                                className={`flex-1 py-3 px-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex flex-col items-center gap-1.5 ${paymentStatus === 'MOMO' ? 'bg-white dark:bg-slate-700 text-yellow-500 shadow-sm' : 'text-slate-500'}`}
                            >
                                <Smartphone size={16} /> MOMO
                            </button>
                            <button
                                onClick={() => setPaymentStatus('DETTE')}
                                className={`flex-1 py-3 px-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex flex-col items-center gap-1.5 ${paymentStatus === 'DETTE' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
                            >
                                <Landmark size={16} /> CRÉDIT
                            </button>
                        </div>
                    </div>
                </div>

                {/* Grille des Produits du Catalogue */}
                <div className="w-full mt-2">
                    <ProductGrid onAdd={addItem} onSpeak={() => { }} />
                </div>
            </div>

            {/* Actions Fixes Flottantes (Validation) */}
            <div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-50 pointer-events-none">
                <div className="flex items-center gap-3 w-full max-w-lg pointer-events-auto bg-white dark:bg-slate-900 p-2 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-xl">
                    <button
                        onClick={handleAction}
                        className={`h-14 w-14 shrink-0 rounded-full flex items-center justify-center shadow-md transition-all ${isListening ? 'bg-rose-500' : 'bg-slate-900 border-2 border-slate-800'}`}
                    >
                        <Mic size={24} color="white" fill={isListening || isSpeaking ? "white" : "none"} />
                    </button>

                    <button
                        onClick={handleFinish}
                        className="flex-1 h-14 bg-primary rounded-[20px] shadow-md text-white flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
                    >
                        <CheckCircle2 size={20} />
                        <span className="text-sm font-bold uppercase tracking-widest">Confirmer l'Action</span>
                    </button>
                </div>
            </div>

            {/* Overlay de Confirmation Success - Reçu */}
            <AnimatePresence>
                {showConfirmation && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900 z-[100] flex flex-col items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl relative"
                        >
                            <div className="bg-primary p-8 text-center text-white relative">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-16 h-16 bg-white text-primary shadow-sm rounded-full flex items-center justify-center mx-auto mb-4"
                                >
                                    <CheckCircle2 size={32} />
                                </motion.div>
                                <h2 className="text-xl font-bold uppercase tracking-wider mb-1">Paiement Validé</h2>
                            </div>

                            <div className="p-8 pt-6 space-y-6">
                                <div className="text-center">
                                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Montant Payé</span>
                                    <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{total} <span className="text-2xl opacity-50">F</span></span>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-xs font-bold border-b border-dashed border-slate-200 dark:border-slate-800 pb-3">
                                        <span className="text-slate-400 uppercase tracking-widest">Mode</span>
                                        <span className="text-slate-900 dark:text-white uppercase tracking-widest">
                                            {paymentStatus === 'MOMO' ? 'Mobile Money' : paymentStatus === 'DETTE' ? 'Crédit' : 'Espèces'}
                                            {clientName ? ` (${clientName})` : ''}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-bold border-b border-dashed border-slate-200 dark:border-slate-800 pb-3">
                                        <span className="text-slate-400 uppercase tracking-widest">Articles</span>
                                        <span className="text-slate-900 dark:text-white uppercase tracking-widest">{items.length} produit(s)</span>
                                    </div>
                                </div>

                                <button className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-widest rounded-2xl active:scale-95 transition-all">
                                    Voir le détail
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
