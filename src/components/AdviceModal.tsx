'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Wallet, ShoppingBag, AlertCircle, Volume2, Mic, CheckCircle2 } from 'lucide-react';
import { useVoice } from '@/hooks/useVoice';
import { useHistory } from '@/hooks/useHistory';
import { useStock } from '@/hooks/useStock';
import { useProductContext } from '@/context/ProductContext';

interface AdviceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AdviceModal({ isOpen, onClose }: AdviceModalProps) {
    const { speak } = useVoice();
    const { history, balance } = useHistory();
    const { stock } = useStock();
    const { products } = useProductContext();
    const [advice, setAdvice] = useState<{ text: string; voice: string; type: 'SUCCESS' | 'WARNING' | 'INFO'; title: string } | null>(null);

    useEffect(() => {
        if (isOpen) {
            generateAdvice();
        }
    }, [isOpen]);

    const generateAdvice = () => {
        // Logic for financial advice
        const stockValue = products.reduce((acc, p) => acc + (p.price * (stock[p.id] || 0)), 0);
        const totalPriceDette = history.filter(t => t.status === 'DETTE').reduce((acc, t) => acc + t.price, 0);
        const totalAssets = balance + stockValue + totalPriceDette;

        // Low stock check
        const lowStock = products.filter(p => (stock[p.id] || 0) < 5);

        // Debt ratio check
        const debtRatio = totalAssets > 0 ? (totalPriceDette / totalAssets) : 0;

        if (debtRatio > 0.3) {
            setAdvice({
                title: "Attention aux Crédits",
                text: `Kouamé, ${totalPriceDette} F sont dehors. C'est beaucoup ! Tu devrais essayer de récupérer cet argent avant de faire d'autres crédits.`,
                voice: `Kouamé, fais attention. Trop de clients te doivent de l'argent. Tu as ${totalPriceDette} francs dehors. C'est plus de trente pour cent de ton capital. Tu devrais arrêter les crédits pour un moment.`,
                type: 'WARNING'
            });
        } else if (lowStock.length > 0) {
            const productNames = lowStock.slice(0, 2).map(p => p.audioName).join(' et ');
            setAdvice({
                title: "Stock à Renouveler",
                text: `Ton stock de ${productNames} est presque fini. Commande vite pour ne pas rater des ventes !`,
                voice: `Kouamé, ton stock baisse. Tu n'as presque plus de ${productNames}. Pense à commander chez ton livreur aujourd'hui.`,
                type: 'INFO'
            });
        } else if (balance > 5000) {
            setAdvice({
                title: "Bonne Gestion",
                text: "Tu as bien vendu aujourd'hui ! Tu as assez d'argent en caisse pour tes futures commandes.",
                voice: "Bravo Kouamé ! Ta caisse est bien remplie aujourd'hui. Tu gères très bien ton commerce.",
                type: 'SUCCESS'
            });
        } else {
            setAdvice({
                title: "Conseil du Jour",
                text: "Continue de bien noter chaque vente pour voir ton bénéfice grimper !",
                voice: "Kouamé, continue comme ça. Note bien chaque vente et chaque dépense pour devenir un grand commerçant.",
                type: 'INFO'
            });
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden border-4 border-amber-400"
                >
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-6 w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 z-20"
                    >
                        <X size={24} />
                    </button>

                    <div className="p-8 md:p-12">
                        <div className="flex items-center gap-4 mb-8">
                            <div className={`p-4 rounded-2xl ${advice?.type === 'WARNING' ? 'bg-rose-100 text-rose-600' :
                                    advice?.type === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600' :
                                        'bg-blue-100 text-blue-600'
                                }`}>
                                {advice?.type === 'WARNING' ? <AlertCircle size={32} /> :
                                    advice?.type === 'SUCCESS' ? <CheckCircle2 size={32} /> :
                                        <TrendingUp size={32} />}
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Kouamé Assistant</h2>
                                <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{advice?.title}</h3>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[32px] border-2 border-slate-100 dark:border-slate-800 mb-8">
                            <p className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-200 leading-tight italic">
                                "{advice?.text}"
                            </p>
                        </div>

                        <div className="flex flex-col gap-4">
                            <button
                                onClick={() => advice && speak(advice.voice)}
                                className="w-full h-20 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-[25px] flex items-center justify-center gap-4 text-xl font-black uppercase tracking-widest shadow-xl shadow-amber-400/20 active:scale-95 transition-all border-b-4 border-amber-600"
                            >
                                <Volume2 size={32} />
                                ÉCOUTER LE CONSEIL
                            </button>

                            <button
                                onClick={onClose}
                                className="w-full h-16 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase text-sm tracking-widest rounded-[20px] active:scale-95 transition-all"
                            >
                                J'ai compris
                            </button>
                        </div>
                    </div>

                    {/* Décoration */}
                    <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
