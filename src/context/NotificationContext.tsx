'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export interface Notification {
    id: string;
    target_id: string; // ID du commerçant ou 'ALL'
    title: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'ALERT';
    is_read: boolean;
    created_at: number;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    sendNotification: (notification: Omit<Notification, 'id' | 'created_at' | 'is_read'>) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Simulation avec localStorage pour une opérationnalité immédiate sans dépendance table DB
    // Mais structuré pour Supabase plus tard
    useEffect(() => {
        const saved = localStorage.getItem('app_notifications');
        if (saved) {
            setNotifications(JSON.parse(saved));
        }

        // Écouter les changements dans localStorage pour le temps réel simulé
        const handleStorage = () => {
            const updated = localStorage.getItem('app_notifications');
            if (updated) setNotifications(JSON.parse(updated));
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const saveNotifications = (newItems: Notification[]) => {
        setNotifications(newItems);
        localStorage.setItem('app_notifications', JSON.stringify(newItems));
        // Déclencher l'événement manuellement car 'storage' ne se déclenche pas sur le même onglet
        window.dispatchEvent(new Event('storage'));
    };

    const sendNotification = async (data: Omit<Notification, 'id' | 'created_at' | 'is_read'>) => {
        const newNotif: Notification = {
            ...data,
            id: Math.random().toString(36).substr(2, 9),
            is_read: false,
            created_at: Date.now()
        };
        saveNotifications([newNotif, ...notifications]);
    };

    const markAsRead = async (id: string) => {
        saveNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    };

    const deleteNotification = async (id: string) => {
        saveNotifications(notifications.filter(n => n.id !== id));
    };

    // Filtrer les notifications pour le commerçant actuel
    const relevantNotifications = user?.role === 'SUPERVISOR'
        ? notifications
        : notifications.filter(n => n.target_id === 'ALL' || n.target_id === user?.id);

    const unreadCount = relevantNotifications.filter(n => !n.is_read).length;

    return (
        <NotificationContext.Provider value={{
            notifications: relevantNotifications,
            unreadCount,
            sendNotification,
            markAsRead,
            deleteNotification
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
