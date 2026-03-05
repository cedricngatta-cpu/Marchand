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
    const { speak } = useVoice();
    const { getProductHistory } = useHistory();
    const { user } = useAuth();
    const name = user?.name?.split(' ')[0] || 'Marchand';
    const capitalValue = (currentStock * product.price);

    const productHistory = getProductHistory(product.id).slice(0, 3);

    const announceCapital = () => {
        speak(`Ce produit représente ${capitalValue} francs de ton capital marchand actuel, ${name}.`);
    };

    useEffect(() => {
        announceCapital();
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/90 z-[200] flex items-end sm:items-center justify-center p-4"
        >
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
                className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[40px] mt-auto sm:mt-0 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
                <div className={`p-6 sm:p-8 ${product.color} flex justify-between items-start shrink-0`}>
                    <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                        <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/50 ${product.iconColor} shrink-0`}>
                            <product.icon size={32} className="sm:w-10 sm:h-10" />
                        </div>
                        <h2 className="text-xl sm:text-3xl font-black text-slate-900 uppercase tracking-tighter truncate">{product.name}</h2>
                    </div>
                    <button onClick={onClose} className="bg-white/50 p-2 rounded-full text-slate-600 active:scale-90 transition-transform shrink-0 ml-4">
                        <X size={20} className="sm:w-6 sm:h-6" />
                    </button>
                </div>

                <div className="p-6 sm:p-8 space-y-4 sm:space-y-6 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 text-center">
                            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase block mb-1 tracking-widest">Prix Unité</span>
                            <span className="text-lg sm:text-xl font-black text-slate-800 tracking-tighter truncate">{product.price} F</span>
                        </div>
                        <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 text-center">
                            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase block mb-1 tracking-widest">Valeur Stock</span>
                            <span className="text-lg sm:text-xl font-black text-emerald-600 tracking-tighter truncate">{capitalValue} F</span>
                        </div>
                    </div>

                    <div
                        onClick={announceCapital}
                        className="bg-blue-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl flex items-start gap-3 sm:gap-4 text-blue-800 cursor-pointer active:bg-blue-100 transition-colors"
                    >
                        <Volume2 className="shrink-0 w-5 h-5 sm:w-6 sm:h-6" />
                        <p className="font-bold text-xs sm:text-sm leading-snug">
                            Ce produit représente {capitalValue} F de votre capital.
                        </p>
                    </div>

                    {/* Section Historique Spécifique */}
                    <div>
                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                            <Clock size={14} className="text-slate-400 sm:w-4 sm:h-4" />
                            <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Dernières actions</h3>
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                            {productHistory.length === 0 ? (
                                <p className="text-xs sm:text-sm font-bold text-slate-300 italic">Aucun historique pour le moment</p>
                            ) : (
                                productHistory.map(t => (
                                    <div key={t.id} className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 rounded-[14px] sm:rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
                                            <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${t.type === 'VENTE' ? 'bg-emerald-100 text-emerald-600' :
                                                t.type === 'LIVRAISON' ? 'bg-blue-100 text-blue-600' :
                                                    'bg-red-100 text-red-600'
                                                }`}>
                                                {t.type === 'VENTE' ? <ShoppingBag size={12} className="sm:w-[14px] sm:h-[14px]" /> :
                                                    t.type === 'LIVRAISON' ? <PlusCircle size={12} className="sm:w-[14px] sm:h-[14px]" /> :
                                                        <MinusCircle size={12} className="sm:w-[14px] sm:h-[14px]" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-800 text-xs sm:text-sm leading-none truncate">{t.type}</p>
                                                <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase truncate">{new Date(t.timestamp).toLocaleDateString()} • {t.quantity} un.</p>
                                            </div>
                                        </div>
                                        <p className="font-black text-xs sm:text-sm text-slate-500 shrink-0 whitespace-nowrap">
                                            {t.type === 'VENTE' ? '+' : '-'}{t.price} F
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full h-14 sm:h-16 bg-slate-900 text-white rounded-[20px] sm:rounded-[25px] text-base sm:text-lg font-black uppercase tracking-tight shadow-lg active:scale-95 transition-all mt-2 sm:mt-4 shrink-0"
                    >
                        OK, J'AI COMPRIS
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
