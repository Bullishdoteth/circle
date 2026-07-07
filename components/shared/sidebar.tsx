'use client';

import React, { useState, useEffect } from 'react';
import { Home, Circle, Users, Gift, ArrowUpRight, Wallet, BarChart3, Settings, Menu, X, Sliders } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { getMyCirclesAction } from '@/lib/actions/circle';

interface SidebarCircle {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    memberCount: number;
    userRole: 'owner' | 'admin' | 'treasurer' | 'member';
}

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [userCircles, setUserCircles] = useState<SidebarCircle[]>([]);
    const [selectedCircle, setSelectedCircle] = useState<SidebarCircle | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Get active circle slug from URL or pathname
    const activeCircleSlugFromUrl = searchParams?.get('circle') ?? null;
    
    // Check if pathname is like /circles/[slug]
    const pathParts = pathname?.split('/') ?? [];
    const isCircleDetailsPage = pathParts[1] === 'circles' && pathParts[2] && pathParts[2] !== 'members';
    const activeCircleSlugFromPath = isCircleDetailsPage ? pathParts[2] : null;

    const currentCircleSlug = activeCircleSlugFromUrl || activeCircleSlugFromPath;

    useEffect(() => {
        const fetchCircles = async () => {
            const res = await getMyCirclesAction();
            if (res.success && res.data) {
                setUserCircles(res.data);
                
                const allCirclesObj = {
                    id: 'all',
                    name: 'All Circles',
                    slug: 'all',
                    imageUrl: null,
                    memberCount: res.data.reduce((acc: number, c: SidebarCircle) => acc + (c.memberCount || 0), 0),
                    userRole: 'admin' as const, // Allow viewing all tabs in All Circles overview mode
                };

                if (currentCircleSlug && currentCircleSlug !== 'all') {
                    const match = res.data.find(c => c.slug === currentCircleSlug);
                    if (match) {
                        setSelectedCircle(match);
                    } else {
                        setSelectedCircle(allCirclesObj);
                    }
                } else {
                    setSelectedCircle(allCirclesObj);
                }
            }
        };
        fetchCircles();
    }, [currentCircleSlug]); // Only depend on currentCircleSlug to prevent route loops

    const handleSwitchCircle = (circle: SidebarCircle) => {
        setSelectedCircle(circle);
        setIsDropdownOpen(false);

        const tab = searchParams?.get('tab');
        const tabParam = tab ? `?tab=${tab}` : '';

        if (circle.slug === 'all') {
            if (pathname.startsWith('/circles/')) {
                router.push('/circles');
            } else {
                router.push(pathname); // strips query parameters including ?circle
            }
        } else {
            if (pathname.startsWith('/circles/')) {
                router.push(`/circles/${circle.slug}${tabParam}`);
            } else {
                router.push(`${pathname}?circle=${circle.slug}`);
            }
        }
    };

    const activeCircleSlug = selectedCircle?.slug;

    const navItems = [
        { 
            icon: Home, 
            label: 'Dashboard', 
            href: activeCircleSlug && activeCircleSlug !== 'all' ? `/dashboard?circle=${activeCircleSlug}` : '/dashboard' 
        },
        { 
            icon: Circle, 
            label: 'Circles', 
            href: '/circles' 
        },
        { 
            icon: Users, 
            label: 'Members', 
            href: activeCircleSlug && activeCircleSlug !== 'all' ? `/circles/${activeCircleSlug}?tab=members` : '/circles' 
        },
        { 
            icon: Gift, 
            label: 'Contributions', 
            href: activeCircleSlug && activeCircleSlug !== 'all' ? `/contributions?circle=${activeCircleSlug}` : '/contributions' 
        },
        { 
            icon: ArrowUpRight, 
            label: 'Transactions', 
            href: activeCircleSlug && activeCircleSlug !== 'all' ? `/transactions?circle=${activeCircleSlug}` : '/transactions' 
        },
        { 
            icon: Wallet, 
            label: 'Payouts', 
            href: activeCircleSlug && activeCircleSlug !== 'all' ? `/payouts?circle=${activeCircleSlug}` : '/payouts' 
        },
        { 
            icon: BarChart3, 
            label: 'Reports', 
            href: activeCircleSlug && activeCircleSlug !== 'all' ? `/reports?circle=${activeCircleSlug}` : '/reports' 
        },
        { 
            icon: Settings, 
            label: 'Circle Settings', 
            href: activeCircleSlug && activeCircleSlug !== 'all' ? `/circles/${activeCircleSlug}?tab=settings` : '/circles' 
        },
        {
            icon: Sliders,
            label: 'App Settings',
            href: '/settings'
        }
    ];

    // Filter nav items: members only get to view Dashboard, Payouts, Transactions, and App Settings
    const filteredNavItems = selectedCircle?.userRole === 'member'
        ? navItems.filter((item) => ['Dashboard', 'Payouts', 'Transactions', 'App Settings'].includes(item.label))
        : navItems;

    return (
        <div className={`fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 p-6 flex flex-col transition-transform duration-300 z-40 md:z-20 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}>
        {/* Header with close button */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
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

        {/* Circle Switcher Dropdown */}
        {userCircles.length > 0 && selectedCircle && (
            <div className="relative mb-6">
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:bg-gray-50/80 transition-all text-left animate-in fade-in duration-200"
                >
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-sm font-bold text-emerald-700">
                            {selectedCircle.slug === 'all' ? (
                                <span className="text-lg">🌍</span>
                            ) : selectedCircle.imageUrl ? (
                                <img
                                    src={selectedCircle.imageUrl}
                                    alt={selectedCircle.name}
                                    className="h-full w-full rounded-lg object-cover"
                                />
                            ) : (
                                selectedCircle.name.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div className="min-w-0">
                            <h4 className="truncate text-sm font-semibold text-gray-900 leading-tight">
                                {selectedCircle.name}
                            </h4>
                            <p className="text-[11px] text-gray-500 font-medium leading-none mt-1">
                                {selectedCircle.slug === 'all' ? 'Combined view' : `${selectedCircle.memberCount} members`}
                            </p>
                        </div>
                    </div>
                    <svg
                        className={`h-4 w-4 text-gray-400 transition-transform duration-200 shrink-0 ${
                            isDropdownOpen ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                    <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-xl border border-gray-100 bg-white p-1.5 shadow-lg ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-100">
                        <div className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                            Select Circle
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-0.5 mt-1">
                            {/* All Circles option at the top */}
                            <button
                                onClick={() => handleSwitchCircle({
                                    id: 'all',
                                    name: 'All Circles',
                                    slug: 'all',
                                    imageUrl: null,
                                    memberCount: userCircles.reduce((acc, c) => acc + (c.memberCount || 0), 0),
                                    userRole: 'admin',
                                })}
                                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                                    selectedCircle.slug === 'all'
                                        ? 'bg-purple-50 text-purple-700 font-semibold'
                                        : 'text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-xs font-bold text-emerald-700">
                                    🌍
                                </div>
                                <span className="truncate flex-1 font-medium">All Circles</span>
                            </button>

                            {userCircles.map((circle) => (
                                <button
                                    key={circle.id}
                                    onClick={() => handleSwitchCircle(circle)}
                                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                                        circle.id === selectedCircle.id
                                            ? 'bg-purple-50 text-purple-700 font-semibold'
                                            : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-purple-50 text-xs font-bold text-purple-700">
                                        {circle.imageUrl ? (
                                            <img
                                                src={circle.imageUrl}
                                                alt={circle.name}
                                                className="h-full w-full rounded-md object-cover"
                                            />
                                        ) : (
                                            circle.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <span className="truncate flex-1">{circle.name}</span>
                                    {circle.userRole === 'member' && (
                                        <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded">member</span>
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="border-t border-gray-100 mt-1.5 pt-1.5">
                            <Link
                                href="/circles"
                                onClick={() => setIsDropdownOpen(false)}
                                className="flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-center text-xs font-medium text-purple-600 hover:bg-purple-50 transition-colors"
                            >
                                <span>Manage Circles</span>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* Navigation */}
        <nav className="space-y-1 flex-1 overflow-y-auto">
            {filteredNavItems.map((item, index) => {
                const tab = searchParams?.get('tab');
                const isDashboardActive = item.label === 'Dashboard' && pathname === '/dashboard';
                const isCirclesActive = item.label === 'Circles' && pathname === '/circles';
                const isMembersActive = item.label === 'Members' && pathname.startsWith('/circles/') && tab === 'members';
                const isSettingsActive = item.label === 'Circle Settings' && pathname.startsWith('/circles/') && tab === 'settings';
                const isAppSettingsActive = item.label === 'App Settings' && pathname === '/settings';
                const isContributionsActive = item.label === 'Contributions' && pathname === '/contributions';
                const isTransactionsActive = item.label === 'Transactions' && pathname === '/transactions';
                const isPayoutsActive = item.label === 'Payouts' && pathname === '/payouts';
                const isReportsActive = item.label === 'Reports' && pathname === '/reports';

                const isActive = isDashboardActive || isCirclesActive || isMembersActive || isSettingsActive || isAppSettingsActive || isContributionsActive || isTransactionsActive || isPayoutsActive || isReportsActive;

                return (
                    <Link
                        key={index}
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                            isActive
                                ? 'bg-purple-50 text-purple-600 font-semibold'
                                : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        <item.icon size={20} className={isActive ? 'text-purple-600' : 'text-gray-400'} />
                        <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                );
            })}
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
