'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    User,
    Phone,
    ShieldCheck,
    LogOut,
    Trash2,
    Bell,
    HelpCircle,
    Globe,
    KeyRound,
    CheckCircle2,
    AlertTriangle,
    RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useProfileContext } from '@/context/ProfileContext';
import { SupportCenter } from '@/components/SupportCenter';
import { useConfirm } from '@/context/ConfirmContext';
import { useProductContext } from '@/context/ProductContext';
import { useSync } from '@/context/SyncContext';
import { supabase } from '@/lib/supabase';

export default function ProfilePage() {
    const router = useRouter();
    const { user, logout, updatePin, updateLanguage } = useAuth();
    const { syncGlobalCatalog } = useProductContext();
    const { syncAll, syncPendingCount, isSyncing, isOnline } = useSync();
    const confirm = useConfirm();
    const [isForceSyncing, setIsForceSyncing] = useState(false);

    // UI States
    const [isSupportOpen, setIsSupportOpen] = useState(false);
    const [userLanguage, setUserLanguage] = useState('Français');
    const [showPinModal, setShowPinModal] = useState(false);
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [pinSuccess, setPinSuccess] = useState(false);
    const [notifsEnabled, setNotifsEnabled] = useState(true);

    // Role-based theme configuration
    const getRoleTheme = () => {
        switch (user?.role) {
            case 'PRODUCER':
                return {
                    primary: 'bg-amber-500',
                    secondary: 'text-amber-600',
                    bg: 'bg-amber-50',
                    darkBg: 'bg-amber-900/10',
                    label: 'Producteur',
                    homePath: '/producteur'
                };
            case 'COOPERATIVE':
                return {
                    primary: 'bg-purple-600',
                    secondary: 'text-purple-600',
                    bg: 'bg-purple-50',
                    darkBg: 'bg-purple-900/10',
                    label: 'Responsable Coop',
                    homePath: '/cooperative'
                };
            default:
                return {
                    primary: 'bg-emerald-600',
                    secondary: 'text-emerald-600',
                    bg: 'bg-emerald-50',
                    darkBg: 'bg-emerald-900/10',
                    label: 'Commerçant',
                    homePath: '/commercant'
                };
        }
    };

    const theme = getRoleTheme();

    useEffect(() => {
        const savedLang = localStorage.getItem('assistant_language');
        if (savedLang) setUserLanguage(savedLang);
    }, []);

    const handleLanguageChange = (lang: string) => {
        setUserLanguage(lang);
        updateLanguage(lang);
    };

    const handlePinUpdate = async () => {
        if (newPin.length < 4) {
            setPinError('Le code PIN doit faire au moins 4 chiffres');
            return;
        }
        if (newPin !== confirmPin) {
            setPinError('Les codes ne correspondent pas');
            return;
        }

        const success = await updatePin(newPin);
        if (success) {
            setPinSuccess(true);
            setTimeout(() => {
                setShowPinModal(false);
                setPinSuccess(false);
                setNewPin('');
                setConfirmPin('');
            }, 2000);
        } else {
            setPinError('Erreur technique lors de la mise à jour');
        }
    };

    const handleLogout = async () => {
        const ok = await confirm({
            title: 'Se déconnecter ?',
            message: 'Vous allez être déconnecté de votre profil.',
            confirmLabel: 'Me déconnecter'
        });
        if (ok) {
            logout();
            router.push('/login');
        }
    };

    const handleCloseAccount = () => {
        const text = encodeURIComponent(`DEMANDE DE CLÔTURE DE COMPTE : ${user?.name} (Tél: ${user?.phoneNumber}, Rôle: ${user?.role}).`);
        window.open(`https://wa.me/2250000000000?text=${text}`, '_blank');
    };

    const [supabaseStatus, setSupabaseStatus] = useState<'LOADING' | 'CONNECTED' | 'DISCONNECTED'>('LOADING');

    useEffect(() => {
        const checkSupabase = async () => {
            try {
                const { error } = await supabase.from('products').select('count', { count: 'exact', head: true });
                if (!error) setSupabaseStatus('CONNECTED');
                else setSupabaseStatus('DISCONNECTED');
            } catch (err) {
                setSupabaseStatus('DISCONNECTED');
            }
        };
        if (isOnline) checkSupabase(); // Changed navigator.onLine to isOnline
        else setSupabaseStatus('DISCONNECTED');
    }, [isOnline]); // Added isOnline to dependency array

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
            <SupportCenter
                isOpen={isSupportOpen}
                onClose={() => setIsSupportOpen(false)}
                merchantName={user?.name || 'Utilisateur'}
            />

            {/* Header Coloré (Card Overlap Style) */}
            <div className={`${theme.primary} pt-8 pb-32 px-4 rounded-b-[2.5rem] relative shadow-lg`}>
                <div className="flex justify-between items-center max-w-lg mx-auto mb-6">
                    <button
                        onClick={() => router.push(theme.homePath)}
                        className="w-10 h-10 bg-white text-slate-900 rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-center flex-1">
                        <h1 className="text-white font-bold text-lg tracking-wide uppercase">Mon Profil</h1>
                        <div className="flex items-center justify-center gap-1.5 mt-0.5">
                            <div className={`w-2 h-2 rounded-full ${supabaseStatus === 'CONNECTED' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' :
                                supabaseStatus === 'LOADING' ? 'bg-amber-400 animate-pulse' : 'bg-rose-400'
                                }`} />
                            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">
                                {supabaseStatus === 'CONNECTED' ? 'Connecté au Cloud' :
                                    supabaseStatus === 'LOADING' ? 'Vérification...' : 'Mode Hors-Ligne'}
                            </p>
                        </div>
                    </div>
                    <div className="w-10 h-10" /> {/* Spacer */}
                </div>
            </div>

            {/* Main Content Overlap */}
            <div className="px-4 max-w-lg mx-auto relative -mt-20 z-10 space-y-6">
                {/* User Identity Card */}
                <section className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center relative overflow-hidden group">
                    <div className={`w-20 h-20 ${theme.primary} rounded-[24px] flex items-center justify-center shadow-md mb-4 relative z-10`}>
                        <User size={32} className="text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter text-center leading-none relative z-10 uppercase">
                        {user?.name}
                    </h2>
                    <div className={`flex items-center gap-2 mt-4 bg-emerald-50 dark:bg-slate-800 px-4 py-1.5 rounded-full relative z-10 border border-emerald-100 dark:border-slate-700`}>
                        <span className={`text-emerald-600 dark:text-emerald-400 font-black text-[10px] uppercase tracking-[0.15em]`}>{theme.label}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-5 text-slate-400 font-bold text-[11px] uppercase tracking-widest">
                        <Phone size={14} className="text-emerald-500" /> {user?.phoneNumber}
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full mt-10">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-[24px] border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-1.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Membre depuis</span>
                            <span className="font-black text-slate-800 dark:text-white text-[11px] text-center uppercase">JANV. 2026</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-[24px] border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-1.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Statut Compte</span>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span className="font-black text-emerald-600 text-[11px] uppercase tracking-widest">Vérifié</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Preferences Section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 ml-4">
                        <div className="w-1 h-3 bg-emerald-500 rounded-full" />
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Préférences IA</h3>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 flex flex-col gap-5 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="bg-emerald-50 dark:bg-slate-800 p-3 rounded-2xl text-emerald-600">
                                <Globe size={20} />
                            </div>
                            <div>
                                <span className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider block">Langue de l'Assistant</span>
                                <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">L'IA vous répondra dans cette langue</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {['Français', 'Dioula', 'Baoulé'].map(lang => (
                                <button
                                    key={lang}
                                    onClick={() => handleLanguageChange(lang)}
                                    className={`flex-1 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${userLanguage === lang ? 'bg-primary border-primary text-white shadow-xl scale-[1.02]' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-transparent hover:border-slate-200'}`}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>
                    </div>

                    <ProfileMenuItem
                        icon={ShieldCheck}
                        label="Sécurité du compte (PIN)"
                        color="text-emerald-600"
                        bgColor="bg-emerald-50"
                        actionLabel="Changer"
                        onClick={() => setShowPinModal(true)}
                    />

                    <div className="w-full bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl text-slate-400">
                                <Bell size={20} />
                            </div>
                            <div>
                                <span className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider block">Notifications Sonores</span>
                                <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Messages et conseils IA</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setNotifsEnabled(!notifsEnabled)}
                            className={`w-12 h-7 rounded-full flex items-center p-1 transition-all duration-300 ${notifsEnabled ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                            <div className={`h-5 w-5 bg-white rounded-full shadow-lg transition-all duration-300 transform ${notifsEnabled ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <ProfileMenuItem
                        icon={HelpCircle}
                        label="Centre d'Assistance"
                        color="text-emerald-600"
                        bgColor="bg-emerald-50"
                        actionLabel="Aide"
                        onClick={() => setIsSupportOpen(true)}
                    />

                    <ProfileMenuItem
                        icon={RefreshCw}
                        label="Mettre à jour le catalogue"
                        color="text-blue-600"
                        bgColor="bg-blue-50"
                        actionLabel="Sync"
                        onClick={async () => {
                            await syncGlobalCatalog();
                            alert("Catalogue mis à jour avec les nouveaux produits !");
                        }}
                    />

                    {/* Bouton Sync des données */}
                    <button
                        onClick={async () => {
                            setIsForceSyncing(true);
                            await syncAll();
                            setTimeout(() => setIsForceSyncing(false), 2000);
                        }}
                        disabled={isForceSyncing || isSyncing}
                        className={`w-full p-5 rounded-[28px] border flex items-center gap-4 transition-all active:scale-[0.98] shadow-sm ${isForceSyncing || isSyncing
                            ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'
                            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:bg-slate-50'
                            }`}
                    >
                        <div className={`p-3 rounded-2xl ${isForceSyncing || isSyncing ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
                            }`}>
                            <RefreshCw size={20} className={isForceSyncing || isSyncing ? 'animate-spin' : ''} />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className={`font-black text-xs uppercase tracking-wider ${isForceSyncing || isSyncing ? 'text-emerald-600' : 'text-slate-900 dark:text-white'
                                }`}>
                                {isForceSyncing ? 'Synchronisation...' : 'Forcer la synchronisation'}
                            </span>
                            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">
                                {syncPendingCount > 0 ? `${syncPendingCount} opération(s) en attente` : 'Envoyer les données vers le cloud'}
                            </p>
                        </div>
                    </button>
                </section>

                {/* Sign Out Section */}
                <section className="pt-6 space-y-4">
                    <button
                        onClick={handleLogout}
                        className="w-full bg-slate-900 dark:bg-slate-800 text-white p-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                    >
                        <LogOut size={20} /> Se déconnecter
                    </button>

                    <button
                        onClick={handleCloseAccount}
                        className="w-full text-slate-400 p-4 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:text-rose-500 transition-colors flex items-center justify-center gap-2"
                    >
                        <Trash2 size={16} /> Fermer mon compte
                    </button>
                </section>
            </div>

            {/* PIN Change Modal */}
            <AnimatePresence>
                {showPinModal && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="bg-white dark:bg-slate-950 w-full max-w-md rounded-[48px] p-10 shadow-2xl overflow-hidden relative"
                        >
                            {pinSuccess ? (
                                <div className="py-12 flex flex-col items-center text-center gap-6">
                                    <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center animate-bounce">
                                        <CheckCircle2 size={56} />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black uppercase tracking-tighter">Code PIN Mis à Jour</h3>
                                        <p className="text-slate-500 font-bold mt-2">Votre nouveau code est maintenant actif.</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-start mb-10">
                                        <div>
                                            <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">Changer mon PIN</h3>
                                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2 italic">Minimum 4 chiffres</p>
                                        </div>
                                        <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                                            <KeyRound size={28} />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2 block">Nouveau PIN</span>
                                            <input
                                                type="password"
                                                maxLength={8}
                                                value={newPin}
                                                onChange={(e) => {
                                                    setNewPin(e.target.value.replace(/\D/g, ''));
                                                    setPinError('');
                                                }}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-6 rounded-[28px] text-3xl font-black tracking-[1em] text-center focus:border-blue-500 transition-colors"
                                                placeholder="••••"
                                            />
                                        </div>

                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2 block">Confirmer le PIN</span>
                                            <input
                                                type="password"
                                                maxLength={8}
                                                value={confirmPin}
                                                onChange={(e) => {
                                                    setConfirmPin(e.target.value.replace(/\D/g, ''));
                                                    setPinError('');
                                                }}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-6 rounded-[28px] text-3xl font-black tracking-[1em] text-center focus:border-blue-500 transition-colors"
                                                placeholder="••••"
                                            />
                                        </div>

                                        {pinError && (
                                            <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold border border-rose-100">
                                                <AlertTriangle size={18} /> {pinError}
                                            </div>
                                        )}

                                        <div className="flex gap-4 pt-4">
                                            <button
                                                onClick={() => setShowPinModal(false)}
                                                className="flex-1 py-6 rounded-[28px] font-black uppercase tracking-widest text-slate-400 border-2 border-slate-50 dark:border-slate-800 active:scale-95 transition-all"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                onClick={handlePinUpdate}
                                                className="flex-[2] bg-slate-900 text-white py-6 rounded-[28px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:bg-black"
                                            >
                                                Sauvegarder
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}

function ProfileMenuItem({ icon: Icon, label, color, bgColor, actionLabel, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className="w-full bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-100 dark:border-slate-800 flex items-center justify-between group active:scale-[0.98] transition-all shadow-sm"
        >
            <div className="flex items-center gap-4">
                <div className={`bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl ${color}`}>
                    <Icon size={20} />
                </div>
                <div>
                    <span className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider">{label}</span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                {actionLabel && <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-md">{actionLabel}</span>}
                <div className="text-slate-300 group-hover:translate-x-1 transition-transform">
                    <ChevronLeft size={18} className="rotate-180" />
                </div>
            </div>
        </button>
    );
}
