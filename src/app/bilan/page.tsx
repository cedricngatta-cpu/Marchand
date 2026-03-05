'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Wallet, Store, TrendingUp, RotateCcw, Volume2, Clock, ShoppingBag, PlusCircle, MinusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAssistant } from '@/hooks/useAssistant';
import { Mic } from 'lucide-react';
import { useStock } from '@/hooks/useStock';
import { useHistory } from '@/hooks/useHistory';
import { useProductContext } from '@/context/ProductContext';
import { useVoice } from '@/hooks/useVoice';

export default function BilanPage() {
    const router = useRouter();
    const { handleAction, isSpeaking, isListening } = useAssistant();
    const { speak } = useVoice();
    const { stock } = useStock();
    const { history, balance, clearHistory } = useHistory();
    const { products } = useProductContext();

    // Calcul du capital stock
    const stockValue = products.reduce((acc, product) => {
        return acc + (product.price * (stock[product.id] || 0));
    }, 0);

    const todayTransactions = history.filter(t => {
        const today = new Date().setHours(0, 0, 0, 0);
        return t.timestamp >= today;
    });

    const announceBilan = () => {
        speak(`Kouamé, voici ton bilan. Tu as ${balance} francs dans la caisse, et ta marchandise vaut ${stockValue} francs.`);
    };

    const handleReset = async () => {
        if (confirm("Voulez-vous vraiment remettre la caisse à zéro ? (Cela supprimera tout ton historique)")) {
            await clearHistory();
            speak("C'est fait, la caisse et l'historique sont vides pour demain.");
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 pb-48 md:pb-64 lg:pb-48 max-w-5xl mx-auto">
            {/* Header */}
            <header className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8 pt-4">
                <button
                    onClick={() => router.push('/')}
                    className="w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-slate-800 rounded-full shadow-md flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-90 transition-transform shrink-0"
                >
                    <ChevronLeft size={24} className="md:w-8 md:h-8" />
                </button>
                <h1 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate">Mon Bilan</h1>
            </header>

            <div className="space-y-6 md:space-y-8">
                {/* La Caisse (Argent Liquide) */}
                <motion.section
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-emerald-600 text-white rounded-[32px] md:rounded-[40px] p-6 md:p-12 shadow-xl shadow-emerald-100 dark:shadow-emerald-900/20 flex flex-col gap-3 md:gap-4 relative overflow-hidden"
                >
                    <div className="absolute -right-8 -top-8 text-white/10 rotate-12 hidden md:block">
                        <Wallet size={200} />
                    </div>
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="bg-white/20 p-2 md:p-3 rounded-xl md:rounded-2xl">
                            <Wallet size={24} className="md:w-8 md:h-8" />
                        </div>
                        <span className="font-black uppercase tracking-widest text-emerald-100 italic text-[10px] md:text-base">Dans la caisse</span>
                    </div>
                    <div className="relative z-10">
                        <span className="text-5xl md:text-8xl font-black tracking-tighter">{balance}</span>
                        <span className="text-xl md:text-4xl font-bold ml-1 md:ml-2 text-emerald-100">F</span>
                    </div>
                    <p className="font-bold text-emerald-100 bg-emerald-700/30 p-4 md:p-6 rounded-xl md:rounded-2xl relative z-10 max-w-md text-xs md:text-base">
                        C'est l'argent que tu as gagné aujourd'hui, Kouamé. Beau travail !
                    </p>
                </motion.section>

                {/* Le Stock & Dettes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    <motion.section
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-blue-600 text-white rounded-[24px] md:rounded-[32px] p-5 md:p-8 shadow-xl shadow-blue-100 dark:shadow-blue-900/20 flex flex-col gap-1 md:gap-2 relative overflow-hidden"
                    >
                        <span className="font-black uppercase tracking-widest text-blue-100 text-[10px] md:text-xs">Valeur Marchandise</span>
                        <div>
                            <span className="text-3xl md:text-5xl font-black tracking-tighter">{stockValue}</span>
                            <span className="text-base md:text-xl font-bold ml-1 text-blue-100">F</span>
                        </div>
                    </motion.section>

                    <motion.section
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-rose-600 text-white rounded-[24px] md:rounded-[32px] p-5 md:p-8 shadow-xl shadow-rose-100 dark:shadow-rose-900/20 flex flex-col gap-1 md:gap-2 relative overflow-hidden"
                    >
                        <span className="font-black uppercase tracking-widest text-rose-100 text-[10px] md:text-xs">Crédit Dehors</span>
                        <div>
                            <span className="text-3xl md:text-5xl font-black tracking-tighter">
                                {history.filter(t => t.status === 'DETTE').reduce((acc, t) => acc + t.price, 0)}
                            </span>
                            <span className="text-base md:text-xl font-bold ml-1 text-rose-100">F</span>
                        </div>
                    </motion.section>

                    <motion.section
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-purple-600 text-white rounded-[24px] md:rounded-[32px] p-5 md:p-8 shadow-xl shadow-purple-100 dark:shadow-purple-900/20 flex flex-col gap-1 md:gap-2 relative overflow-hidden sm:col-span-2 lg:col-span-1"
                    >
                        <span className="font-black uppercase tracking-widest text-purple-100 text-[10px] md:text-xs">Estimation Gain Réel</span>
                        <div>
                            <span className="text-3xl md:text-5xl font-black tracking-tighter">{Math.round(balance * 0.2)}</span>
                            <span className="text-base md:text-xl font-bold ml-1 text-purple-100">F</span>
                        </div>
                    </motion.section>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                    {/* Top Produits & Évolution */}
                    <div className="space-y-6 md:space-y-8">
                        <section className="bg-white dark:bg-slate-900 rounded-[32px] md:rounded-[40px] p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                                <TrendingUp className="text-amber-500" size={24} />
                                <h2 className="font-black uppercase text-slate-400 tracking-widest text-[10px] md:text-sm">Tes Champions</h2>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                                {products.map(p => {
                                    const qty = todayTransactions
                                        .filter(t => t.productId === p.id && t.type === 'VENTE')
                                        .reduce((acc, t) => acc + t.quantity, 0);

                                    if (qty === 0) return null;

                                    return (
                                        <div key={p.id} className="flex flex-col items-center gap-2 md:gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 md:p-5 rounded-[20px] md:rounded-[24px] border border-slate-100 dark:border-slate-700 transition-transform hover:scale-105">
                                            <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${p.color} ${p.iconColor}`}>
                                                <p.icon size={24} className="md:w-7 md:h-7" />
                                            </div>
                                            <span className="font-black text-[10px] md:text-xs text-slate-800 dark:text-white uppercase text-center line-clamp-1">{p.name}</span>
                                            <span className="bg-amber-400 text-slate-900 px-2 md:px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-md">
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
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-slate-900 text-white rounded-[32px] md:rounded-[40px] p-6 md:p-10 shadow-2xl relative overflow-hidden border-[3px] md:border-4 border-amber-400"
                        >
                            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                                <div className="bg-amber-400 p-1.5 md:p-2 rounded-xl text-slate-900 shadow-lg shadow-amber-400/20">
                                    <TrendingUp size={24} className="md:w-7 md:h-7" />
                                </div>
                                <h2 className="font-black uppercase tracking-widest text-amber-400 text-sm md:text-lg">Conseil Intelligent</h2>
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

                                    let adviceText = "Bravo Kouamé ! Ton commerce est très bien géré. On continue ensemble !";
                                    let voiceText = "Bravo Kouamé ! Ton commerce est très bien géré. On continue ensemble !";
                                    let adviceColor = "text-emerald-300";

                                    if (totalPriceDette > totalAssets * 0.3) {
                                        adviceText = `"Kouamé, attention ! Trop de clients te doivent de l'argent (${totalPriceDette} F). C'est risqué. Dis stop aux crédits pour un moment."`;
                                        voiceText = `Kouamé, fais attention ! Trop de clients te doivent de l'argent. Tu as ${totalPriceDette} francs dehors. C'est plus de trente pour cent de ton capital. Tu devrais arrêter les crédits pour sécuriser ta caisse.`;
                                        adviceColor = "text-rose-300";
                                    } else if (lowStockProducts.length > 0) {
                                        const names = lowStockProducts.slice(0, 2).map(p => p.audioName).join(' et ');
                                        adviceText = `"Kouamé, commande du stock ! Tu n'as presque plus de ${names}. Tu vends bien en ce moment, ne manque pas de marchandise."`;
                                        voiceText = `Kouamé, ton stock baisse sur tes meilleurs produits ! Il te reste très peu de ${names}. Pense à commander dès aujourd'hui pour ne perdre aucune vente.`;
                                        adviceColor = "text-amber-200";
                                    } else if (topProduct) {
                                        adviceText = `"Kouamé, ${topProduct.audioName} cartonne ! Les clients en redemandent. C'est ton produit numéro 1."`;
                                        voiceText = `Kouamé, ${topProduct.audioName} est ton produit champion ! Les clients l'adorent. Assure-toi d'en avoir toujours un gros stock car c'est lui qui fait tourner ta boutique.`;
                                        adviceColor = "text-emerald-300";
                                    }

                                    return (
                                        <div className="space-y-6">
                                            <p className={`text-xl md:text-2xl font-black leading-tight ${adviceColor} italic tracking-tight`}>{adviceText}</p>
                                            <button
                                                onClick={() => speak(voiceText)}
                                                className="bg-amber-400 hover:bg-amber-300 text-slate-900 px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-[20px] font-black uppercase text-[10px] md:text-xs tracking-widest flex items-center justify-center md:justify-start gap-2 md:gap-3 active:scale-95 transition-all shadow-xl shadow-amber-400/20 shadow-none border-b-4 border-amber-600 w-full sm:w-auto"
                                            >
                                                <Volume2 size={20} className="md:w-6 md:h-6" /> Écouter le conseil
                                            </button>
                                        </div>
                                    );
                                })()}
                            </div>
                        </motion.section>

                        <section className="bg-white dark:bg-slate-900 rounded-[32px] md:rounded-[40px] p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                                <Clock className="text-slate-400" size={24} />
                                <h2 className="font-black uppercase text-slate-400 tracking-widest text-[10px] md:text-sm">Journal du Jour</h2>
                            </div>

                            <div className="space-y-3 md:space-y-4 max-h-[300px] md:max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                                {todayTransactions.length === 0 ? (
                                    <div className="py-16 md:py-20 text-center">
                                        <p className="text-slate-300 dark:text-slate-700 font-black italic uppercase text-xs md:text-sm tracking-widest">C'est très calme aujourd'hui</p>
                                    </div>
                                ) : (
                                    todayTransactions.map((t) => (
                                        <div key={t.id} className="flex items-center justify-between p-3 md:p-4 bg-slate-50 dark:bg-slate-800/40 rounded-[20px] md:rounded-[24px] border border-slate-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-900 transition-colors gap-2">
                                            <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                                <div className={`p-2.5 md:p-3 rounded-xl md:rounded-[15px] shrink-0 ${t.type === 'VENTE' ? 'bg-emerald-100 text-emerald-600' :
                                                    t.type === 'LIVRAISON' ? 'bg-blue-100 text-blue-600' :
                                                        'bg-red-100 text-red-600'
                                                    }`}>
                                                    {t.type === 'VENTE' ? <ShoppingBag size={18} className="md:w-5 md:h-5" /> :
                                                        t.type === 'LIVRAISON' ? <PlusCircle size={18} className="md:w-5 md:h-5" /> :
                                                            <MinusCircle size={18} className="md:w-5 md:h-5" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-slate-800 dark:text-white uppercase leading-tight mb-0.5 md:mb-1 flex flex-wrap items-center gap-1.5 md:gap-2 text-xs md:text-sm">
                                                        <span className="truncate">{t.productName}</span>
                                                        {t.clientName && (
                                                            <span className="bg-amber-100 text-amber-700 px-1.5 md:px-2 py-0.5 rounded-md md:rounded-lg text-[8px] md:text-[9px] font-black border border-amber-200 uppercase whitespace-nowrap">
                                                                {t.clientName}
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-0.5 md:mt-1">
                                                        {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {t.quantity} Qté
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className={`font-black text-[13px] md:text-base ${t.status === 'DETTE' ? 'text-red-500' : t.type === 'VENTE' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                    {t.type === 'VENTE' ? '+' : ''}{t.price} F
                                                </p>
                                                {t.status === 'DETTE' && (
                                                    <span className="text-[8px] md:text-[9px] font-black text-red-500 uppercase bg-red-50 dark:bg-red-900/30 px-1 md:px-1.5 rounded-full border border-red-100 dark:border-red-900 shadow-sm">Dette</span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>
                </div>

                {/* Bouton de Reset Discreet */}
                <div className="flex justify-center py-6 md:py-10">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 md:gap-3 text-slate-300 dark:text-slate-700 hover:text-rose-500 transition-colors py-3 md:py-4 px-6 md:px-8 rounded-[20px] md:rounded-full border-[1.5px] md:border-2 border-dashed border-slate-200 dark:border-slate-800 active:scale-95 text-center"
                    >
                        <RotateCcw size={16} className="md:w-5 md:h-5 shrink-0" />
                        <span className="font-black uppercase text-[10px] md:text-xs tracking-widest text-left">Remettre à zéro<br className="sm:hidden" /> (Fin de journée)</span>
                    </button>
                </div>
            </div>

            {/* Actions Fixes (Centrées) */}
            <div className="fixed bottom-6 left-0 right-0 px-4 md:px-6 flex items-center justify-center pointer-events-none z-50">
                <div className="w-full max-w-2xl flex items-center gap-3 md:gap-4">
                    {/* Micro */}
                    <motion.button
                        onClick={handleAction}
                        whileTap={{ scale: 0.9 }}
                        className={`h-20 w-20 md:h-32 md:w-32 shrink-0 rounded-[28px] md:rounded-[40px] flex items-center justify-center shadow-2xl border-4 border-white dark:border-slate-900 transition-all pointer-events-auto ${isListening ? 'bg-red-500 scale-105 md:scale-110 animate-pulse' : isSpeaking ? 'bg-blue-500' : 'bg-slate-900'}`}
                    >
                        <Mic size={28} color="white" fill={isListening || isSpeaking ? "white" : "none"} className="md:w-9 md:h-9 md:scale-110" />
                    </motion.button>

                    <button
                        onClick={announceBilan}
                        className="flex-1 h-20 md:h-32 bg-purple-700 hover:bg-purple-600 text-white rounded-[28px] md:rounded-[50px] flex items-center justify-center gap-2 md:gap-4 text-base md:text-3xl font-black uppercase tracking-tight shadow-2xl active:bg-purple-800 transition-all border-4 border-white dark:border-slate-900 pointer-events-auto shadow-purple-200 dark:shadow-none"
                    >
                        <Volume2 size={24} className="md:w-8 md:h-8 md:scale-110" />
                        <span>MON BILAN</span>
                    </button>
                </div>
            </div>
        </main>
    );
}
