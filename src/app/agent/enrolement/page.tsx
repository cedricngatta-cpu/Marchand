'use client';

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Camera, User, Phone, Store, CheckCircle2, ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

type Step = 'PHOTO' | 'INFO' | 'SUCCESS';
type Role = 'MERCHANT' | 'PRODUCER';

async function compressImage(file: File): Promise<string> {
    return new Promise(resolve => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            const MAX = 900;
            let { width, height } = img;
            if (width > MAX || height > MAX) {
                if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
                else { width = Math.round(width * MAX / height); height = MAX; }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL('image/jpeg', 0.72));
        };
        img.src = url;
    });
}

export default function AgentEnrollment() {
    const router = useRouter();
    const { user } = useAuth();
    const fileRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState<Step>('PHOTO');
    const [photo, setPhoto] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [storeName, setStoreName] = useState('');
    const [role, setRole] = useState<Role>('MERCHANT');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const compressed = await compressImage(file);
        setPhoto(compressed);
    };

    const handleSubmit = async () => {
        if (!name.trim() || !phone.trim()) return;
        setSaving(true);
        setError('');
        try {
            // Vérifier si le numéro existe déjà
            const { data: existing } = await supabase
                .from('profiles')
                .select('id')
                .eq('phone_number', phone.trim())
                .maybeSingle();

            if (existing) {
                setError('Ce numéro est déjà enregistré dans le système.');
                setSaving(false);
                return;
            }

            const { error: insertError } = await supabase.from('agent_enrollments').insert([{
                agent_id: user?.id,
                name: name.trim(),
                phone: phone.trim(),
                role,
                store_name: storeName.trim() || (role === 'PRODUCER' ? 'Ma Ferme' : 'Ma Boutique'),
                photo_url: photo,
                status: 'PENDING',
            }]);

            if (insertError) throw insertError;
            setStep('SUCCESS');
        } catch (err) {
            console.error('[Enrôlement] error:', err);
            setError('Erreur lors de l\'enregistrement. Réessaie.');
        } finally {
            setSaving(false);
        }
    };

    const reset = () => {
        setStep('PHOTO');
        setName('');
        setPhone('');
        setStoreName('');
        setPhoto(null);
        setError('');
        setRole('MERCHANT');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 overflow-x-hidden">

            {/* ── Header ── */}
            <div className="bg-cyan-600 pt-8 pb-32 px-4 rounded-b-[2.5rem] shadow-lg">
                <div className="flex items-center justify-between mb-6 max-w-lg mx-auto">
                    <button
                        onClick={() => step === 'INFO' ? setStep('PHOTO') : router.back()}
                        className="w-10 h-10 bg-white text-cyan-600 rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm shrink-0"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="text-center">
                        <h1 className="text-white font-bold text-lg tracking-wide uppercase leading-none">Enrôlement</h1>
                        <p className="text-cyan-200 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                            {step === 'PHOTO' ? 'Étape 1 — Photo' : step === 'INFO' ? 'Étape 2 — Informations' : 'Terminé !'}
                        </p>
                    </div>
                    <div className="w-10" />
                </div>

                {/* Barre de progression */}
                {step !== 'SUCCESS' && (
                    <div className="max-w-lg mx-auto flex gap-2 px-4">
                        <div className="h-1.5 flex-1 rounded-full bg-white" />
                        <div className={`h-1.5 flex-1 rounded-full transition-all ${step === 'INFO' ? 'bg-white' : 'bg-white/30'}`} />
                    </div>
                )}
            </div>

            {/* ── Contenu ── */}
            <div className="px-4 max-w-lg mx-auto relative mt-[-80px] z-10">
                <AnimatePresence mode="wait">

                    {/* PHOTO */}
                    {step === 'PHOTO' && (
                        <motion.div key="photo" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
                            <div
                                onClick={() => fileRef.current?.click()}
                                className={`bg-white dark:bg-slate-900 rounded-[28px] border-2 border-dashed shadow-xl transition-all cursor-pointer active:scale-[0.98] flex flex-col items-center justify-center gap-4 p-8 min-h-[260px] ${photo ? 'border-cyan-400' : 'border-slate-200 dark:border-slate-700 hover:border-cyan-300'}`}
                            >
                                {photo ? (
                                    <>
                                        <img src={photo} alt="preview" className="w-full max-h-52 object-cover rounded-[20px]" />
                                        <div className="flex items-center gap-2 text-cyan-600">
                                            <ImageIcon size={14} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Appuyer pour changer</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-20 h-20 bg-cyan-50 dark:bg-cyan-900/20 rounded-full flex items-center justify-center">
                                            <Camera size={36} className="text-cyan-500" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-black uppercase tracking-widest text-sm text-slate-700 dark:text-white">Prendre une photo</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Du marchand et de sa boutique</p>
                                        </div>
                                    </>
                                )}
                            </div>
                            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setStep('INFO')}
                                className="w-full bg-cyan-600 text-white py-5 rounded-[20px] font-black text-sm uppercase tracking-widest shadow-lg shadow-cyan-200 dark:shadow-none active:scale-95 transition-all"
                            >
                                {photo ? 'Continuer avec cette photo' : 'Passer sans photo'}
                            </motion.button>
                        </motion.div>
                    )}

                    {/* INFO */}
                    {step === 'INFO' && (
                        <motion.div key="info" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-3">
                            <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-xl border border-slate-100 dark:border-slate-800 p-5 space-y-4">

                                {/* Type */}
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Type de membre</label>
                                    <div className="flex gap-2">
                                        {(['MERCHANT', 'PRODUCER'] as Role[]).map(r => (
                                            <button
                                                key={r}
                                                onClick={() => setRole(r)}
                                                className={`flex-1 py-3 rounded-[14px] font-black text-[10px] uppercase tracking-wider transition-all ${role === r ? 'bg-cyan-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}
                                            >
                                                {r === 'MERCHANT' ? 'Marchand' : 'Producteur'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Nom */}
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">Nom complet</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Ex: Moussa Coulibaly"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 px-4 pl-10 font-bold text-sm text-slate-800 dark:text-white outline-none focus:border-cyan-500 transition-all placeholder:text-slate-300"
                                        />
                                    </div>
                                </div>

                                {/* Téléphone */}
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">Téléphone</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <input
                                            type="tel"
                                            placeholder="07 00 00 00 00"
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 px-4 pl-10 font-bold text-sm text-slate-800 dark:text-white outline-none focus:border-cyan-500 transition-all placeholder:text-slate-300"
                                        />
                                    </div>
                                </div>

                                {/* Boutique */}
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">
                                        {role === 'PRODUCER' ? 'Nom de la ferme' : 'Nom de la boutique'}
                                        <span className="text-slate-300 normal-case ml-1">(optionnel)</span>
                                    </label>
                                    <div className="relative">
                                        <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <input
                                            type="text"
                                            placeholder={role === 'PRODUCER' ? 'Ma Ferme' : 'Ma Boutique'}
                                            value={storeName}
                                            onChange={e => setStoreName(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 px-4 pl-10 font-bold text-sm text-slate-800 dark:text-white outline-none focus:border-cyan-500 transition-all placeholder:text-slate-300"
                                        />
                                    </div>
                                </div>

                                {error && <p className="text-rose-500 text-xs font-bold text-center">{error}</p>}
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                disabled={!name.trim() || !phone.trim() || saving}
                                onClick={handleSubmit}
                                className="w-full bg-cyan-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 py-5 rounded-[20px] font-black text-sm uppercase tracking-widest shadow-lg shadow-cyan-200 dark:shadow-none flex items-center justify-center gap-2 active:scale-95 transition-all"
                            >
                                {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                {saving ? 'Enregistrement...' : 'Finaliser l\'Enrôlement'}
                            </motion.button>
                        </motion.div>
                    )}

                    {/* SUCCESS */}
                    {step === 'SUCCESS' && (
                        <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 pt-6">
                            <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-xl border border-slate-100 dark:border-slate-800 p-8 flex flex-col items-center gap-5 text-center">
                                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                                    <CheckCircle2 size={40} className="text-emerald-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Enrôlement enregistré !</h2>
                                    <p className="text-slate-500 text-sm font-bold mt-1">
                                        {name} a été enregistré{role === 'PRODUCER' ? 'e comme producteur' : ' comme marchand'}.
                                    </p>
                                    <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider mt-2">
                                        En attente de validation par la coopérative
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={reset}
                                    className="py-4 rounded-[18px] border-2 border-cyan-200 dark:border-cyan-800 text-cyan-600 font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                                >
                                    Nouveau
                                </button>
                                <button
                                    onClick={() => router.push('/agent')}
                                    className="py-4 rounded-[18px] bg-slate-900 dark:bg-slate-800 text-white font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                                >
                                    Tableau de bord
                                </button>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}
