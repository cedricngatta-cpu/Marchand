'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Wallet, Store, TrendingUp, RotateCcw, Volume2, Clock, ShoppingBag, PlusCircle, MinusCircle, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAssistant } from '@/hooks/useAssistant';
import { Mic } from 'lucide-react';
import { useStock } from '@/hooks/useStock';
import { useHistory } from '@/hooks/useHistory';
import { useProductContext } from '@/context/ProductContext';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmContext';
import { useVoice } from '@/hooks/useVoice';

export default function BilanPage() {
    const router = useRouter();
    const { handleAction, isSpeaking, isListening } = useAssistant();
    const { speakIfNecessary } = useVoice();
    const { stock } = useStock();
    const { history, balance, clearHistory } = useHistory();
    const { products } = useProductContext();
    const { user } = useAuth();
    const confirm = useConfirm();
    const name = user?.name?.split(' ')[0] || 'Marchand';
    const [isBalanceVisible, setIsBalanceVisible] = useState(false);

    // Calcul du capital stock
    const stockValue = products.reduce((acc, product) => {
        return acc + (product.price * (stock[product.id] || 0));
    }, 0);

    const todayTransactions = history.filter(t => {
        const today = new Date().setHours(0, 0, 0, 0);
        return t.timestamp >= today;
    });

    const announceBilan = () => {
        // Révéler le solde si l'utilisateur demande à l'entendre
        setIsBalanceVisible(true);
        // speakIfNecessary silenced - Mission 1
    };

    const handleReset = async () => {
        const ok = await confirm({
            title: 'Remettre la caisse à zéro ?',
            message: 'Cela supprimera tout ton historique. Cette action est irréversible.',
            confirmLabel: 'Réinitialiser',
            dangerMode: true
        });
        if (ok) {
            await clearHistory();
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-36">
            {/* Header Coloré (Card Overlap Style) */}
            <div className="bg-primary pt-8 pb-32 px-4 rounded-b-[2.5rem] relative shadow-lg">
                <div className="flex justify-between items-center mb-6 max-w-lg mx-auto">
                    <button onClick={() => router.push('/')} className="w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-center">
                        <h1 className="text-white font-bold text-lg tracking-wide uppercase">Mon Bilan</h1>
                        <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mt-0.5">Finances & Historique</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={announceBilan} className="w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm">
                            <Volume2 size={18} />
                        </button>
                    </div>
                </div>

                {/* La Caisse (Argent Liquide) intégrée au header */}
                <div className="max-w-lg mx-auto flex flex-col items-center mt-2">
                    <div className="flex items-center gap-2 mb-1 bg-white/10 px-3 py-1.5 rounded-full border border-white/10 active:scale-95 transition-transform cursor-pointer" onClick={() => setIsBalanceVisible(!isBalanceVisible)}>
                        <Wallet size={16} className="text-emerald-200" />
                        <span className="font-bold uppercase tracking-wider text-emerald-100 text-[10px]">Dans la caisse</span>
                        <div className="text-emerald-200 ml-1">
                            {isBalanceVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-5xl font-bold tracking-tight text-white transition-all">
                            {isBalanceVisible ? balance : '••••'}
                        </span>
                        <span className="text-2xl font-semibold text-emerald-100">F</span>
                    </div>
                </div>
            </div>

            {/* Main Content Overlap */}
            <main className="mt-[-40px] relative z-10 px-4 max-w-lg mx-auto space-y-4">
                {/* Le Stock & Dettes (Overlap Cards) */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                        <span className="font-bold uppercase tracking-wider text-slate-400 text-[9px] mb-1">Marchandise</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">{stockValue}</span>
                            <span className="text-[10px] font-bold text-primary">F</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                        <span className="font-bold uppercase tracking-wider text-slate-400 text-[9px] mb-1">Dettes</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold tracking-tight text-rose-500">{history.filter(t => t.status === 'DETTE').reduce((acc, t) => acc + t.price, 0)}</span>
                            <span className="text-[10px] font-bold text-rose-500">F</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                    <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] mb-1">Bénéfice Net Estimé</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">{Math.round(balance * 0.2)}</span>
                        <span className="text-sm font-bold text-primary">FCFA</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6">
                    {/* Top Produits & Évolution */}
                    <div className="space-y-4 md:space-y-6">
                        <section className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="text-amber-500 w-5 h-5" />
                                <h2 className="font-bold uppercase text-slate-400 tracking-wider text-[10px]">Tes Champions</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {products.map(p => {
                                    const qty = todayTransactions
                                        .filter(t => t.productId === p.id && t.type === 'VENTE')
                                        .reduce((acc, t) => acc + t.quantity, 0);

                                    if (qty === 0) return null;

                                    return (
                                        <div key={p.id} className="flex flex-col items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                            <div className={`p-2.5 rounded-lg ${p.color} ${p.iconColor}`}>
                                                <p.icon size={20} />
                                            </div>
                                            <span className="font-bold text-[10px] text-slate-800 dark:text-white uppercase text-center line-clamp-1">{p.name}</span>
                                            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                                {qty} VENDUS
                                            </span>
                                        </div>
                                    );
                                })}
                                {todayTransactions.filter(t => t.type === 'VENTE').length === 0 && (
                                    <div className="col-span-full py-8 md:py-10 text-center">
                                        <p className="text-slate-300 font-bold italic uppercase text-xs md:text-sm">Aucune vente enregistrée aujourd'hui</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="bg-white dark:bg-slate-900 rounded-[32px] md:rounded-[40px] p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 md:gap-3 mb-6 md:mb-8">
                                <TrendingUp className="text-emerald-500" size={24} />
                                <h2 className="font-black uppercase text-slate-400 tracking-widest text-[10px] md:text-sm">Évolution (7 jours)</h2>
                            </div>

                            <div className="h-40 md:h-48 flex items-end gap-2 md:gap-3 px-1 md:px-2">
                                {(() => {
                                    const last7Days = Array.from({ length: 7 }, (_, i) => {
                                        const d = new Date();
                                        d.setDate(d.getDate() - (6 - i));
                                        d.setHours(0, 0, 0, 0);
                                        return d.getTime();
                                    });

                                    const maxDaily = Math.max(...last7Days.map(day =>
                                        history
                                            .filter(t => t.type === 'VENTE' && t.timestamp >= day && t.timestamp < day + 86400000)
                                            .reduce((acc, t) => acc + t.price, 0)
                                    ), 1000);

                                    return last7Days.map((day, i) => {
                                        const dailyTotal = history
                                            .filter(t => t.type === 'VENTE' && t.timestamp >= day && t.timestamp < day + 86400000)
                                            .reduce((acc, t) => acc + t.price, 0);

                                        const height = (dailyTotal / maxDaily) * 100;
                                        const isToday = i === 6;

                                        return (
                                            <div key={day} className="flex-1 flex flex-col items-center gap-2 md:gap-3">
                                                <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-[10px] md:rounded-[14px] h-24 md:h-32 relative overflow-hidden group">
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${height}%` }}
                                                        transition={{ delay: i * 0.1, type: "spring", stiffness: 50 }}
                                                        className={`absolute bottom-0 left-0 right-0 rounded-t-md md:rounded-t-lg transition-all ${isToday ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] md:shadow-[0_0_25px_rgba(16,185,129,0.4)]' : 'bg-slate-300 dark:bg-slate-600'}`}
                                                    >
                                                        {dailyTotal > 0 && (
                                                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 md:-top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] md:text-[10px] font-black px-1.5 md:px-2 py-1 md:py-1.5 rounded-lg transition-all whitespace-nowrap z-20 shadow-xl border border-white/20">
                                                                {dailyTotal} F
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                </div>
                                                <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-tighter ${isToday ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                    {new Date(day).toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}
                                                </span>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </section>
                    </div>

                    {/* IA Insights & Journal */}
                    <div className="space-y-6 md:space-y-8">
                        {/* IA Advice */}
                        <motion.section
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-slate-900 text-white rounded-[32px] p-6 shadow-xl relative border border-slate-800"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <div className="bg-amber-400 p-1.5 rounded-lg text-slate-900 shadow-sm">
                                    <TrendingUp size={18} />
                                </div>
                                <h2 className="font-bold uppercase tracking-wider text-amber-400 text-[10px]">Conseil Intelligent</h2>
                            </div>

                            <div className="relative z-10">
                                {(() => {
                                    const totalPriceDette = history.filter(t => t.status === 'DETTE').reduce((acc, t) => acc + t.price, 0);
                                    const totalAssets = balance + stockValue + totalPriceDette;

                                    // Top seller analysis
                                    const salesByProduct = history.filter(t => t.type === 'VENTE').reduce((acc, t) => {
                                        acc[t.productId] = (acc[t.productId] || 0) + t.quantity;
                                        return acc;
                                    }, {} as Record<string, number>);

                                    const topProductId = Object.keys(salesByProduct).sort((a, b) => salesByProduct[b] - salesByProduct[a])[0];
                                    const topProduct = products.find(p => p.id === topProductId);

                                    // Low stock analysis
                                    const lowStockProducts = products.filter(p => (stock[p.id] || 0) < 10);

                                    let adviceText = `Bravo ${name} ! Ton commerce est très bien géré. On continue ensemble !`;
                                    let voiceText = `Bravo ${name} ! Ton commerce est très bien géré. On continue ensemble !`;
                                    let adviceColor = "text-emerald-300";

                                    if (totalPriceDette > totalAssets * 0.3) {
                                        adviceText = `"${name}, attention ! Trop de clients te doivent de l'argent (${totalPriceDette} F). C'est risqué. Dis stop aux crédits pour un moment."`;
                                        voiceText = `${name}, fais attention ! Trop de clients te doivent de l'argent. Tu as ${totalPriceDette} francs dehors. C'est plus de trente pour cent de ton capital. Tu devrais arrêter les crédits pour sécuriser ta caisse.`;
                                        adviceColor = "text-rose-300";
                                    } else if (lowStockProducts.length > 0) {
                                        const names = lowStockProducts.slice(0, 2).map(p => p.audioName).join(' et ');
                                        adviceText = `"${name}, commande du stock ! Tu n'as presque plus de ${names}. Tu vends bien en ce moment, ne manque pas de marchandise."`;
                                        voiceText = `${name}, ton stock baisse sur tes meilleurs produits ! Il te reste très peu de ${names}. Pense à commander dès aujourd'hui pour ne perdre aucune vente.`;
                                        adviceColor = "text-amber-200";
                                    } else if (topProduct) {
                                        adviceText = `"${name}, ${topProduct.audioName} cartonne ! Les clients en redemandent. C'est ton produit numéro 1."`;
                                        voiceText = `${name}, ${topProduct.audioName} est ton produit champion ! Les clients l'adorent. Assure-toi d'en avoir toujours un gros stock car c'est lui qui fait tourner ta boutique.`;
                                        adviceColor = "text-emerald-300";
                                    }

                                    return (
                                        <div className="space-y-4">
                                            <p className={`text-base font-bold leading-snug ${adviceColor} tracking-tight`}>{adviceText}</p>
                                            <button
                                                onClick={() => { }}
                                                className="bg-amber-400 hover:bg-amber-300 text-slate-900 px-4 py-2.5 rounded-xl font-bold uppercase text-[10px] tracking-wider flex items-center justify-center md:justify-start gap-2 active:scale-95 transition-all w-full md:w-auto"
                                            >
                                                <Volume2 size={18} /> Écouter le conseil
                                            </button>
                                        </div>
                                    );
                                })()}
                            </div>
                        </motion.section>

                        <section className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 mb-5">
                                <Clock className="text-slate-400 w-5 h-5" />
                                <h2 className="font-bold uppercase text-slate-400 tracking-wider text-[10px]">Journal du Jour</h2>
                            </div>

                            <div className="space-y-3 md:space-y-4 max-h-[300px] md:max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                                {todayTransactions.length === 0 ? (
                                    <div className="py-16 md:py-20 text-center">
                                        <p className="text-slate-300 dark:text-slate-700 font-black italic uppercase text-xs md:text-sm tracking-widest">C'est très calme aujourd'hui</p>
                                    </div>
                                ) : (
                                    todayTransactions.map((t) => (
                                        <div key={t.id} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 transition-colors gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`p-2.5 rounded-lg shrink-0 ${t.type === 'VENTE' ? 'bg-emerald-100 text-emerald-600' :
                                                    t.type === 'LIVRAISON' ? 'bg-blue-100 text-blue-600' :
                                                        'bg-red-100 text-red-600'
                                                    }`}>
                                                    {t.type === 'VENTE' ? <ShoppingBag size={18} /> :
                                                        t.type === 'LIVRAISON' ? <PlusCircle size={18} /> :
                                                            <MinusCircle size={18} />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-800 dark:text-white text-xs truncate">
                                                        {t.type === 'VENTE'
                                                            ? (t.status === 'DETTE'
                                                                ? `Vendu à crédit à ${t.clientName && t.clientName !== 'Client standard' ? t.clientName : 'un client'}`
                                                                : `Vendu à ${t.clientName && t.clientName !== 'Client standard' ? t.clientName : 'un client'}`)
                                                            : t.productName}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-medium text-slate-400">
                                                            {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded text-[9px] font-bold border border-slate-200 dark:border-slate-700 uppercase">
                                                            {t.productName}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className={`font-bold text-[14px] ${t.status === 'DETTE' ? 'text-orange-500' : t.type === 'VENTE' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                    {t.type === 'VENTE' ? (t.status === 'DETTE' ? '' : '+') : ''}{t.price} F
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>
                </div>

                {/* Bouton de Reset Discreet */}
                <div className="flex justify-center py-6 md:py-10 mb-16">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 md:gap-3 text-slate-300 dark:text-slate-700 hover:text-rose-500 transition-colors py-3 md:py-4 px-6 md:px-8 rounded-full border-[1.5px] border-dashed border-slate-200 dark:border-slate-800 active:scale-95 text-center"
                    >
                        <RotateCcw size={16} className="shrink-0" />
                        <span className="font-black uppercase text-[10px] md:text-xs tracking-widest text-left">Remettre à zéro<br className="sm:hidden" /> (Fin de journée)</span>
                    </button>
                </div>
            </main>

            {/* Actions Fixes (Centrées) */}
            <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 pointer-events-none z-50">
                <button
                    onClick={handleAction}
                    className={`h-16 px-6 rounded-2xl shadow-xl text-white flex items-center gap-4 w-auto pointer-events-auto transition-all ${isListening ? 'bg-rose-500' : 'bg-slate-900'}`}
                >
                    <div className={`p-2 bg-slate-800 dark:bg-slate-700 text-white rounded-full transition-all shrink-0`}>
                        <Mic size={20} fill={isSpeaking || isListening ? "currentColor" : "none"} />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-xs font-bold uppercase tracking-widest">{isListening ? "ÉCOUTE..." : "PARLER AU BILAN"}</span>
                        <span className="text-[9px] font-medium opacity-60 italic">Appuie pour me parler</span>
                    </div>
                </button>
            </div>
        </div>
    );
}
