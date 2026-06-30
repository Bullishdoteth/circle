'use client';

import { Home, Circle, Users, Gift, ArrowUpRight, Wallet, BarChart3, Settings, Menu, X } from 'lucide-react';
import Link from 'next/link';
import Image from "next/image"

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const navItems = [
        { icon: Home, label: 'Dashboard', href: '#' },
        { icon: Circle, label: 'Circles', href: '#' },
        { icon: Users, label: 'Members', href: '#' },
        { icon: Gift, label: 'Contributions', href: '#' },
        { icon: ArrowUpRight, label: 'Transactions', href: '#' },
        { icon: Wallet, label: 'Payouts', href: '#' },
        { icon: BarChart3, label: 'Reports', href: '#' },
        { icon: Settings, label: 'Settings', href: '#' },
    ];

    return (
        <div className={`fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 p-6 flex flex-col transition-transform duration-300 z-40 md:z-20 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}>
        {/* Header with close button */}
        <div className="flex items-center justify-between mb-8 md:mb-12">
            <div className="flex items-center gap-2">
                <Link href="/" className="flex items-center gap-2 shrink-0">
                    <Image
                        src="/circle.png"
                        alt="Circle"
                        width={120}
                        height={40}
                        className="h-9 w-auto"
                        priority
                    />
                </Link>
            </div>
            <button
            onClick={onClose}
            className="md:hidden p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close sidebar"
            >
            <X size={20} />
            </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 flex-1">
            {navItems.map((item, index) => (
            <a
                key={index}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                index === 0
                    ? 'bg-purple-50 text-purple-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
                <item.icon size={20} />
                <span className="text-sm font-medium">{item.label}</span>
            </a>
            ))}
        </nav>
        </div>
    );
}

export function SidebarToggle({ onClick }: { onClick: () => void }) {
    return (
        <button
        onClick={onClick}
        className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Toggle sidebar"
        >
        <Menu size={24} />
        </button>
    );
}
