'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, PhoneCall, ShoppingCart, CheckCircle2, MapPin, Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useVoice } from '@/hooks/useVoice';
import { SUPPLIERS } from '@/data/suppliers';

export default function OrderSupplierPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const router = useRouter();
    const { speak } = useVoice();
    const [orderQuantity, setOrderQuantity] = useState(1);
    const [orderSuccess, setOrderSuccess] = useState(false);

    const supplier = SUPPLIERS.find(s => s.id.toString() === id);

    if (!supplier) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
                <p className="text-xl font-bold text-slate-500">Fournisseur introuvable.</p>
                <button onClick={() => router.back()} className="mt-4 px-6 py-3 bg-primary text-white rounded-full font-bold shadow-lg">Retour</button>
            </div>
        );
    }

    const handleOrder = () => {
        // speak(`Commande...`); - SILENCED Mission 1
        setOrderSuccess(true);
        setTimeout(() => {
            router.push('/approvisionnement');
        }, 4000);
    };

    if (orderSuccess) {
        return (
            <main className="min-h-screen bg-blue-600 flex flex-col items-center justify-center text-white p-8 text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12 }}
                >
                    <CheckCircle2 size={120} strokeWidth={3} />
                </motion.div>
                <h2 className="text-5xl font-black mt-8 mb-4 uppercase leading-none">Commandé !</h2>
                <p className="text-xl font-bold opacity-80 uppercase tracking-widest">Le fournisseur vous contactera pour la livraison.</p>
            </main>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
            {/* Header Coloré (Card Overlap Style) */}
            <div className="bg-primary pt-8 pb-32 px-4 rounded-b-[2.5rem] relative shadow-lg">
                <div className="flex justify-between items-center max-w-lg mx-auto mb-6">
                    <button onClick={() => router.back()} className="w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="text-center flex-1 pr-10">
                        <h1 className="text-white font-bold text-lg tracking-wide uppercase">Détails Commande</h1>
                        <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mt-0.5">Marché Virtuel / Acheter</p>
                    </div>
                </div>
            </div>

            {/* Main Content Overlap */}
            <main className="mt-[-60px] relative z-10 px-4 max-w-lg mx-auto space-y-4">
                <div className="bg-white dark:bg-slate-900 w-full max-w-lg mx-auto rounded-[32px] p-6 shadow-xl relative border border-slate-100 dark:border-slate-800">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-20 h-20 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-[20px] flex items-center justify-center shrink-0 overflow-hidden border border-blue-100 dark:border-slate-700 shadow-sm">
                            {supplier.imageUrl ? (
                                <img src={supplier.imageUrl} alt={supplier.product} className="w-full h-full object-contain p-1" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                            ) : null}
                            <div className={supplier.imageUrl ? "hidden" : ""}>
                                <Truck size={32} />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                            <h2 className="text-2xl font-black uppercase text-slate-900 dark:text-white mb-1 leading-tight">{supplier.product}</h2>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-1"><MapPin size={12} /> {supplier.name} • {supplier.distance}</p>
                            <span className="inline-block px-3 py-1 bg-blue-50 dark:bg-slate-800 text-blue-600 border border-blue-200 dark:border-slate-700 rounded-full text-xs font-black uppercase tracking-widest">Stock dispo: {supplier.stock}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 mb-6 bg-slate-50 dark:bg-slate-800 p-5 rounded-[24px] border border-slate-100 dark:border-slate-700">
                        <span className="font-black text-slate-400 text-xs uppercase tracking-widest">Quantité <br />({supplier.unit})</span>
                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                                className="w-12 h-12 bg-white dark:bg-slate-700 rounded-full shadow-sm flex items-center justify-center text-xl font-black text-slate-900 dark:text-white active:scale-95 border border-slate-100 dark:border-slate-600"
                            >-</button>
                            <span className="text-3xl font-black text-slate-900 dark:text-white w-12 text-center">{orderQuantity}</span>
                            <button
                                onClick={() => setOrderQuantity(Math.min(supplier.stock, orderQuantity + 1))}
                                className="w-12 h-12 bg-white dark:bg-slate-700 rounded-full shadow-sm flex items-center justify-center text-xl font-black text-slate-900 dark:text-white active:scale-95 border border-slate-100 dark:border-slate-600"
                            >+</button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-8 px-2">
                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Total à payer :</span>
                        <div className="text-right">
                            <span className="text-4xl font-black text-emerald-600 leading-none block">{supplier.price * orderQuantity} F</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{supplier.price} F / {supplier.unit}</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button className="flex-1 py-4 sm:py-5 rounded-[20px] sm:rounded-[24px] border-[3px] sm:border-4 border-slate-100 dark:border-slate-700 font-bold text-xs uppercase tracking-widest text-slate-500 flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all">
                            <PhoneCall size={18} /> Appeler
                        </button>
                        <button
                            onClick={handleOrder}
                            className="flex-[2] py-4 sm:py-5 bg-primary text-white rounded-[20px] sm:rounded-[24px] shadow-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <ShoppingCart size={18} /> Confirmer
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
