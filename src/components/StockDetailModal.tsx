'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, TrendingUp, Info, Volume2, Clock, ShoppingBag, PlusCircle, MinusCircle } from 'lucide-react';
import { useVoice } from '@/hooks/useVoice';
import { useHistory } from '@/hooks/useHistory';
import { useAuth } from '@/context/AuthContext';

interface StockDetailModalProps {
    product: any;
    currentStock: number;
    onClose: () => void;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({
    product,
    currentStock,
    onClose
}) => {
    const { speakIfNecessary } = useVoice();
    const { getProductHistory } = useHistory();
    const { user } = useAuth();
    const name = user?.name?.split(' ')[0] || 'Marchand';
    const capitalValue = (currentStock * product.price);

    const productHistory = getProductHistory(product.id).slice(0, 3);

    const announceCapital = () => {
        speakIfNecessary(`Ce produit représente ${capitalValue} francs de ton capital marchand actuel, ${name}.`, 'NORMAL', true);
    };

    useEffect(() => {
        announceCapital();
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-slate-950 z-[200] flex items-end sm:items-center justify-center p-4"
        >
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="bg-white w-full max-w-lg rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800"
            >
                <div className={`p-6 ${product.color} flex justify-between items-center shrink-0`}>
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`p-2.5 rounded-xl bg-white shadow-sm border border-slate-100 ${product.iconColor} shrink-0`}>
                            <product.icon size={26} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight truncate">{product.name}</h2>
                    </div>
                    <button onClick={onClose} className="bg-white shadow-sm border border-slate-100 p-2 rounded-xl text-slate-600 active:scale-95 transition-transform shrink-0 ml-4">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1 tracking-wider">Prix Unité</span>
                            <span className="text-lg font-bold text-slate-800 tracking-tight truncate">{product.price} F</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1 tracking-wider">Valeur Stock</span>
                            <span className="text-lg font-bold text-primary tracking-tight truncate">{capitalValue} F</span>
                        </div>
                    </div>

                    <div
                        onClick={announceCapital}
                        className="bg-emerald-50 p-4 rounded-xl flex items-start gap-3 text-primary cursor-pointer active:bg-emerald-100 transition-colors"
                    >
                        <Volume2 className="shrink-0 w-5 h-5" />
                        <p className="font-semibold text-xs leading-snug">
                            Ce produit représente {capitalValue} F de votre capital marchand.
                        </p>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Clock size={14} className="text-slate-400" />
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dernières actions</h3>
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                            {productHistory.length === 0 ? (
                                <p className="text-xs sm:text-sm font-bold text-slate-300 italic">Aucun historique pour le moment</p>
                            ) : (
                                productHistory.map(t => (
                                    <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-3 min-w-0 pr-2">
                                            <div className={`p-2 rounded-lg shrink-0 ${t.type === 'VENTE' ? 'bg-emerald-100 text-emerald-600' :
                                                t.type === 'LIVRAISON' ? 'bg-blue-100 text-blue-600' :
                                                    'bg-red-100 text-red-600'
                                                }`}>
                                                {t.type === 'VENTE' ? <ShoppingBag size={14} /> :
                                                    t.type === 'LIVRAISON' ? <PlusCircle size={14} /> :
                                                        <MinusCircle size={14} />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-800 text-sm leading-none truncate">{t.type}</p>
                                                <p className="text-[10px] text-slate-400 font-semibold uppercase truncate mt-1">{new Date(t.timestamp).toLocaleDateString()} • {t.quantity} un.</p>
                                            </div>
                                        </div>
                                        <p className="font-bold text-sm text-slate-500 shrink-0 whitespace-nowrap">
                                            {t.type === 'VENTE' ? '+' : '-'}{t.price} F
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-slate-900 text-white rounded-xl text-sm font-bold uppercase tracking-wider shadow-md active:scale-[0.98] transition-all mt-4"
                    >
                        J'ai compris
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
