'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle2, Trash2, Clock, ArrowLeft } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';

export default function NotificationsPage() {
    const { notifications, markAsRead, deleteNotification } = useNotifications();

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
            {/* Header Coloré (Card Overlap Style) */}
            <div className="bg-emerald-600 pt-8 pb-32 px-4 rounded-b-[2.5rem] relative shadow-lg">
                <div className="flex justify-between items-center max-w-lg mx-auto mb-6">
                    <button
                        onClick={() => window.history.back()}
                        className="w-10 h-10 bg-white text-emerald-600 rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="text-center flex-1 pr-10">
                        <h1 className="text-white font-bold text-lg tracking-wide uppercase">Notifications</h1>
                        <p className="text-emerald-100/60 text-[10px] font-bold uppercase tracking-widest mt-0.5">Messages & Alertes</p>
                    </div>
                </div>
            </div>

            {/* Main Content Overlap */}
            <div className="px-4 max-w-lg mx-auto relative -mt-20 z-10 space-y-4">
                {notifications.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 p-12 rounded-[32px] shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-200">
                            <Bell size={40} />
                        </div>
                        <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest italic">Aucun nouveau message</p>
                    </div>
                ) : (
                    notifications.map(n => (
                        <motion.div
                            key={n.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`bg-white dark:bg-slate-900 p-6 rounded-[28px] shadow-sm border transition-all ${n.is_read ? 'border-slate-100 dark:border-slate-800 opacity-60' : 'border-emerald-100 dark:border-emerald-900/30'}`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    {!n.is_read && <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                                    <span className="font-black text-slate-900 dark:text-white text-sm tracking-tight uppercase">{n.title}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                    <Clock size={12} />
                                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-bold uppercase tracking-wide mb-4">{n.message}</p>
                            <div className="flex justify-end gap-3 border-t border-slate-50 dark:border-slate-800 pt-3">
                                <button
                                    onClick={() => deleteNotification(n.id)}
                                    className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                                {!n.is_read && (
                                    <button
                                        onClick={() => markAsRead(n.id)}
                                        className="text-[9px] font-black text-emerald-600 tracking-widest uppercase flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-emerald-50 dark:bg-emerald-950/30 transition-colors"
                                    >
                                        <CheckCircle2 size={14} /> Lu
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </main>
    );
}
