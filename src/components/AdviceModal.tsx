'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Wallet, ShoppingBag, AlertCircle, Volume2, Mic, CheckCircle2 } from 'lucide-react';
import { useVoice } from '@/hooks/useVoice';
import { useHistory } from '@/hooks/useHistory';
import { useStock } from '@/hooks/useStock';
import { useProductContext } from '@/context/ProductContext';
import { useAuth } from '@/context/AuthContext';

interface AdviceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AdviceModal({ isOpen, onClose }: AdviceModalProps) {
    const { user } = useAuth();
    const { speak } = useVoice();
    const { history, balance } = useHistory();
    const { stock } = useStock();
    const { products } = useProductContext();
    const [advice, setAdvice] = useState<{ text: string; voice: string; type: 'SUCCESS' | 'WARNING' | 'INFO'; title: string } | null>(null);

    const generateAdvice = () => {
        const name = user?.name?.split(' ')[0] || 'Marchand';
        const advicesLine = [
            { title: "Gérer le Stock", text: "Tes ventes de riz augmentent. Pense à commander plus de stock pour ne pas en manquer.", voice: `"${name}, tes ventes de riz augmentent. Pense à commander plus de stock pour ne pas en manquer."`, type: 'INFO' as const },
            { title: "Nouveaux Produits", text: "Beaucoup de clients demandent du savon. C'est le moment d'en proposer plus.", voice: `"${name}, beaucoup de clients demandent du savon. C'est le moment d'en proposer plus."`, type: 'INFO' as const },
            { title: "Bonne Gestion", text: "Tu as réduit tes dettes de 15% cette semaine. Excellent travail !", voice: `"${name}, tu as réduit tes dettes de 15% cette semaine. Excellent travail !"`, type: 'SUCCESS' as const },
            { title: "Opportunité", text: "Le marché central baisse ses prix sur l'huile. Profites-en pour ton stock.", voice: `"${name}, le marché central baisse ses prix sur l'huile. Profites-en pour ton stock."`, type: 'INFO' as const }
        ];

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
                text: `${name}, ${totalPriceDette} F sont dehors. C'est beaucoup ! Tu devrais essayer de récupérer cet argent avant de faire d'autres crédits.`,
                voice: `${name}, fais attention. Trop de clients te doivent de l'argent. Tu as ${totalPriceDette} francs dehors. C'est plus de trente pour cent de ton capital. Tu devrais arrêter les crédits pour un moment.`,
                type: 'WARNING'
            });
        } else if (lowStock.length > 0) {
            const productNames = lowStock.slice(0, 2).map(p => p.audioName).join(' et ');
            setAdvice({
                title: "Stock à Renouveler",
                text: `Ton stock de ${productNames} est presque fini. Commande vite pour ne pas rater des ventes !`,
                voice: `${name}, ton stock baisse. Tu n'as presque plus de ${productNames}. Pense à commander chez ton livreur aujourd'hui.`,
                type: 'INFO'
            });
        } else if (balance > 5000) {
            setAdvice({
                title: "Bonne Gestion",
                text: "Tu as bien vendu aujourd'hui ! Tu as assez d'argent en caisse pour tes futures commandes.",
                voice: `Bravo ${name} ! Ta caisse est bien remplie aujourd'hui. Tu gères très bien ton commerce.`,
                type: 'SUCCESS'
            });
        } else {
            // Fallback to a random advice if no specific condition is met
            const randomIndex = Math.floor(Math.random() * advicesLine.length);
            setAdvice(advicesLine[randomIndex]);
        }
    };

    useEffect(() => {
        if (isOpen) {
            generateAdvice();
        }
    }, [isOpen, user, history, balance, stock, products]); // Added dependencies

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
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                >
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-6 w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 z-20"
                    >
                        <X size={24} />
                    </button>

                    <div className="p-6 md:p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`p-3 rounded-xl ${advice?.type === 'WARNING' ? 'bg-rose-50 text-rose-500' :
                                advice?.type === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' :
                                    'bg-indigo-50 text-indigo-600'
                                }`}>
                                {advice?.type === 'WARNING' ? <AlertCircle size={24} /> :
                                    advice?.type === 'SUCCESS' ? <CheckCircle2 size={24} /> :
                                        <TrendingUp size={24} />}
                            </div>
                            <div>
                                <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Conseil de l'Assistant</h2>
                                <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{advice?.title}</h3>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-xl border border-slate-100 dark:border-slate-800 mb-6">
                            <p className="text-lg md:text-xl font-medium text-slate-700 dark:text-slate-200 leading-snug">
                                {advice?.text}
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => advice && speak(advice.voice)}
                                className="w-full py-4 bg-primary text-white rounded-xl flex items-center justify-center gap-3 text-sm font-bold shadow-md active:scale-[0.98] transition-all"
                            >
                                <Volume2 size={20} />
                                ÉCOUTER LE CONSEIL
                            </button>

                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold text-xs uppercase tracking-widest rounded-xl active:bg-slate-100 transition-colors"
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
