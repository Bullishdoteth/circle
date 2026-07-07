'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, CornerDownLeft, Command } from 'lucide-react';
import { searchDocsAction } from '@/lib/actions/docs';
import type { SearchResult } from '@/lib/markdown';

export default function DocsSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const modalRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Open/Close on Cmd+K or Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    // Handle search queries with debounce
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await searchDocsAction(query);
                setResults(res);
                setSelectedIndex(0);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }, 150);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    // Navigate list via keyboard
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (results.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            selectResult(results[selectedIndex]);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const selectResult = (result: SearchResult) => {
        router.push(`/docs/${result.slug}`);
        setIsOpen(false);
    };

    // Close on click outside
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            setIsOpen(false);
        }
    };

    return (
        <>
            {/* Search Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="flex w-full max-w-xs items-center justify-between rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 px-4 py-2 text-sm text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-neutral-950 dark:hover:text-white transition-all cursor-pointer shadow-sm md:w-64"
            >
                <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-neutral-400" />
                    <span>Search docs...</span>
                </div>
                <kbd className="hidden items-center gap-0.5 rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-1.5 font-mono text-[10px] font-medium text-neutral-400 md:flex">
                    <Command className="h-2.5 w-2.5" />
                    <span>K</span>
                </kbd>
            </button>

            {/* Search Modal Portal */}
            {isOpen && (
                <div
                    onClick={handleBackdropClick}
                    className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 dark:bg-black/60 p-4 pt-[10vh] backdrop-blur-sm"
                >
                    <div
                        ref={modalRef}
                        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl transition-all"
                    >
                        {/* Search Bar Input */}
                        <div className="flex items-center border-b border-neutral-200 dark:border-neutral-800 px-4 py-3">
                            <Search className="h-5 w-5 text-neutral-400 shrink-0" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search documentation, API endpoints, guides..."
                                className="ml-3 w-full bg-transparent text-neutral-950 dark:text-white placeholder-neutral-400 outline-none text-base"
                            />
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Search Results */}
                        <div className="max-h-96 overflow-y-auto p-2">
                            {loading ? (
                                <div className="py-12 text-center text-sm text-neutral-500">Searching...</div>
                            ) : results.length > 0 ? (
                                <ul className="space-y-1">
                                    {results.map((result, index) => {
                                        const isSelected = index === selectedIndex;
                                        return (
                                            <li
                                                key={result.slug}
                                                onClick={() => selectResult(result)}
                                                onMouseEnter={() => setSelectedIndex(index)}
                                                className={`group flex flex-col rounded-xl px-4 py-3 cursor-pointer transition-colors ${
                                                    isSelected
                                                        ? 'bg-neutral-50 dark:bg-neutral-800/50'
                                                        : 'hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                        {result.title}
                                                    </span>
                                                    {isSelected && (
                                                        <span className="flex items-center gap-0.5 font-mono text-[10px] text-[#4AA054]">
                                                            <span>Select</span>
                                                            <CornerDownLeft className="h-2.5 w-2.5" />
                                                        </span>
                                                    )}
                                                </div>
                                                {result.description && (
                                                    <span className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                                                        {result.description}
                                                    </span>
                                                )}
                                                <span className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 line-clamp-2 italic font-mono bg-neutral-50 dark:bg-neutral-950 p-1.5 rounded border border-neutral-100 dark:border-neutral-800/30">
                                                    {result.snippet}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : query.trim() ? (
                                <div className="py-12 text-center text-sm text-neutral-500">
                                    No results found for &ldquo;<span className="font-semibold">{query}</span>&rdquo;
                                </div>
                            ) : (
                                <div className="py-12 text-center text-sm text-neutral-400">
                                    Type a query or press <kbd className="mx-1 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-1 py-0.5 text-[10px] font-mono font-medium">Cmd+K</kbd> to search docs.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
