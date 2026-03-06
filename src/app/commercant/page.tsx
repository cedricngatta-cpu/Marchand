'use client';

import React, { useState } from 'react';
import {
    PlusCircle,
    ShoppingBag,
    User,
    Bell,
    TrendingUp,
    Package,
    Scan,
    Store,
    BookOpen,
    PieChart,
    PlayCircle,
    Landmark,
    BrainCircuit,
    Eye,
    EyeOff,
    MoreHorizontal,
    QrCode,
    Camera
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useHistory } from '@/hooks/useHistory';
import { useAssistant } from '@/hooks/useAssistant';
import { useVoice } from '@/hooks/useVoice';
import { useSync } from '@/context/SyncContext';

export default function CommercantDashboard() {
    const router = useRouter();
    const { user } = useAuth();
    const { speak } = useVoice();
    const { balance, history } = useHistory();
    const { unreadCount } = useNotifications();
    const [showBalance, setShowBalance] = useState(true);

    const handleNotifications = () => {
        speak(`${user?.name?.split(' ')[0] || 'Marchand'}, tu as ${unreadCount} nouveaux messages.`);
        router.push('/notifications');
    };

    // Style inspiré de l'image de référence (icônes rondes colorées en bas)
    const quickActions = [
        { id: 'vendre', name: 'Vendre', icon: ShoppingBag, bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-600 dark:text-emerald-400', path: '/vendre' },
        { id: 'stock', name: 'Stock', icon: Package, bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-600 dark:text-amber-400', path: '/stock' },
        { id: 'bilan', name: 'Bilan', icon: PieChart, bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-600 dark:text-blue-400', path: '/bilan' },
        { id: 'carnet', name: 'Carnet', icon: BookOpen, bg: 'bg-rose-100 dark:bg-rose-900/40', text: 'text-rose-600 dark:text-rose-400', path: '/carnet' },
        { id: 'finance', name: 'Crédit', icon: Landmark, bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-600 dark:text-purple-400', path: '/finance' },
        { id: 'marche', name: 'Marché', icon: Store, bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-600 dark:text-indigo-400', path: '/approvisionnement' },
        { id: 'conseils', name: 'Coaching', icon: BrainCircuit, bg: 'bg-cyan-100 dark:bg-cyan-900/40', text: 'text-cyan-600 dark:text-cyan-400', path: '/conseils' },
        { id: 'formation', name: 'Aide', icon: PlayCircle, bg: 'bg-slate-200 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', path: '/formation' },
    ];

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
            {/* EN-TÊTE COLORÉ (Le bloc vert en haut avec arrondi) */}
            <div className="bg-primary pt-8 pb-32 px-4 rounded-b-[2.5rem] relative shadow-lg">
                {/* Navbar supérieure */}
                <div className="flex justify-between items-center mb-6">
                    {/* Icône Profil (Engrenage ou User selon réf) */}
                    <button
                        onClick={() => router.push('/profil')}
                        className="w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm"
                    >
                        <User size={20} />
                    </button>

                    {/* Points décoratifs centripètes */}
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 dark:bg-emerald-700" />
                        <div className="w-2 h-2 rounded-full bg-emerald-300 dark:bg-emerald-700" />
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 dark:bg-emerald-700" />
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 dark:bg-emerald-700" />
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 dark:bg-emerald-700" />
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 dark:bg-emerald-700" />
                    </div>

                    {/* Icônes Droite (Notifications & Caisse) */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleNotifications}
                            className="w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm relative"
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center">
                                    <span className="text-[8px] font-black text-white">{unreadCount}</span>
                                </div>
                            )}
                        </button>
                        <button
                            onClick={() => setShowBalance(!showBalance)}
                            className="w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm"
                        >
                            {showBalance ? <Eye size={20} /> : <EyeOff size={20} />}
                        </button>
                    </div>
                </div>

                {/* Affichage Solde/Caisse */}
                <div className="text-center px-4">
                    <p className="text-emerald-100 font-bold text-[10px] uppercase tracking-widest mb-2">
                        CAISSE DU JOUR
                    </p>
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-5xl sm:text-6xl font-black text-white tracking-tighter">
                            {showBalance ? balance.toLocaleString('fr-FR') : '••••••'}
                        </span>
                        <span className="text-2xl text-emerald-200 font-bold mt-2">F</span>
                    </div>
                </div>
            </div>

            {/* LE CORPS DE LA PAGE (Scanner & Grille) */}
            <div className="px-4 max-w-lg mx-auto relative -mt-24 z-10">
                {/* LA CARTE CENTRALE (Scanner) - Overlap */}
                <button
                    onClick={() => router.push('/scanner')}
                    className="w-full bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-xl mb-6 active:scale-[0.98] transition-all group overflow-hidden relative block"
                >
                    {/* Motif de fond stylisé pour la carte scanner (inspiré du bleu de réf) */}
                    <div className="absolute inset-x-0 inset-y-0 opacity-10 pointer-events-none overflow-hidden rounded-[24px]">
                        {/* Simuler le pattern chevron bleu ciel en fond (on utilise juste quelques traits/cercles ou gradient pour faire pro) */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl" />
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500 rounded-full blur-3xl" />
                    </div>

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-full h-40 max-w-[200px] border-4 border-slate-100 dark:border-slate-800 rounded-[20px] mb-4 bg-white dark:bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden group-hover:border-primary/30 transition-colors">
                            <QrCode size={80} className="text-slate-800 dark:text-slate-200" strokeWidth={1} />

                            {/* Petit bouton caméra flottant en bas à droite du QR code */}
                            <div className="absolute bottom-2 right-2 bg-primary text-white p-2 rounded-xl shadow-md flex items-center gap-1.5 text-[10px] font-bold">
                                <Camera size={14} />
                            </div>
                        </div>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Scanner Produit</h2>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Appuie pour vendre</p>
                    </div>
                </button>

                {/* GRILLE DES ACTIONS RAPIDES (Boutons ronds) */}
                <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-sm mb-6 border border-slate-100 dark:border-slate-800">
                    <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                        {quickActions.map((action) => (
                            <button
                                key={action.id}
                                onClick={() => router.push(action.path)}
                                className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
                            >
                                <div className={`w-14 h-14 rounded-[20px] ${action.bg} flex items-center justify-center shadow-sm relative overflow-hidden group-hover:shadow-md transition-shadow`}>
                                    <action.icon size={24} className={action.text} strokeWidth={2} />
                                    {/* Petit badge conditionnel pour les conseils IA par exemple */}
                                    {action.id === 'conseils' && unreadCount > 0 && (
                                        <div className="absolute top-0 right-0 w-3 h-3 bg-rose-500 border-2 border-white rounded-full" />
                                    )}
                                </div>
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center leading-tight">
                                    {action.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* LISTE HISTORIQUE SIMPLIFIÉE */}
                <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-widest">Aujourd'hui</h3>
                        <MoreHorizontal size={18} className="text-slate-400" />
                    </div>

                    <div className="space-y-4">
                        {history.slice(0, 5).map((t: any, index: number) => (
                            <div key={index} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
                                        {t.type === 'VENTE' ? (
                                            <ShoppingBag size={16} className="text-slate-500" />
                                        ) : t.type === 'ACHAT' ? (
                                            <Store size={16} className="text-slate-500" />
                                        ) : (
                                            <Package size={16} className="text-slate-500" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white capitalize truncate">
                                            {t.type === 'VENTE' ? `Vendu ${t.clientName ? `à ${t.clientName}` : 'au client'}` : t.type}
                                        </p>
                                        <p className="text-[10px] text-slate-400 capitalize -mt-0.5">
                                            {new Date(t.timestamp).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })} • {user?.name?.split(' ')[0]}
                                        </p>
                                    </div>
                                </div>
                                <div className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white whitespace-nowrap">
                                    {t.type === 'VENTE' ? '+' : '-'}{t.price}F
                                </div>
                            </div>
                        ))}

                        {history.length === 0 && (
                            <div className="text-center py-6 text-slate-400">
                                <Package size={24} className="mx-auto mb-2 opacity-30" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">Aucune vente aujourd'hui</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
