'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Mail, UserPlus, Info, CheckCheck, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { 
    getNotificationsAction, 
    markNotificationAsReadAction, 
    markAllNotificationsAsReadAction, 
    type NotificationRecord 
} from '@/lib/actions/notifications';

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const fetchNotifications = async () => {
        setLoading(true);
        const res = await getNotificationsAction();
        if (res.success && res.data) {
            setNotifications(res.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleMarkAsRead = async (id: string, type: string) => {
        setNotifications(prev => 
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        await markNotificationAsReadAction(id);
        
        if (type === 'invite') {
            router.push('/circles?tab=invitations');
            setIsOpen(false);
        }
    };

    const handleMarkAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        await markAllNotificationsAsReadAction();
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success':
                return <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><Check size={16} /></div>;
            case 'invite':
                return <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg"><UserPlus size={16} /></div>;
            default:
                return <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Info size={16} /></div>;
        }
    };

    const formatRelativeTime = (dateInput: string | Date) => {
        const date = new Date(dateInput);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    return (
        <div className="relative" ref={containerRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
                <Bell size={20} className="md:w-6 md:h-6 text-gray-700" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-900">Notifications</span>
                        {unreadCount > 0 && (
                            <button 
                                onClick={handleMarkAllAsRead}
                                className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
                            >
                                <CheckCheck size={14} />
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-50">
                        {loading && notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                                <span className="text-xs font-medium">Loading notifications...</span>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-1.5">
                                <Bell className="w-8 h-8 text-gray-300" />
                                <span className="text-xs font-semibold">No notifications yet</span>
                                <span className="text-[10px] text-gray-400">We'll alert you when things happen</span>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div 
                                    key={n.id} 
                                    onClick={() => handleMarkAsRead(n.id, n.type)}
                                    className={`flex gap-3 px-5 py-3.5 hover:bg-gray-50/50 cursor-pointer transition-colors ${!n.read ? 'bg-purple-50/10' : ''}`}
                                >
                                    <div className="shrink-0 pt-0.5">
                                        {getIcon(n.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={`text-xs truncate ${!n.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                {n.title}
                                            </p>
                                            <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                                                {formatRelativeTime(n.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                                            {n.message}
                                        </p>
                                    </div>
                                    {!n.read && (
                                        <div className="shrink-0 flex items-center">
                                            <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
