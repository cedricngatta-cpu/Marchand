'use client';

import React from 'react';
import { Minus, Plus, Eye, LucideIcon } from 'lucide-react';

interface StockItemProps {
    name: string;
    icon: LucideIcon;
    imageUrl?: string;
    quantity: number;
    color: string;
    iconColor: string;
    onAdd: () => void;
    onRemove: () => void;
    onViewDetails: () => void;
    onSpeak: () => void;
}

export const StockItem = ({
    name,
    icon: Icon,
    imageUrl,
    quantity,
    color,
    iconColor,
    onAdd,
    onRemove,
    onViewDetails,
    onSpeak
}: StockItemProps) => {
    const isLow = quantity < 5;

    return (
        <div
            onClick={onSpeak}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group cursor-pointer transition-colors active:bg-slate-50"
        >
            <div className="flex items-center gap-5 min-w-0">
                <div className={`w-14 h-14 rounded-xl ${imageUrl ? 'bg-slate-100' : color} flex items-center justify-center shrink-0 border border-slate-50 overflow-hidden relative`}>
                    {imageUrl ? (
                        <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                    ) : (
                        <Icon className={iconColor} size={28} />
                    )}
                </div>
                <div className="flex flex-col min-w-0">
                    <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider truncate mb-1">{name}</h3>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-2xl font-bold ${isLow ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                            {quantity}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">UNITÉS</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
                >
                    <Minus size={18} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onAdd(); }}
                    className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-colors"
                >
                    <Plus size={18} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
                    className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg active:bg-slate-800 transition-colors"
                >
                    <Eye size={18} />
                </button>
            </div>
        </div>
    );
};
