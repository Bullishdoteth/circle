'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowLeft, Sun, Moon } from 'lucide-react';
import DocsSearch from './docsSearch';

interface LinkItem {
    title: string;
    slug: string;
}

interface DocsNavigationProps {
    links: LinkItem[];
    children: React.ReactNode;
}

export default function DocsNavigation({ links, children }: DocsNavigationProps) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const pathname = usePathname();

    // Sync theme settings with document class list
    useEffect(() => {
        const storedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (storedTheme === 'dark' || (!storedTheme && systemPrefersDark)) {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        if (isDarkMode) {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
    };

    // Close mobile drawer on route change
    useEffect(() => {
        setIsDrawerOpen(false);
    }, [pathname]);

    return (
        <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-150">
            {/* Top Navigation */}
            <header className="sticky top-0 z-40 w-full border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-8xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    {/* Left: Brand Logo & Hamburger */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-950 dark:hover:text-white transition-colors lg:hidden cursor-pointer"
                            aria-expanded={isDrawerOpen}
                            aria-label="Toggle navigation drawer"
                        >
                            {isDrawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                        
                        <Link href="/" className="flex items-center gap-2">
                            <Image
                                src="/circle.png"
                                alt="Circle Logo"
                                width={100}
                                height={32}
                                className="h-7 w-auto dark:brightness-110"
                                priority
                            />
                            <span className="hidden sm:inline-flex rounded-full bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 border border-neutral-200/50 dark:border-neutral-800/50">
                                Docs
                            </span>
                        </Link>
                    </div>

                    {/* Middle: Search Box */}
                    <div className="flex flex-1 items-center justify-center px-4 md:px-12">
                        <DocsSearch />
                    </div>

                    {/* Right: Actions (Theme + Dashboard) */}
                    <div className="flex items-center gap-4">
                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50"
                            aria-label="Toggle theme mode"
                        >
                            {isDarkMode ? <Sun className="h-4 w-4 text-[#4AA054]" /> : <Moon className="h-4 w-4 text-neutral-500" />}
                        </button>

                        <Link
                            href="/dashboard"
                            className="hidden sm:flex items-center gap-1.5 rounded-full bg-[#4AA054] px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-[#3d8545] transition-all"
                        >
                            <ArrowLeft className="h-3 w-3" />
                            <span>Dashboard</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Layout Shell */}
            <div className="flex-1 flex max-w-8xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                {/* Desktop Left Sidebar */}
                <aside className="hidden lg:block lg:w-64 xl:w-72 lg:shrink-0 lg:border-r lg:border-neutral-200 dark:lg:border-neutral-800 lg:pt-8 lg:pr-6 overflow-y-auto max-h-[calc(100vh-4rem)] sticky top-16">
                    <nav className="space-y-8">
                        <div>
                            <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                                Documentation
                            </h3>
                            <ul className="mt-3 space-y-1">
                                {links.map((link) => {
                                    const href = `/docs${link.slug === 'introduction' ? '' : `/${link.slug}`}`;
                                    const isActive = pathname === href;
                                    return (
                                        <li key={link.slug}>
                                            <Link
                                                href={href}
                                                className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                                                    isActive
                                                        ? 'bg-neutral-100 dark:bg-neutral-900 text-[#4AA054] dark:text-[#64c26e] font-semibold border-l-2 border-[#4AA054]'
                                                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/30 hover:text-neutral-950 dark:hover:text-white'
                                                }`}
                                            >
                                                {link.title}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </nav>
                </aside>

                {/* Mobile Drawer (Sidebar on Mobile overlay) */}
                {isDrawerOpen && (
                    <div className="fixed inset-0 z-50 flex lg:hidden">
                        {/* Overlay backdrop */}
                        <div
                            onClick={() => setIsDrawerOpen(false)}
                            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity"
                        />
                        {/* Drawer body */}
                        <div className="relative flex w-full max-w-xs flex-col bg-white dark:bg-neutral-950 p-6 shadow-xl border-r border-neutral-200 dark:border-neutral-800 animate-slide-in">
                            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-900">
                                <Link href="/" className="flex items-center gap-2">
                                    <Image
                                        src="/circle.png"
                                        alt="Circle Logo"
                                        width={90}
                                        height={28}
                                        className="h-6 w-auto"
                                    />
                                </Link>
                                <button
                                    onClick={() => setIsDrawerOpen(false)}
                                    className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-600 dark:hover:text-white cursor-pointer"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <nav className="mt-6 flex-1 overflow-y-auto space-y-6">
                                <div>
                                    <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                                        Documentation
                                    </h3>
                                    <ul className="mt-3 space-y-1">
                                        {links.map((link) => {
                                            const href = `/docs${link.slug === 'introduction' ? '' : `/${link.slug}`}`;
                                            const isActive = pathname === href;
                                            return (
                                                <li key={link.slug}>
                                                    <Link
                                                        href={href}
                                                        className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                                                            isActive
                                                                ? 'bg-neutral-100 dark:bg-neutral-900 text-[#4AA054] dark:text-[#64c26e] font-semibold border-l-2 border-[#4AA054]'
                                                                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/30 hover:text-neutral-950 dark:hover:text-white'
                                                        }`}
                                                    >
                                                        {link.title}
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </nav>
                            <div className="mt-auto border-t border-neutral-100 dark:border-neutral-900 pt-4">
                                <Link
                                    href="/dashboard"
                                    className="flex w-full items-center justify-center gap-1.5 rounded-full bg-[#4AA054] py-2.5 text-xs font-semibold text-white shadow hover:bg-[#3d8545]"
                                >
                                    <ArrowLeft className="h-3 w-3" />
                                    <span>Back to Dashboard</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Page content wrapper */}
                <main className="flex-1 min-w-0 pt-8 pb-16 lg:px-8 xl:px-12 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
