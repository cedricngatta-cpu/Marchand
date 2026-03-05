'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, User, CheckCircle2, ChevronRight, ArrowLeft, Lock, AlertCircle, Delete, Camera, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function SignupPage() {
    const router = useRouter();
    const { signup, isAuthenticated, user } = useAuth();

    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [pin, setPin] = useState('');
    const [role, setRole] = useState<'MERCHANT' | 'PRODUCER' | 'COOPERATIVE' | 'FIELD_AGENT'>('MERCHANT');
    const [error, setError] = useState('');
    const [step, setStep] = useState<'IDENTITY' | 'PHOTO' | 'LOCATION' | 'PIN'>('IDENTITY');
    const [photo, setPhoto] = useState<string | null>(null);
    const [location, setLocation] = useState<string>('');

    const getDashboardPath = (role: string | undefined) => {
        switch (role) {
            case 'SUPERVISOR': return '/admin';
            case 'PRODUCER': return '/producteur';
            case 'COOPERATIVE': return '/cooperative';
            case 'FIELD_AGENT': return '/agent';
            case 'MERCHANT':
            default: return '/commercant';
        }
    };

    useEffect(() => {
        if (isAuthenticated && user) {
            router.push(getDashboardPath(user.role));
        }
    }, [isAuthenticated, user, router]);

    if (isAuthenticated) return null;

    const handleIdentitySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.length >= 3 && phoneNumber.length >= 8) {
            setStep('PHOTO');
            setError('');
        } else {
            setError('Veuillez remplir correctement tous les champs');
        }
    };

    const handlePinPress = (num: string) => {
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);
            if (newPin.length === 4) {
                handleSignup(newPin);
            }
        }
    };

    const handleSignup = async (finalPin: string) => {
        const success = await signup(name, phoneNumber, finalPin, role);
        if (success) {
            // Success handled by useEffect
        } else {
            setError('Ce numéro est déjà utilisé');
            setPin('');
            setStep('IDENTITY');
        }
    };

    return (
        <main className="min-h-screen bg-white dark:bg-slate-950 flex flex-col p-6 items-center justify-center relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute -top-20 -left-20 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-50" />
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-emerald-50 rounded-full blur-3xl opacity-50" />

            <div className="w-full max-w-md relative z-10">
                {/* Header */}
                <header className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-20 h-20 bg-blue-600 rounded-[28px] mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-blue-100"
                    >
                        <User size={40} className="text-white" />
                    </motion.div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter line-clamp-1">Nouveau Compte</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Rejoignez l'écosystème marchand</p>
                </header>

                <AnimatePresence mode="wait">
                    {step === 'IDENTITY' ? (
                        <motion.form
                            key="id-step"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onSubmit={handleIdentitySubmit}
                            className="space-y-6"
                        >
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-6 mb-1 block">Votre Nom</label>
                                <div className="relative">
                                    <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Kouamé"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-4 border-slate-100 dark:border-slate-800 rounded-[32px] p-5 pl-14 font-black text-xl text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all uppercase tracking-tight"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-6 mb-1 block">Numéro de Téléphone</label>
                                <div className="relative">
                                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                    <input
                                        type="tel"
                                        placeholder="0102030405"
                                        value={phoneNumber}
                                        onChange={e => setPhoneNumber(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-4 border-slate-100 dark:border-slate-800 rounded-[32px] p-5 pl-14 font-black text-xl text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all uppercase tracking-tight"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-6 mb-1 block">Votre Rôle</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {(['MERCHANT', 'PRODUCER', 'COOPERATIVE', 'FIELD_AGENT'] as const).map(r => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setRole(r)}
                                            className={`p-4 rounded-2xl border-2 font-black text-xs transition-all ${role === r ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 hover:border-blue-200'}`}
                                        >
                                            {r === 'MERCHANT' ? 'Commerçant' :
                                                r === 'PRODUCER' ? 'Producteur' :
                                                    r === 'COOPERATIVE' ? 'Coopérative' : 'Agent'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-3 bg-rose-50 p-4 rounded-2xl text-rose-600 font-bold text-sm">
                                    <AlertCircle size={20} /> {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full bg-slate-900 dark:bg-blue-600 text-white p-6 rounded-[32px] font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-slate-200 dark:shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-4"
                            >
                                Créer mon PIN <ChevronRight size={20} />
                            </button>

                            <button
                                type="button"
                                onClick={() => router.push('/login')}
                                className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-blue-600 transition-colors"
                            >
                                J'ai déjà un compte
                            </button>
                        </motion.form>
                    ) : step === 'PHOTO' ? (
                        <motion.div
                            key="photo-step"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-8 text-center"
                        >
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Photo de profil</h2>
                            <p className="text-sm font-bold text-slate-400">Pour sécuriser votre compte et renforcer la confiance.</p>

                            <div
                                onClick={() => setPhoto('captured')}
                                className={`w-40 h-40 mx-auto rounded-[40px] border-4 flex flex-col items-center justify-center cursor-pointer transition-all ${photo ? 'bg-emerald-50 border-emerald-500 text-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-500'}`}
                            >
                                {photo ? <CheckCircle2 size={48} /> : <Camera size={48} />}
                                <span className="text-xs font-black uppercase mt-2">{photo ? 'Photo OK' : 'Prendre une photo'}</span>
                            </div>

                            <button
                                onClick={() => setStep('LOCATION')}
                                disabled={!photo}
                                className="w-full bg-slate-900 dark:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white p-6 rounded-[32px] font-black uppercase tracking-[0.2em] text-sm shadow-2xl active:scale-95 transition-all"
                            >
                                Continuer
                            </button>
                            <button
                                onClick={() => setStep('IDENTITY')}
                                className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-blue-600 transition-colors"
                            >
                                Retour
                            </button>
                        </motion.div>
                    ) : step === 'LOCATION' ? (
                        <motion.div
                            key="location-step"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-8 text-center"
                        >
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Emplacement</h2>
                            <p className="text-sm font-bold text-slate-400">Où se trouve votre activité ?</p>

                            <div
                                onClick={() => {
                                    setLocation('Géolocalisation réussie');
                                }}
                                className={`w-40 h-40 mx-auto rounded-[40px] border-4 flex flex-col items-center justify-center cursor-pointer transition-all ${location ? 'bg-emerald-50 border-emerald-500 text-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-500'}`}
                            >
                                {location ? <CheckCircle2 size={48} /> : <MapPin size={48} />}
                                <span className="text-xs font-black uppercase mt-2 text-center px-4">{location || 'Me géolocaliser'}</span>
                            </div>

                            <button
                                onClick={() => setStep('PIN')}
                                disabled={!location}
                                className="w-full bg-slate-900 dark:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white p-6 rounded-[32px] font-black uppercase tracking-[0.2em] text-sm shadow-2xl active:scale-95 transition-all"
                            >
                                Créer mon PIN
                            </button>
                            <button
                                onClick={() => setStep('PHOTO')}
                                className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-blue-600 transition-colors"
                            >
                                Retour
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="pin-setup"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex flex-col items-center"
                        >
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 text-center">Définissez votre PIN secret (4 chiffres)</label>

                            {/* PIN Dots */}
                            <div className="flex gap-6 mb-12">
                                {[0, 1, 2, 3].map(i => (
                                    <div
                                        key={i}
                                        className={`w-6 h-6 rounded-full border-4 transition-all duration-100 ${pin.length > i ? 'bg-blue-600 border-blue-600 scale-125' : 'bg-transparent border-slate-200'}`}
                                    />
                                ))}
                            </div>

                            {/* Wave Pad */}
                            <div className="grid grid-cols-3 gap-6 w-full max-w-[320px]">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'BACK', 0, 'DEL'].map(val => (
                                    <React.Fragment key={val}>
                                        {val === 'BACK' ? (
                                            <button
                                                onClick={() => setStep('LOCATION')}
                                                className="aspect-square flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors"
                                            >
                                                <ArrowLeft size={32} />
                                            </button>
                                        ) : val === 'DEL' ? (
                                            <button
                                                onClick={() => setPin(prev => prev.slice(0, -1))}
                                                className="aspect-square flex items-center justify-center text-slate-300 hover:text-slate-900 transition-colors"
                                            >
                                                <Delete size={32} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handlePinPress(val.toString())}
                                                className="aspect-square bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[24px] flex items-center justify-center text-3xl font-black text-slate-900 dark:text-white shadow-lg active:scale-90 active:bg-blue-50 transition-all"
                                            >
                                                {val}
                                            </button>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}
