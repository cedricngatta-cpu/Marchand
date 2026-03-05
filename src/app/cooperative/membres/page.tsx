'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Phone, MapPin, TrendingUp, AlertCircle, Mic, Send, Star, ShieldCheck, UserPlus, X, CheckCircle2, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CooperativeMembers() {
    const router = useRouter();
    const [selectedZone, setSelectedZone] = useState('Tous');
    const [isAlertMode, setIsAlertMode] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showSectorDropdown, setShowSectorDropdown] = useState(false);

    // Form State
    const [newMember, setNewMember] = useState({
        name: '',
        phone: '',
        location: 'Bouaké',
        role: 'Membre'
    });

    const members = [
        { id: 1, name: 'Koffi Yao', phone: '07 08 09 10 11', location: 'Bouaké', status: 'ACTIVE', sales: 125000, trend: '+12%', role: 'Champion', joins: 12 },
        { id: 2, name: 'Fatou Traoré', phone: '05 06 07 08 09', location: 'Yamoussoukro', status: 'ACTIVE', sales: 85000, trend: '+5%', role: 'Membre', joins: 8 },
        { id: 3, name: 'Adama Diallo', phone: '01 02 03 04 05', location: 'Bouaké', status: 'WARNING', sales: 12000, trend: '-20%', role: 'Nouveau', joins: 1 },
        { id: 4, name: 'Marie Koné', phone: '04 05 06 07 08', location: 'Abidjan', status: 'ACTIVE', sales: 310000, trend: '+25%', role: 'Expert', joins: 24 },
    ];

    const handleAddMember = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSuccess(true);
        setTimeout(() => {
            setIsSuccess(false);
            setShowAddModal(false);
            setNewMember({ name: '', phone: '', location: 'Bouaké', role: 'Membre' });
        }, 2000);
    };

    const filteredMembers = selectedZone === 'Tous'
        ? members
        : members.filter(m => m.location === selectedZone);

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 max-w-4xl mx-auto pb-32 md:pb-48">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pt-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm text-slate-600 dark:text-slate-300 active:scale-90 transition-all border-2 border-slate-100 dark:border-slate-800 shrink-0"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Nos Membres</h1>
                        <p className="text-purple-600 font-bold text-[10px] uppercase tracking-widest mt-1">Gestion communautaire</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex-1 md:flex-none w-full md:w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all hover:bg-black"
                    >
                        <UserPlus size={24} />
                        <span className="md:hidden ml-2 font-black uppercase text-xs">Nouveau</span>
                    </button>
                    <button
                        onClick={() => setIsAlertMode(!isAlertMode)}
                        className={`flex-1 md:flex-none h-14 px-4 md:px-6 rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] flex items-center justify-center gap-2 md:gap-3 transition-all ${isAlertMode ? 'bg-rose-500 text-white shadow-xl animate-pulse' : 'bg-white dark:bg-slate-900 text-slate-600 border-2 border-slate-100 dark:border-slate-800'}`}
                    >
                        <Mic size={18} className="shrink-0" />
                        <span className="truncate">{isAlertMode ? 'Mode Alerte Actif' : 'Alerte de Masse'}</span>
                    </button>
                </div>
            </header>

            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            className="bg-white dark:bg-slate-950 w-full max-w-lg rounded-[32px] md:rounded-[48px] p-6 md:p-10 shadow-2xl overflow-hidden relative"
                        >
                            {isSuccess ? (
                                <div className="py-12 flex flex-col items-center text-center gap-6">
                                    <div className="w-20 h-20 md:w-24 md:h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center animate-bounce">
                                        <CheckCircle2 size={48} className="md:w-14 md:h-14" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Membre Ajouté !</h3>
                                        <p className="text-slate-500 font-bold mt-2 text-sm md:text-base">{newMember.name} a été inscrit avec succès.</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-start mb-8 md:mb-10">
                                        <div>
                                            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-none">Inscrire un membre</h3>
                                            <p className="text-purple-600 font-bold text-[10px] uppercase tracking-widest mt-2">Nouveau profil coopérative</p>
                                        </div>
                                        <button onClick={() => setShowAddModal(false)} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-slate-400">
                                            <X size={24} />
                                        </button>
                                    </div>

                                    <form onSubmit={handleAddMember} className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2 block">Nom Complet</label>
                                            <input
                                                required
                                                type="text"
                                                value={newMember.name}
                                                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-4 md:p-6 rounded-[24px] md:rounded-[28px] font-bold text-base md:text-lg focus:border-purple-500 transition-colors"
                                                placeholder="ex: Jean Koffi"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2 block">Téléphone</label>
                                                <input
                                                    required
                                                    type="tel"
                                                    value={newMember.phone}
                                                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-4 md:p-6 rounded-[24px] md:rounded-[28px] font-bold text-base md:text-lg focus:border-purple-500 transition-colors"
                                                    placeholder="07 00 00 00 00"
                                                />
                                            </div>
                                            <div className="relative">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2 block">Secteur</label>
                                                <div className="relative z-50">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowSectorDropdown(!showSectorDropdown)}
                                                        className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-4 md:p-6 rounded-[24px] md:rounded-[28px] font-black uppercase text-[10px] md:text-xs tracking-widest flex items-center justify-between focus:border-purple-500 transition-all outline-none"
                                                    >
                                                        {newMember.location}
                                                        <ChevronLeft className={`transition-transform duration-300 ${showSectorDropdown ? '-rotate-90' : 'rotate-[-90deg]'}`} size={18} />
                                                    </button>

                                                    <AnimatePresence>
                                                        {showSectorDropdown && (
                                                            <>
                                                                <div
                                                                    className="fixed inset-0 z-10"
                                                                    onClick={() => setShowSectorDropdown(false)}
                                                                />
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                                    animate={{ opacity: 1, y: 5, scale: 1 }}
                                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                                    className="absolute top-full left-0 right-0 z-20 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[28px] shadow-2xl overflow-hidden p-2"
                                                                >
                                                                    {['Bouaké', 'Yamoussoukro', 'Abidjan', 'Korhogo'].map((z) => (
                                                                        <button
                                                                            key={z}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setNewMember({ ...newMember, location: z });
                                                                                setShowSectorDropdown(false);
                                                                            }}
                                                                            className={`w-full p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-left transition-all ${newMember.location === z ? 'bg-purple-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400'}`}
                                                                        >
                                                                            {z}
                                                                        </button>
                                                                    ))}
                                                                </motion.div>
                                                            </>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full bg-purple-600 text-white py-6 md:py-8 rounded-[24px] md:rounded-[30px] font-black uppercase tracking-[0.2em] text-[10px] md:text-sm shadow-xl shadow-purple-200 dark:shadow-none active:scale-95 transition-all mt-4 hover:bg-purple-700"
                                        >
                                            Valider l'inscription
                                        </button>
                                    </form>
                                </>
                            )}
                        </motion.div>
                    </div>
                )}

                {isAlertMode && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-8"
                    >
                        <div className="bg-rose-500/10 border-4 border-rose-500/20 p-6 md:p-8 rounded-[32px] md:rounded-[40px] text-center">
                            <h3 className="font-black text-rose-600 uppercase tracking-widest text-xs md:text-sm mb-4">Alerte Vocale : Secteur {selectedZone}</h3>
                            <p className="text-rose-800/60 dark:text-rose-200/60 font-medium italic mb-6 text-sm md:text-base">"Tous les membres du secteur sélectionné recevront un message vocal immédiat."</p>
                            <button className="bg-rose-500 text-white px-6 md:px-10 py-4 md:py-5 rounded-[20px] md:rounded-[25px] font-black uppercase tracking-widest text-[10px] md:text-xs flex items-center justify-center gap-3 md:gap-4 mx-auto w-full sm:w-auto shadow-xl hover:bg-rose-600 transition-all active:scale-95">
                                <Send size={20} className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" /> Envoyer à {filteredMembers.length} membres
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sector Filters */}
            <div className="flex gap-2 overflow-x-auto pb-6 pt-2 -mx-2 px-2 scrollbar-hide mb-4">
                {['Tous', 'Bouaké', 'Yamoussoukro', 'Abidjan', 'Korhogo'].map((zone) => (
                    <button
                        key={zone}
                        onClick={() => setSelectedZone(zone)}
                        className={`px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all whitespace-nowrap border-2 ${selectedZone === zone ? 'bg-purple-600 border-purple-600 text-white shadow-xl' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'}`}
                    >
                        {zone}
                    </button>
                ))}
            </div>

            <div className="space-y-6">
                {filteredMembers.map((member) => (
                    <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[32px] md:rounded-[48px] shadow-sm border-2 border-slate-100 dark:border-slate-800 relative group"
                    >
                        {/* Member Role Badge */}
                        <div className="flex sm:absolute sm:top-8 sm:right-10 items-center justify-end gap-2 mb-4 sm:mb-0">
                            {member.role === 'Champion' && <Star size={16} fill="#F59E0B" className="text-amber-500" />}
                            {member.role === 'Expert' && <ShieldCheck size={16} className="text-blue-500" />}
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 sm:text-slate-300">{member.role}</span>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-slate-50 dark:bg-slate-800 rounded-[24px] sm:rounded-[30px] flex items-center justify-center text-slate-400 border-2 border-transparent group-hover:border-purple-200 transition-all uppercase font-black text-xl sm:text-2xl">
                                    {member.name.charAt(0)}
                                </div>
                                <div className="w-full">
                                    <h3 className="font-black text-slate-900 dark:text-white uppercase text-xl sm:text-2xl tracking-tighter leading-none mb-3 sm:mb-2 truncate">{member.name}</h3>
                                    <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-6">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 sm:text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 sm:bg-transparent px-3 py-2 sm:p-0 rounded-lg sm:rounded-none border sm:border-transparent border-slate-100 dark:border-slate-700">
                                            <Phone size={14} className="text-emerald-500" /> {member.phone}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 sm:text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 sm:bg-transparent px-3 py-2 sm:p-0 rounded-lg sm:rounded-none border sm:border-transparent border-slate-100 dark:border-slate-700">
                                            <MapPin size={14} className="text-rose-500" /> {member.location}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 md:p-6 rounded-[24px] md:rounded-[30px] border-2 border-slate-100/50 dark:border-slate-800 text-center">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Ventes (Mois)</span>
                                <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3">
                                    <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{member.sales.toLocaleString()} F</span>
                                    <div className={`flex items-center gap-1 text-[10px] font-black ${member.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        <TrendingUp size={14} className={member.trend.startsWith('-') ? 'rotate-180' : ''} />
                                        {member.trend}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 md:p-6 rounded-[24px] md:rounded-[30px] border-2 border-slate-100/50 dark:border-slate-800 text-center">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Participations</span>
                                <span className="text-xl md:text-2xl font-black text-purple-600 tracking-tighter">{member.joins} Achats</span>
                            </div>

                            <button className="sm:col-span-2 md:col-span-1 bg-slate-900 dark:bg-slate-800 text-white font-black uppercase tracking-[0.2em] text-[10px] md:text-[11px] rounded-[24px] md:rounded-[30px] shadow-xl active:scale-95 transition-all h-16 md:h-full md:min-h-[80px] hover:bg-purple-600">
                                Profil Complet
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Health Alert Bar */}
            <motion.div
                whileHover={{ scale: 1.01 }}
                className="mt-8 md:mt-12 p-6 md:p-10 bg-rose-500/10 rounded-[32px] md:rounded-[48px] border-4 border-rose-500/20 flex flex-col md:flex-row gap-6 md:gap-8 items-center justify-center text-center md:text-left shadow-2xl relative overflow-hidden"
            >
                <div className="p-5 md:p-6 bg-rose-500 text-white rounded-[24px] md:rounded-[30px] shadow-lg shadow-rose-500/30 relative z-10 shrink-0">
                    <AlertCircle size={32} className="md:w-[40px] md:h-[40px]" strokeWidth={3} />
                </div>
                <div className="relative z-10 flex-1">
                    <h4 className="font-black text-rose-500 uppercase tracking-widest text-[10px] md:text-xs mb-1 md:mb-2 italic">Alerte Santé Commerciale</h4>
                    <p className="text-rose-900/80 dark:text-rose-200/80 font-bold italic text-sm md:text-base leading-tight">
                        "Une baisse d'activité atypique est détectée à <span className="text-rose-600">Bouaké</span>. 3 membres n'ont pas enregistré de ventes depuis 72h."
                    </p>
                </div>
                <button className="w-full md:w-auto bg-rose-500 text-white px-8 py-4 md:py-5 rounded-[20px] md:rounded-[25px] font-black uppercase text-[10px] tracking-widest relative z-10 hover:bg-rose-600 transition-all shrink-0 shadow-lg hover:shadow-rose-500/30 active:scale-95">
                    Contacter le secteur
                </button>
            </motion.div>
        </main>
    );
}
