'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Package,
    History as HistoryIcon,
    Settings,
    TrendingUp,
    AlertCircle,
    Plus,
    Trash2,
    Edit2,
    Download,
    Search,
    ChevronRight,
    Filter,
    RotateCcw,
    DollarSign,
    CheckCircle2,
    X,
    Users,
    Store,
    UserCircle,
    ArrowLeft,
    LogOut,
    Bell,
    Send
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useProductContext } from '@/context/ProductContext';
import { useHistory } from '@/hooks/useHistory';
import { useStock } from '@/hooks/useStock';
import { useProfileContext } from '@/context/ProfileContext';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useConfirm } from '@/context/ConfirmContext';
import { supabase } from '@/lib/supabase';
import { AddProductModal } from '@/components/AddProductModal';

type AdminTab = 'OVERVIEW' | 'PROFILES' | 'PRODUCTS' | 'HISTORY' | 'SYSTEM' | 'NOTIFICATIONS' | 'USERS';

export default function ProfessionalAdminPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const { products, addProduct, deleteProduct, syncGlobalCatalog } = useProductContext();
    const { history, clearHistory } = useHistory();
    const { stock } = useStock();
    const { profiles, activeProfile, addProfile, deleteProfile, setActiveProfile } = useProfileContext();
    const { notifications, sendNotification, deleteNotification } = useNotifications();
    const confirm = useConfirm();

    const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [showNewProfileModal, setShowNewProfileModal] = useState(false);
    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const [newNotification, setNewNotification] = useState({ title: '', message: '', target_id: 'ALL', type: 'INFO' as any });

    const [newProfileData, setNewProfileData] = useState({ name: '', merchantName: '' });
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [globalHistory, setGlobalHistory] = useState<any[]>([]);
    const [globalStock, setGlobalStock] = useState<any>({});

    const fetchAllUsers = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setAllUsers(data);
    };

    const deleteUser = async (userId: string) => {
        const ok = await confirm({
            title: 'Supprimer cet utilisateur ?',
            message: 'Cette action est irréversible. Le compte sera définitivement supprimé.',
            confirmLabel: 'Supprimer',
            dangerMode: true
        });
        if (!ok) return;
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (!error) {
            triggerSuccess();
            fetchAllUsers();
        }
    };

    const toggleUserRole = async (userId: string, currentRole: string) => {
        const newRole = currentRole === 'SUPERVISOR' ? 'MERCHANT' : 'SUPERVISOR';
        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
        if (!error) {
            triggerSuccess();
            fetchAllUsers();
        }
    };

    const fetchGlobalData = async () => {
        // Fetch all transactions
        const { data: transactions } = await supabase
            .from('transactions')
            .select('*, profiles:store_id(full_name)')
            .order('created_at', { ascending: false });

        if (transactions) {
            setGlobalHistory(transactions.map((t: any) => ({
                id: t.id,
                type: t.type,
                productId: t.product_id,
                productName: t.product_name,
                quantity: t.quantity,
                price: t.price,
                timestamp: new Date(t.created_at).getTime(),
                clientName: t.client_name,
                status: t.status,
                merchantName: t.profiles?.full_name || 'Inconnu'
            })));
        }

        // Fetch all stock levels
        const { data: stockData } = await supabase
            .from('stock')
            .select('*');

        if (stockData) {
            const aggregatedStock: any = {};
            stockData.forEach((s: any) => {
                aggregatedStock[s.product_id] = (aggregatedStock[s.product_id] || 0) + s.quantity;
            });
            setGlobalStock(aggregatedStock);
        }
    };

    React.useEffect(() => {
        if (activeTab === 'USERS') fetchAllUsers();
        if (activeTab === 'OVERVIEW' || activeTab === 'HISTORY') fetchGlobalData();
    }, [activeTab]);

    React.useEffect(() => {
        if (isAuthenticated && user?.role !== 'SUPERVISOR') {
            router.push('/');
        }
    }, [isAuthenticated, user, router]);

    // Business Logic / Analytics matching Merchant Colors
    const stats = useMemo(() => {
        const dataToUse = globalHistory.length > 0 ? globalHistory : history;
        const stockToUse = Object.keys(globalStock).length > 0 ? globalStock : stock;

        const totalVolume = dataToUse.reduce((acc, t) => acc + t.price, 0);
        const totalSales = dataToUse.filter(t => t.type === 'VENTE').reduce((acc, t) => acc + t.price, 0);
        const outstandingDebt = dataToUse.filter(t => t.status === 'DETTE').reduce((acc, t) => acc + t.price, 0);
        const inventoryValue = products.reduce((acc, p) => acc + (p.price * (stockToUse[p.id] || 0)), 0);

        return { totalVolume, totalSales, outstandingDebt, inventoryValue };
    }, [history, products, stock, globalHistory, globalStock]);

    const filteredHistory = useMemo(() => {
        const dataToUse = globalHistory.length > 0 ? globalHistory : history;
        return dataToUse.filter(t =>
            t.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.clientName && t.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (t.merchantName && t.merchantName.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [history, globalHistory, searchQuery]);

    const triggerSuccess = () => {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    };

    const handleCreateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        if (newProfileData.name && newProfileData.merchantName) {
            addProfile({
                name: newProfileData.name,
                merchantName: newProfileData.merchantName,
                status: 'ACTIVE'
            });
            setNewProfileData({ name: '', merchantName: '' });
            setShowNewProfileModal(false);
            triggerSuccess();
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 flex flex-col md:flex-row">
            {/* Sidebar devient compact sur desktop, escamotable sur mobile */}
            <aside className="w-full md:w-72 p-4 sm:p-6 md:fixed md:h-screen z-40 bg-transparent shrink-0">
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl h-full rounded-[32px] sm:rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col p-6 sm:p-8">
                    <div className="flex items-center gap-3 sm:gap-4 mb-8 sm:mb-12">
                        <div className="bg-emerald-600 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-lg">
                            <LayoutDashboard size={22} className="text-white sm:w-7 sm:h-7" />
                        </div>
                        <div>
                            <span className="font-black text-xl sm:text-2xl uppercase tracking-tighter text-slate-900 dark:text-white block leading-none">ADMIN</span>
                            <span className="text-emerald-600 font-bold text-[9px] sm:text-xs uppercase tracking-widest">Supervision</span>
                        </div>
                    </div>

                    <nav className="space-y-2 sm:space-y-3 flex-1 overflow-y-auto">
                        <SidebarLink active={activeTab === 'OVERVIEW'} onClick={() => setActiveTab('OVERVIEW')} icon={TrendingUp} label="Bilan Global" color="emerald" />
                        <SidebarLink active={activeTab === 'USERS'} onClick={() => setActiveTab('USERS')} icon={Users} label="Utilisateurs" color="blue" />
                        <SidebarLink active={activeTab === 'PROFILES'} onClick={() => setActiveTab('PROFILES')} icon={Store} label="Commerçants" color="emerald" />
                        <SidebarLink active={activeTab === 'PRODUCTS'} onClick={() => setActiveTab('PRODUCTS')} icon={Package} label="Catalogue" color="amber" />
                        <SidebarLink active={activeTab === 'HISTORY'} onClick={() => setActiveTab('HISTORY')} icon={HistoryIcon} label="Historique" color="purple" />
                        <SidebarLink active={activeTab === 'NOTIFICATIONS'} onClick={() => setActiveTab('NOTIFICATIONS')} icon={Bell} label="Alertes" color="rose" />
                        <SidebarLink active={activeTab === 'SYSTEM'} onClick={() => setActiveTab('SYSTEM')} icon={Settings} label="Système" color="rose" />
                    </nav>

                    <button
                        onClick={() => router.push('/')}
                        className="mt-6 sm:mt-8 flex items-center justify-center gap-3 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 py-4 sm:py-5 rounded-2xl sm:rounded-3xl font-black uppercase text-[10px] sm:text-xs tracking-widest text-rose-500 transition-all border border-rose-100 dark:border-rose-800 active:scale-95"
                    >
                        <LogOut size={16} className="sm:w-5 sm:h-5" /> Déconnexion
                    </button>
                </div>
            </aside>

            {/* Content Area */}
            <main className="flex-1 md:ml-72 p-4 sm:p-6 md:p-10 pb-32">
                {/* Profile Header Card */}
                <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
                    <div className="flex items-center gap-4 sm:gap-6">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-600 rounded-[24px] sm:rounded-[32px] flex items-center justify-center shadow-lg">
                            <Store size={32} className="text-white sm:w-10 sm:h-10" />
                        </div>
                        <div>
                            <p className="text-emerald-600 font-black text-[8px] sm:text-[10px] uppercase tracking-[0.2em] mb-1">Superviseur</p>
                            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-tight">
                                {activeTab === 'OVERVIEW' && "Bilan Global"}
                                {activeTab === 'USERS' && "Utilisateurs"}
                                {activeTab === 'PROFILES' && "Marchands"}
                                {activeTab === 'PRODUCTS' && "Catalogue"}
                                {activeTab === 'HISTORY' && "Journal"}
                                {activeTab === 'NOTIFICATIONS' && "Alertes"}
                                {activeTab === 'SYSTEM' && "Système"}
                            </h1>
                        </div>
                    </div>

                    <div className="hidden sm:flex bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-6 py-4 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 items-center gap-3">
                        <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                            <UserCircle size={24} />
                        </div>
                        <div>
                            <span className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest block leading-none mb-1">Actif</span>
                            <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-xs">{activeProfile?.name || '---'}</span>
                        </div>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {activeTab === 'OVERVIEW' && (
                        <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6 sm:space-y-10">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                                <StatCard label="Caisse" value={`${stats.totalSales} F`} icon={DollarSign} color="emerald" />
                                <StatCard label="Dettes" value={`${stats.outstandingDebt} F`} icon={AlertCircle} color="rose" />
                                <StatCard label="Stock" value={`${stats.inventoryValue} F`} icon={Package} color="blue" />
                                <StatCard label="Volume" value={`${stats.totalVolume} F`} icon={TrendingUp} color="amber" />
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-10">
                                {/* Recent Activity with Merchant-style rows */}
                                <section className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] shadow-sm border border-slate-50 dark:border-slate-800">
                                    <h3 className="font-black text-slate-400 text-[10px] sm:text-xs uppercase tracking-widest mb-6 sm:mb-8 text-center md:text-left">Derniers Mouvements</h3>
                                    <div className="space-y-4 sm:space-y-5">
                                        {(globalHistory.length > 0 ? globalHistory : history).slice(0, 5).map(t => (
                                            <div key={t.id} className="flex items-center justify-between p-4 sm:p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl sm:rounded-[32px] transition-all hover:scale-[1.01] border border-transparent">
                                                <div className="flex items-center gap-3 sm:gap-5">
                                                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center ${t.type === 'VENTE' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                                        {t.type === 'VENTE' ? <Plus size={18} /> : <ArrowLeft size={18} />}
                                                    </div>
                                                    <div>
                                                        <span className="font-black text-slate-900 dark:text-white uppercase text-sm sm:text-base block truncate max-w-[120px] sm:max-w-none">{t.productName}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[8px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest">{new Date(t.timestamp).toLocaleDateString()}</span>
                                                            {t.merchantName && (
                                                                <span className="text-[8px] sm:text-[10px] text-emerald-600 font-black uppercase tracking-widest truncate max-w-[80px]">• {t.merchantName}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`text-base sm:text-xl font-black ${t.type === 'VENTE' ? 'text-emerald-600' : 'text-blue-600'}`}>
                                                    {t.type === 'VENTE' ? '+' : ''}{t.price} F
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Analytics Card - Match Bilan Page Style */}
                                <section className="bg-emerald-600 p-10 rounded-[48px] text-white shadow-2xl shadow-emerald-200 flex flex-col justify-between relative overflow-hidden">
                                    <div className="absolute -right-10 -top-10 text-white/10 rotate-12">
                                        <TrendingUp size={240} />
                                    </div>
                                    <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-[60px]" />
                                    <div className="absolute -left-20 -top-20 w-64 h-64 bg-black/10 rounded-full blur-[60px]" />
                                    <div className="relative z-10">
                                        <h3 className="text-emerald-100 font-black text-xs uppercase tracking-widest mb-6 border-b border-white/20 pb-4">Analyse de Succès</h3>
                                        <div className="text-7xl font-black tracking-tighter mb-4">{stats.totalSales} <span className="text-2xl opacity-50">F</span></div>
                                        <p className="text-emerald-50 bg-white/20 p-6 rounded-3xl font-bold text-sm leading-relaxed backdrop-blur-sm">
                                            {user?.name?.split(' ')[0] || 'Superviseur'}, ton business est solide. Le ratio de recouvrement est excellent ce mois-ci.
                                        </p>
                                    </div>
                                    <div className="mt-12 space-y-5 relative z-10">
                                        <div className="flex justify-between text-xs font-black uppercase tracking-widest text-emerald-100">
                                            <span>Paiements Encaissés</span>
                                            <span>{stats.totalVolume > 0 ? Math.round((stats.totalSales / stats.totalVolume) * 100) : 100}%</span>
                                        </div>
                                        <div className="h-4 bg-black/20 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${stats.totalVolume > 0 ? (stats.totalSales / stats.totalVolume) * 100 : 100}%` }}
                                                className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                                            />
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'USERS' && (
                        <motion.div key="users" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                            <div className="bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl border border-slate-50 dark:border-slate-800 overflow-hidden">
                                <div className="p-10 border-b-2 border-slate-50 dark:border-slate-800 flex justify-between items-center">
                                    <h3 className="font-black text-slate-400 text-xs uppercase tracking-widest">Registre des Utilisateurs</h3>
                                    <div className="flex gap-4">
                                        <button onClick={fetchAllUsers} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-slate-400 hover:text-emerald-600 transition-all">
                                            <RotateCcw size={20} />
                                        </button>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] border-b border-slate-100 dark:border-slate-800">
                                                <th className="px-10 py-6">Nom</th>
                                                <th className="px-10 py-6">Téléphone</th>
                                                <th className="px-10 py-6">Rôle</th>
                                                <th className="px-10 py-6 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                            {allUsers.map((u: any) => (
                                                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                                                    <td className="px-10 py-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${u.role === 'SUPERVISOR' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                                                {u.full_name?.charAt(0) || '?'}
                                                            </div>
                                                            <span className="font-black text-slate-900 dark:text-white uppercase text-sm">{u.full_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8 font-bold text-slate-600 dark:text-slate-400 text-sm">{u.phone_number}</td>
                                                    <td className="px-10 py-8">
                                                        <button
                                                            onClick={() => toggleUserRole(u.id, u.role)}
                                                            className={`text-[10px] font-black px-4 py-2 rounded-full border-2 transition-all hover:scale-105 active:scale-95 ${u.role === 'SUPERVISOR' ? 'border-emerald-100 text-emerald-600 bg-emerald-50' : 'border-blue-100 text-blue-600 bg-blue-50'}`}
                                                        >
                                                            {u.role === 'SUPERVISOR' ? 'ADMIN' : u.role}
                                                        </button>
                                                    </td>
                                                    <td className="px-10 py-8 text-right">
                                                        {u.id !== user?.id && (
                                                            <button
                                                                onClick={() => deleteUser(u.id)}
                                                                className="opacity-0 group-hover:opacity-100 bg-rose-50 dark:bg-rose-900/30 text-rose-300 hover:text-rose-600 hover:bg-rose-100 p-4 rounded-2xl transition-all active:scale-95"
                                                            >
                                                                <Trash2 size={20} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'PROFILES' && (
                        <motion.div key="profiles" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {profiles.filter(p => p.ownerRole !== 'SUPERVISOR').map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => setActiveProfile(p.id)}
                                        className={`bg-white dark:bg-slate-900 p-10 rounded-[48px] border-4 transition-all cursor-pointer relative group ${activeProfile?.id === p.id ? 'border-emerald-500 shadow-2xl shadow-emerald-200' : 'border-slate-50 dark:border-slate-800 hover:border-slate-200'}`}
                                    >
                                        <div className="flex justify-between items-start mb-8">
                                            <div className={`p-5 rounded-3xl transition-all shadow-lg ${activeProfile?.id === p.id ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-200'}`}>
                                                <Store size={40} />
                                            </div>
                                            {activeProfile?.id === p.id && (
                                                <span className="bg-emerald-600 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-[0.2em] shadow-lg">Session Active</span>
                                            )}
                                        </div>
                                        <h3 className="font-black text-2xl text-slate-900 dark:text-white mb-2 uppercase tracking-tighter">{p.name}</h3>
                                        <p className="text-slate-400 font-bold text-sm mb-10 tracking-tight">
                                            Commerçant: <span className="text-slate-900 dark:text-white uppercase">{p.merchantName}</span>
                                        </p>

                                        <div className="flex items-center justify-between pt-8 border-t-2 border-slate-50 dark:border-slate-800">
                                            <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">ID: {p.id}</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteProfile(p.id); }}
                                                className="bg-rose-50 dark:bg-rose-900/30 text-rose-300 hover:text-rose-600 hover:bg-rose-100 p-4 rounded-2xl transition-all active:scale-95"
                                            >
                                                <Trash2 size={24} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={() => setShowNewProfileModal(true)}
                                    className="bg-slate-50 dark:bg-slate-900/50 border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[48px] flex flex-col items-center justify-center p-12 text-slate-400 hover:border-emerald-500 hover:text-emerald-500 transition-all group shadow-inner"
                                >
                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                                        <Plus size={48} />
                                    </div>
                                    <span className="font-black uppercase text-sm tracking-[0.3em] mt-8">Ajouter un Marchand</span>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'PRODUCTS' && (
                        <motion.div key="products" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                            <div className="bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl border border-slate-50 dark:border-slate-800 overflow-hidden">
                                <div className="p-10 border-b-2 border-slate-50 dark:border-slate-800 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-black text-slate-400 text-xs uppercase tracking-widest">Catalogue Maître</h3>
                                        <p className="text-slate-400 text-sm mt-1">Les produits <span className="font-black text-emerald-600">GLOBAL</span> sont visibles par tous les marchands.</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={async () => {
                                                setIsSyncing(true);
                                                await syncGlobalCatalog();
                                                setIsSyncing(false);
                                                triggerSuccess();
                                            }}
                                            disabled={isSyncing}
                                            className={`${isSyncing ? 'bg-slate-400' : 'bg-blue-600'} text-white px-8 py-4 rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-3 shadow-xl active:scale-95 transition-all`}
                                        >
                                            <RotateCcw size={18} className={isSyncing ? 'animate-spin' : ''} /> {isSyncing ? 'Sync...' : 'Synchroniser Catalogue'}
                                        </button>
                                        <button
                                            onClick={() => setShowAddProductModal(true)}
                                            className="bg-emerald-600 text-white px-8 py-4 rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-3 shadow-xl active:scale-95 transition-all"
                                        >
                                            <Plus size={18} /> Nouveau Produit Global
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-10">
                                    {products.map(p => (
                                        <div key={p.id} className="bg-slate-50 dark:bg-slate-800 p-8 rounded-[40px] border border-slate-100 dark:border-slate-700 flex items-center justify-between group overflow-hidden relative">
                                            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                {p.imageUrl ? (
                                                    <img src={p.imageUrl} className="w-32 h-32 object-contain grayscale" alt="" />
                                                ) : (
                                                    <p.icon size={120} />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-6 relative z-10">
                                                <div className={`w-16 h-16 rounded-[24px] ${p.color} ${p.iconColor} flex items-center justify-center shadow-lg overflow-hidden bg-white/50 backdrop-blur-sm`}>
                                                    {p.imageUrl ? (
                                                        <img src={p.imageUrl} className="w-full h-full object-contain" alt={p.name} />
                                                    ) : (
                                                        <p.icon size={32} />
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-black uppercase text-slate-900 dark:text-white text-xl tracking-tighter leading-none mb-1">{p.name}</h4>
                                                    <p className="text-emerald-600 font-black text-lg">{p.price} F</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => deleteProduct(p.id)}
                                                className="opacity-0 group-hover:opacity-100 bg-white dark:bg-slate-900 p-4 rounded-2xl text-slate-300 hover:text-rose-500 transition-all relative z-10"
                                            >
                                                <Trash2 size={24} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'HISTORY' && (
                        <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl shadow-slate-100 dark:shadow-none border border-slate-50 dark:border-slate-800 overflow-hidden">
                            <div className="p-10 border-b-2 border-slate-50 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div className="relative flex-1 max-w-xl">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                                    <input
                                        type="text"
                                        placeholder="Chercher une transaction..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[28px] py-5 pl-16 pr-8 font-black text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all placeholder:text-slate-300 uppercase text-xs tracking-widest"
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <button className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 px-8 py-5 rounded-[24px] text-slate-600 dark:text-slate-300 font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-4 transition-all hover:bg-slate-50">
                                        <Filter size={20} /> Filtrer
                                    </button>
                                    <button className="bg-slate-900 dark:bg-emerald-600 text-white px-8 py-5 rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-4 shadow-xl shadow-slate-200 dark:shadow-emerald-900/20 active:scale-95 transition-all">
                                        <Download size={20} /> Exporter
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 dark:bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] border-b border-slate-100 dark:border-slate-800">
                                            <th className="px-10 py-6">Date</th>
                                            <th className="px-10 py-6">Marchand</th>
                                            <th className="px-10 py-6">Produit</th>
                                            <th className="px-10 py-6">Statut</th>
                                            <th className="px-10 py-6 text-right">Montant</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                        {filteredHistory.map(t => (
                                            <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                                                <td className="px-10 py-8 text-xs font-black text-slate-400 whitespace-nowrap uppercase tracking-tighter">
                                                    {new Date(t.timestamp).toLocaleDateString()}
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                                                            <Store size={14} />
                                                        </div>
                                                        <span className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-tight">{t.merchantName || activeProfile?.name || '---'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <span className="font-black text-slate-900 dark:text-white uppercase text-base tracking-tighter block">{t.productName}</span>
                                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Quantité: {t.quantity} {t.clientName ? `• Client: ${t.clientName}` : ''}</span>
                                                </td>
                                                <td className="px-10 py-8">
                                                    {t.status && (
                                                        <span className={`text-[10px] font-black px-4 py-2 rounded-full border-2 ${t.status === 'PAYÉ' ? 'border-emerald-100 text-emerald-600 bg-emerald-50' : 'border-rose-100 text-rose-600 bg-rose-50'}`}>
                                                            {t.status}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-10 py-8 text-right font-black text-slate-900 dark:text-white text-2xl tracking-tighter">
                                                    {t.price} <span className="text-xs opacity-30 uppercase ml-1">F</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'NOTIFICATIONS' && (
                        <motion.div key="notifications" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
                            {/* Formulaire d'envoi */}
                            <section className="bg-white dark:bg-slate-900 p-10 rounded-[48px] shadow-2xl border border-slate-100 dark:border-slate-800">
                                <h3 className="font-black text-slate-400 text-xs uppercase tracking-widest mb-8">Envoyer une alerte</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Destinataire</label>
                                            <select
                                                className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-[24px] font-black uppercase text-xs outline-none border-2 border-transparent focus:border-emerald-500"
                                                value={newNotification.target_id}
                                                onChange={e => setNewNotification({ ...newNotification, target_id: e.target.value })}
                                            >
                                                <option value="ALL">Tous les marchands</option>
                                                {profiles.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name} ({p.merchantName})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Titre du Message</label>
                                            <input
                                                type="text"
                                                placeholder="Sujet de l'alerte..."
                                                className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-[24px] font-black uppercase text-xs outline-none border-2 border-transparent focus:border-emerald-500"
                                                value={newNotification.title}
                                                onChange={e => setNewNotification({ ...newNotification, title: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Contenu du Message</label>
                                        <textarea
                                            rows={5}
                                            placeholder="Écrivez votre message ici..."
                                            className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-[24px] font-bold text-sm outline-none border-2 border-transparent focus:border-emerald-500 resize-none"
                                            value={newNotification.message}
                                            onChange={e => setNewNotification({ ...newNotification, message: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end">
                                    <button
                                        onClick={async () => {
                                            if (newNotification.title && newNotification.message) {
                                                await sendNotification(newNotification);
                                                setNewNotification({ title: '', message: '', target_id: 'ALL', type: 'INFO' });
                                                triggerSuccess();
                                            }
                                        }}
                                        className="bg-emerald-600 text-white px-10 py-5 rounded-[24px] font-black uppercase text-xs tracking-widest flex items-center gap-4 shadow-xl active:scale-95 transition-all"
                                    >
                                        <Send size={20} /> Diffuser l'alerte
                                    </button>
                                </div>
                            </section>

                            <section className="bg-slate-50/50 dark:bg-slate-900/50 p-10 rounded-[48px] border-4 border-dashed border-slate-100 dark:border-slate-800">
                                <h3 className="font-black text-slate-400 text-xs uppercase tracking-widest mb-8">Messages Diffusés</h3>
                                <div className="space-y-4">
                                    {notifications.length === 0 ? (
                                        <p className="text-center py-12 text-slate-300 font-bold italic">Aucune notification envoyée.</p>
                                    ) : (
                                        notifications.map(n => (
                                            <div key={n.id} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group">
                                                <div className="flex items-center gap-6">
                                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-slate-400">
                                                        <Bell size={24} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <span className="font-black text-slate-900 dark:text-white uppercase text-base">{n.title}</span>
                                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-400 font-black uppercase">
                                                                Pour: {n.target_id === 'ALL' ? 'TOUS' : profiles.find(p => p.id === n.target_id)?.name || 'Inconnu'}
                                                            </span>
                                                        </div>
                                                        <p className="text-slate-400 font-medium text-sm">{n.message}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => deleteNotification(n.id)}
                                                    className="bg-rose-50 dark:bg-rose-900/30 text-rose-300 p-3 rounded-xl hover:bg-rose-100 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        </motion.div>
                    )}

                    {activeTab === 'SYSTEM' && (
                        <motion.div key="system" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-3xl mx-auto md:mx-0">
                            <div className="bg-rose-600 p-12 rounded-[56px] space-y-10 shadow-2xl shadow-rose-200 relative overflow-hidden">
                                <div className="absolute -right-20 -top-20 text-white/10 rotate-12">
                                    <AlertCircle size={300} />
                                </div>

                                <div className="flex gap-8 relative z-10">
                                    <div className="bg-white/20 p-6 rounded-[32px] text-white backdrop-blur-md">
                                        <AlertCircle size={56} />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-black text-3xl uppercase tracking-tighter leading-none mb-2">Zone Critique</h3>
                                        <p className="text-rose-100 font-bold text-lg opacity-80 leading-snug">Ces actions suppriment définitivement vos données. Soyez vigilant.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-1 gap-4 relative z-10">
                                    <DangerAction
                                        title="Réinitialisation Totale"
                                        desc="Supprime tout : Boutiques, Produits, Caisse."
                                        icon={RotateCcw}
                                        onClick={async () => {
                                            const ok = await confirm({
                                                title: '🚨 TOUT SUPPRIMER ?',
                                                message: 'Cette action supprime toutes les données locales. Elle est irréversible.',
                                                confirmLabel: 'Tout effacer',
                                                dangerMode: true
                                            });
                                            if (ok) {
                                                localStorage.clear();
                                                window.location.href = '/';
                                            }
                                        }}
                                    />
                                    <DangerAction
                                        title="Nettoyer l'Historique"
                                        desc="Efface toutes les ventes de tous les profils."
                                        icon={HistoryIcon}
                                        onClick={async () => {
                                            const ok = await confirm({
                                                title: "Vider l'Historique ?",
                                                message: "Toutes les transactions seront effacées définitivement. Cette action est irréversible.",
                                                confirmLabel: 'Effacer',
                                                dangerMode: true
                                            });
                                            if (ok) {
                                                clearHistory();
                                                triggerSuccess();
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Modals & Overlays - Design Harmonisé */}
            <AnimatePresence>
                {showNewProfileModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 40 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[56px] p-12 shadow-2xl relative border-4 border-slate-50 dark:border-slate-800"
                        >
                            <button
                                onClick={() => setShowNewProfileModal(false)}
                                className="absolute top-10 right-10 text-slate-300 hover:text-slate-950 transition-colors p-2 bg-slate-50 rounded-full"
                            >
                                <X size={28} />
                            </button>

                            <div className="bg-blue-600 w-16 h-16 rounded-[24px] flex items-center justify-center mb-8 shadow-xl shadow-blue-100">
                                <Users size={32} className="text-white" />
                            </div>

                            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tighter">Nouveau Marchand</h2>
                            <p className="text-slate-400 font-bold mb-10 italic">Ouvrez une nouvelle session pour un commerçant.</p>

                            <form onSubmit={handleCreateProfile} className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-6">Nom Commercial</label>
                                    <input
                                        autoFocus
                                        required
                                        type="text"
                                        placeholder="Ex: LA BOUTIQUE DE FATOU"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[32px] p-6 font-black text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all uppercase text-sm tracking-widest placeholder:text-slate-300"
                                        value={newProfileData.name}
                                        onChange={e => setNewProfileData({ ...newProfileData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-6">Nom du Commerçant</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Ex: FATOU SY"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[32px] p-6 font-black text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all uppercase text-sm tracking-widest placeholder:text-slate-300"
                                        value={newProfileData.merchantName}
                                        onChange={e => setNewProfileData({ ...newProfileData, merchantName: e.target.value })}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 text-white p-8 rounded-[32px] font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-blue-200 active:scale-95 transition-all mt-6"
                                >
                                    Valider et Créer
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Product Modal */}
            <AnimatePresence>
                {showAddProductModal && (
                    <AddProductModal
                        onClose={() => setShowAddProductModal(false)}
                        onAdd={async (product) => {
                            await addProduct({
                                ...product,
                                audioName: product.name,
                                color: 'bg-slate-100',
                                iconColor: 'text-slate-600',
                                icon: Package
                            }, 'GLOBAL');
                            setShowAddProductModal(false);
                            triggerSuccess();
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Success Toast */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed bottom-10 right-10 bg-slate-900 text-white px-10 py-6 rounded-[32px] shadow-2xl flex items-center gap-5 z-[110] font-black uppercase text-xs tracking-[0.2em] border-2 border-white/10"
                    >
                        <CheckCircle2 size={32} className="text-emerald-400" /> Action Terminée
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Sidebar Links with specific colors matching Merchant App types
function SidebarLink({ active, onClick, icon: Icon, label, color }: any) {
    const colorStyles: any = {
        emerald: active ? 'bg-emerald-600 text-white shadow-emerald-200' : 'text-slate-400 hover:text-emerald-600',
        blue: active ? 'bg-blue-600 text-white shadow-blue-200' : 'text-slate-400 hover:text-blue-600',
        amber: active ? 'bg-amber-600 text-white shadow-amber-200' : 'text-slate-400 hover:text-amber-600',
        purple: active ? 'bg-purple-600 text-white shadow-purple-200' : 'text-slate-400 hover:text-purple-600',
        rose: active ? 'bg-rose-600 text-white shadow-rose-200' : 'text-slate-400 hover:text-rose-600'
    };

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-5 p-5 rounded-[28px] font-black text-sm transition-all uppercase tracking-tight ${colorStyles[color]} ${active ? 'shadow-xl' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
            <Icon size={22} /> {label}
        </button>
    );
}

function StatCard({ label, value, icon: Icon, color }: any) {
    const styles: any = {
        emerald: { bg: 'bg-emerald-600', iconBg: 'bg-white/20', shadow: 'shadow-emerald-100', text: 'text-emerald-600' },
        rose: { bg: 'bg-rose-600', iconBg: 'bg-white/20', shadow: 'shadow-rose-100', text: 'text-rose-600' },
        blue: { bg: 'bg-blue-600', iconBg: 'bg-white/20', shadow: 'shadow-blue-100', text: 'text-blue-600' },
        amber: { bg: 'bg-amber-600', iconBg: 'bg-white/20', shadow: 'shadow-amber-100', text: 'text-amber-600' }
    };

    const currentStyle = styles[color];

    return (
        <div className={`bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-2xl ${currentStyle.shadow} dark:shadow-none border border-slate-50 dark:border-slate-800 flex flex-col gap-4 relative overflow-hidden group hover:scale-[1.02] transition-transform`}>
            <div className="flex items-center justify-between relative z-10">
                <div className={`p-4 rounded-2xl ${currentStyle.bg} text-white shadow-lg`}>
                    <Icon size={24} />
                </div>
                <p className="text-slate-300 dark:text-slate-600 font-extrabold text-[10px] uppercase tracking-[0.3em]">{label}</p>
            </div>
            <div className={`text-4xl font-black text-slate-900 dark:text-white relative z-10 tracking-tighter`}>{value}</div>
            <div className={`absolute -right-4 -bottom-4 ${currentStyle.text} opacity-[0.03] rotate-12 group-hover:scale-125 transition-transform`}>
                <Icon size={140} />
            </div>
        </div>
    );
}

function DangerAction({ title, desc, icon: Icon, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className="w-full text-left bg-white p-10 rounded-[40px] flex items-center justify-between group active:scale-[0.98] transition-all border-4 border-transparent hover:border-white shadow-xl shadow-rose-900/20"
        >
            <div className="flex items-center gap-8">
                <div className="bg-rose-50 p-5 rounded-2xl text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-lg">
                    <Icon size={32} />
                </div>
                <div>
                    <h4 className="font-black text-slate-900 uppercase text-xl leading-tight mb-2 tracking-tighter">{title}</h4>
                    <p className="text-xs text-rose-300 font-bold uppercase tracking-widest">{desc}</p>
                </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-full text-slate-200 group-hover:text-rose-600 group-hover:translate-x-2 transition-all">
                <ChevronRight size={28} />
            </div>
        </button>
    );
}
