'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    User,
    Phone,
    ShieldCheck,
    LogOut,
    Store,
    Trash2,
    Bell,
    HelpCircle,
    Globe,
    KeyRound,
    CheckCircle2,
    AlertTriangle,
    Navigation2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useProfileContext } from '@/context/ProfileContext';
import { SupportCenter } from '@/components/SupportCenter';
import { useConfirm } from '@/context/ConfirmContext';

export default function ProfilePage() {
    const router = useRouter();
    const { user, logout, updatePin, updateLanguage } = useAuth();
    const { activeProfile } = useProfileContext();
    const confirm = useConfirm();

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

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-3 pb-32 max-w-2xl mx-auto">
            <SupportCenter
                isOpen={isSupportOpen}
                onClose={() => setIsSupportOpen(false)}
                merchantName={user?.name || 'Utilisateur'}
            />

            {/* Header */}
            <header className="flex items-center gap-4 mb-4 pt-2">
                <button
                    onClick={() => router.push(theme.homePath)}
                    className="w-10 h-10 md:w-14 md:h-14 bg-white dark:bg-slate-900 rounded-xl md:rounded-[22px] shadow-sm flex items-center justify-center text-slate-600 active:scale-90 transition-all border-2 border-slate-100 dark:border-slate-800"
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Profil & Paramètres</h1>
            </header>

            <div className="space-y-8">
                {/* User Identity Card */}
                <section className="bg-white dark:bg-slate-900 p-4 md:p-10 rounded-[32px] md:rounded-[48px] shadow-sm border-2 border-slate-100 dark:border-slate-800 flex flex-col items-center relative overflow-hidden group">
                    <div className={`w-16 h-16 md:w-24 md:h-24 ${theme.primary} rounded-[20px] md:rounded-[35px] flex items-center justify-center shadow-xl mb-4 relative z-10`}>
                        <User size={32} className="text-white" />
                    </div>
                    <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter text-center leading-none relative z-10">
                        {user?.name}
                    </h2>
                    <div className={`flex items-center gap-2 mt-2 ${theme.bg} dark:${theme.darkBg} px-4 py-1.5 rounded-full relative z-10`}>
                        <Navigation2 size={10} className={theme.secondary} />
                        <span className={`${theme.secondary} font-black text-[9px] uppercase tracking-[0.2em]`}>{theme.label}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest leading-none">
                        <Phone size={12} /> {user?.phoneNumber}
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full mt-6">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-[20px] border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-1 group-hover:scale-[1.02] transition-transform">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Membre depuis</span>
                            <span className="font-black text-slate-900 dark:text-white uppercase text-[9px]">Jan 2026</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-[20px] border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-1 group-hover:scale-[1.02] transition-transform">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Statut</span>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="font-black text-emerald-600 uppercase text-[9px]">Vérifié</span>
                            </div>
                        </div>
                    </div>

                    {/* Decorative Background Icon */}
                    <div className="absolute -right-8 -top-8 opacity-[0.03] group-hover:rotate-12 transition-transform duration-700">
                        <User size={200} />
                    </div>
                </section>

                {/* Preferences Section */}
                <section className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-8 mb-4">Expérience vocale</h3>

                    <div className="bg-white dark:bg-slate-900 p-4 md:p-8 rounded-[32px] md:rounded-[40px] border-2 border-slate-100 dark:border-slate-800 flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-purple-100 dark:bg-purple-900/30 p-2.5 rounded-xl text-purple-600">
                                <Globe size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <span className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-tight">Langue de l'Assistant</span>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">L'IA vous répondra dans cette langue</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {['Français', 'Dioula', 'Baoulé'].map(lang => (
                                <button
                                    key={lang}
                                    onClick={() => handleLanguageChange(lang)}
                                    className={`py-3 rounded-lg md:rounded-[22px] font-black uppercase text-[9px] tracking-widest transition-all ${userLanguage === lang ? 'bg-purple-600 text-white shadow-xl' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700 hover:border-purple-200'}`}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>
                    </div>

                    <ProfileMenuItem
                        icon={ShieldCheck}
                        label="Sécurité du compte (PIN)"
                        color="text-blue-600"
                        bgColor="bg-blue-50"
                        actionLabel="Changer"
                        onClick={() => setShowPinModal(true)}
                    />

                    <div className="w-full bg-white dark:bg-slate-900 p-4 md:p-6 rounded-[32px] md:rounded-[40px] border-2 border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="bg-amber-50 dark:bg-amber-900/30 p-2.5 rounded-xl text-amber-600 font-bold">
                                <Bell size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <span className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-tight">Alertes & Notifications</span>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Messages et conseils IA</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setNotifsEnabled(!notifsEnabled)}
                            className={`w-12 h-7 rounded-full flex items-center p-1 transition-all duration-300 ${notifsEnabled ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                            <div className={`h-5 w-5 bg-white rounded-full shadow-md transition-all duration-300 transform ${notifsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <ProfileMenuItem
                        icon={HelpCircle}
                        label="Assistance & Support"
                        color="text-emerald-600"
                        bgColor="bg-emerald-50"
                        actionLabel="Ouvrir"
                        onClick={() => setIsSupportOpen(true)}
                    />
                </section>

                {/* Sign Out Section */}
                <section className="pt-4 space-y-3">
                    <button
                        onClick={handleLogout}
                        className="w-full bg-slate-900 dark:bg-slate-800 text-white p-5 rounded-[24px] font-black uppercase tracking-[0.2em] text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 group"
                    >
                        <LogOut size={24} className="group-hover:translate-x-2 transition-transform" /> Se déconnecter
                    </button>

                    <button
                        onClick={handleCloseAccount}
                        className="w-full bg-rose-50 dark:bg-rose-900/10 text-rose-500 p-5 rounded-[24px] font-black uppercase tracking-[0.2em] text-[9px] active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-rose-100 dark:hover:bg-rose-900/20"
                    >
                        <Trash2 size={20} /> Fermer mon compte
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
            className="w-full bg-white dark:bg-slate-900 p-4 rounded-[28px] border-2 border-slate-100 dark:border-slate-800 flex items-center justify-between group active:scale-[0.98] transition-all hover:shadow-lg"
        >
            <div className="flex items-center gap-4">
                <div className={`${bgColor} p-2.5 rounded-xl ${color} transition-all group-hover:scale-110`}>
                    <Icon size={20} strokeWidth={2.5} />
                </div>
                <div>
                    <span className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-tight">{label}</span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                {actionLabel && <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 group-hover:text-slate-500 transition-colors">{actionLabel}</span>}
                <div className="bg-slate-50 dark:bg-slate-800 p-1.5 rounded-full text-slate-300 group-hover:translate-x-1 transition-all">
                    <ChevronLeft size={16} className="rotate-180" />
                </div>
            </div>
        </button>
    );
}
