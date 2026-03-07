'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, User, ArrowLeft, Lock, AlertCircle, Delete, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

type Step = 'PHONE' | 'OTP' | 'PIN';

const ROLES = [
    { value: 'MERCHANT', label: 'Commerçant' },
    { value: 'PRODUCER', label: 'Producteur' },
    { value: 'COOPERATIVE', label: 'Coopérative' },
    { value: 'FIELD_AGENT', label: 'Agent' },
] as const;

const getDashboardPath = (role: string | undefined) => {
    switch (role) {
        case 'SUPERVISOR': return '/admin';
        case 'PRODUCER': return '/producteur';
        case 'COOPERATIVE': return '/cooperative';
        case 'FIELD_AGENT': return '/agent';
        default: return '/commercant';
    }
};

export default function SignupPage() {
    const router = useRouter();
    const { signup, isAuthenticated, user } = useAuth();

    // Step state
    const [step, setStep] = useState<Step>('PHONE');

    // Form fields
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState<typeof ROLES[number]['value']>('MERCHANT');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (isAuthenticated && user) {
            router.push(getDashboardPath(user.role));
        }
    }, [isAuthenticated, user, router]);

    // Hardware back button support
    useEffect(() => {
        const handlePopState = () => {
            if (step === 'OTP') { setStep('PHONE'); window.history.pushState(null, '', window.location.pathname); }
            else if (step === 'PIN') { setStep('OTP'); window.history.pushState(null, '', window.location.pathname); }
        };
        if (step !== 'PHONE') {
            window.history.pushState(null, '', window.location.pathname);
            window.addEventListener('popstate', handlePopState);
        }
        return () => window.removeEventListener('popstate', handlePopState);
    }, [step]);

    if (isAuthenticated) return null;

    // ── Step 1: Phone ─────────────────────────────────────────────────────────

    const handlePhoneSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (name.trim().length < 2) { setError('Veuillez entrer votre nom complet.'); return; }
        if (phone.replace(/\D/g, '').length < 8) { setError('Numéro de téléphone invalide.'); return; }
        setOtp(['', '', '', '', '', '']);
        setStep('OTP');
        // Auto-focus first OTP input after render
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
    };

    // ── Step 2: OTP ───────────────────────────────────────────────────────────

    const handleOtpChange = (index: number, value: string) => {
        const digit = value.replace(/\D/g, '').slice(-1);
        const next = [...otp];
        next[index] = digit;
        setOtp(next);
        if (digit && index < 5) otpRefs.current[index + 1]?.focus();
        if (next.every(d => d !== '') && next.length === 6) {
            setStep('PIN');
            setPin('');
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (otp[index]) {
                const next = [...otp]; next[index] = ''; setOtp(next);
            } else if (index > 0) {
                otpRefs.current[index - 1]?.focus();
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            otpRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length > 0) {
            const next = pasted.split('').concat(Array(6).fill('')).slice(0, 6);
            setOtp(next);
            const focusIdx = Math.min(pasted.length, 5);
            otpRefs.current[focusIdx]?.focus();
            if (pasted.length === 6) setTimeout(() => { setStep('PIN'); setPin(''); }, 150);
        }
    };

    // ── Step 3: PIN ───────────────────────────────────────────────────────────

    const handlePinPress = (val: string) => {
        if (pin.length < 4) {
            const next = pin + val;
            setPin(next);
            if (next.length === 4) handleSignup(next);
        }
    };

    const handleSignup = async (finalPin: string) => {
        const fullPhone = `+225${phone.replace(/\D/g, '')}`;
        const success = await signup(name.trim(), fullPhone, finalPin, role);
        if (!success) {
            setError('Ce numéro est déjà utilisé ou une erreur est survenue.');
            setPin('');
            setStep('PHONE');
        }
    };

    // ── UI helpers ─────────────────────────────────────────────────────────────

    const stepIndex = step === 'PHONE' ? 0 : step === 'OTP' ? 1 : 2;

    return (
        <main className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-50 dark:bg-emerald-950/30 rounded-full blur-3xl opacity-60 pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-50 dark:bg-blue-950/30 rounded-full blur-3xl opacity-60 pointer-events-none" />

            <div className="w-full max-w-sm relative z-10">

                {/* Header */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-16 h-16 bg-emerald-600 rounded-[20px] mx-auto mb-4 flex items-center justify-center shadow-xl shadow-emerald-100 dark:shadow-none"
                    >
                        <User size={30} className="text-white" />
                    </motion.div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Nouveau Compte</h1>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Rejoignez l'écosystème marchand</p>
                </div>

                {/* Progress dots */}
                <div className="flex justify-center gap-2 mb-8">
                    {[0, 1, 2].map(i => (
                        <motion.div
                            key={i}
                            animate={{ width: i === stepIndex ? 24 : 8, backgroundColor: i <= stepIndex ? '#059669' : '#e2e8f0' }}
                            transition={{ duration: 0.3 }}
                            className="h-2 rounded-full"
                        />
                    ))}
                </div>

                <AnimatePresence mode="wait">

                    {/* ── STEP 1: PHONE ── */}
                    {step === 'PHONE' && (
                        <motion.form
                            key="phone"
                            initial={{ opacity: 0, x: -24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 24 }}
                            onSubmit={handlePhoneSubmit}
                            className="space-y-4"
                        >
                            {/* Name */}
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4 mb-1.5 block">Votre Nom</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Nom complet"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-10 pr-4 font-bold text-base text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4 mb-1.5 block">Numéro de Téléphone</label>
                                <div className="flex gap-2">
                                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-3 py-4 shrink-0">
                                        <span className="text-base">🇨🇮</span>
                                        <span className="font-black text-sm text-slate-500">+225</span>
                                    </div>
                                    <div className="relative flex-1">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            placeholder="07 00 00 00 00"
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-10 pr-4 font-bold text-base text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Role */}
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4 mb-1.5 block">Votre Rôle</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {ROLES.map(r => (
                                        <button
                                            key={r.value}
                                            type="button"
                                            onClick={() => setRole(r.value)}
                                            className={`py-3 rounded-xl border-2 font-black text-xs transition-all active:scale-95 ${role === r.value ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100 dark:shadow-none' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500'}`}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-2xl font-bold text-sm">
                                    <AlertCircle size={18} className="shrink-0" /> {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-100 dark:shadow-none active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
                            >
                                Continuer <ChevronRight size={16} />
                            </button>

                            <button
                                type="button"
                                onClick={() => router.push('/login')}
                                className="w-full py-3 text-slate-400 font-black text-[10px] uppercase tracking-widest"
                            >
                                J'ai déjà un compte
                            </button>
                        </motion.form>
                    )}

                    {/* ── STEP 2: OTP ── */}
                    {step === 'OTP' && (
                        <motion.div
                            key="otp"
                            initial={{ opacity: 0, x: -24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 24 }}
                            className="flex flex-col items-center"
                        >
                            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4">
                                <Phone size={24} className="text-blue-600" />
                            </div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-1">Code de Vérification</h2>
                            <p className="text-slate-400 font-bold text-xs text-center mb-6">
                                Un code SMS a été envoyé au<br />
                                <span className="text-slate-700 dark:text-slate-300">+225 {phone}</span>
                            </p>

                            {/* 6 OTP inputs */}
                            <div className="flex gap-2 mb-6" onPaste={handleOtpPaste}>
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={el => { otpRefs.current[i] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={e => handleOtpChange(i, e.target.value)}
                                        onKeyDown={e => handleOtpKeyDown(i, e)}
                                        className={`w-11 h-14 text-center text-xl font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border-2 rounded-xl outline-none transition-all ${digit ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700 focus:border-blue-400'}`}
                                    />
                                ))}
                            </div>

                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-6">
                                Pas reçu le code ? <button className="text-emerald-600 underline underline-offset-2">Renvoyer</button>
                            </p>

                            <button
                                onClick={() => { setStep('PHONE'); setOtp(['', '', '', '', '', '']); }}
                                className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest"
                            >
                                <ArrowLeft size={14} /> Retour
                            </button>
                        </motion.div>
                    )}

                    {/* ── STEP 3: PIN ── */}
                    {step === 'PIN' && (
                        <motion.div
                            key="pin"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex flex-col items-center"
                        >
                            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-4">
                                <Lock size={24} className="text-emerald-600" />
                            </div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-1">Code PIN Secret</h2>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest text-center mb-6">
                                Choisissez 4 chiffres pour sécuriser votre compte
                            </p>

                            {/* PIN dots */}
                            <div className="flex gap-4 mb-8">
                                {[0, 1, 2, 3].map(i => (
                                    <motion.div
                                        key={i}
                                        animate={{ scale: pin.length > i ? 1.2 : 1 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                        className={`w-5 h-5 rounded-full border-2 transition-all duration-150 ${pin.length > i ? 'bg-emerald-600 border-emerald-600' : 'border-slate-200 dark:border-slate-700'}`}
                                    />
                                ))}
                            </div>

                            {/* Numpad */}
                            <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'BACK', 0, 'DEL'].map(val => (
                                    <React.Fragment key={val}>
                                        {val === 'BACK' ? (
                                            <button
                                                onClick={() => { setStep('OTP'); setPin(''); }}
                                                className="aspect-square flex items-center justify-center text-slate-300 hover:text-slate-500 transition-colors active:scale-90"
                                            >
                                                <ArrowLeft size={22} />
                                            </button>
                                        ) : val === 'DEL' ? (
                                            <button
                                                onClick={() => setPin(p => p.slice(0, -1))}
                                                className="aspect-square flex items-center justify-center text-slate-300 hover:text-slate-700 dark:hover:text-slate-200 transition-colors active:scale-90"
                                            >
                                                <Delete size={22} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handlePinPress(val.toString())}
                                                className="aspect-square bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-2xl font-black text-slate-900 dark:text-white shadow-sm active:scale-90 active:bg-emerald-50 dark:active:bg-emerald-900/20 transition-all"
                                            >
                                                {val}
                                            </button>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-2xl font-bold text-sm mt-4 w-full">
                                    <AlertCircle size={18} className="shrink-0" /> {error}
                                </div>
                            )}
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </main>
    );
}
