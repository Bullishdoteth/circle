'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'

const navItems = [
    { label: 'How it works', href: '/#how-it-works' },
    { label: 'Features', href: '/#features' },
    { label: 'FAQs', href: '/#faq' },
    { label: 'Docs', href: '/docs' },
]

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen)
    }

    return (
        <header className="sticky top-0 z-50 border-b border-neutral-200/60 bg-white/80 backdrop-blur-xl">
            <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
                {/* Logo */}
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

                {/* Desktop Navigation */}
                <div className="hidden items-center gap-8 md:flex">
                    {navItems.map((item) => (
                        <Link
                        key={item.href}
                        href={item.href}
                        className="text-sm font-medium text-neutral-600 transition-colors hover:text-black"
                        >
                        {item.label}
                        </Link>
                    ))}
                </div>

                {/* Desktop CTAs */}
                <div className="hidden items-center gap-5 md:flex">
                    <Link
                        href="/join-circle"
                        className="cursor-pointer text-sm font-medium text-neutral-600 transition-colors hover:text-black"
                    >
                        Join a Circle
                    </Link>

                    <Button
                        asChild
                        className="cursor-pointer h-11 rounded-full bg-[#4AA054] px-6 text-sm font-medium text-white shadow-sm transition-all hover:scale-[1.02] hover:bg-[#408d49]"
                    >
                        <Link href="/sign-up">
                        Create a Circle
                        </Link>
                    </Button>
                </div>

                {/* Mobile Menu Button */}
                <div className="flex md:hidden">
                    <button
                        onClick={toggleMenu}
                        className="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-secondary hover:text-primary transition-colors"
                        aria-expanded={isMenuOpen}
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? (
                        <X className="h-6 w-6" />
                        ) : (
                        <Menu className="h-6 w-6" />
                        )}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="border-t border-border md:hidden">
                    <div className="space-y-1 px-6 py-6">
                        {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="block rounded-lg px-4 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-black"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            {item.label}
                        </Link>
                        ))}
                        <div className="border-t border-border my-4" />
                        <Link
                        href="/join-circle"
                        className="cursor-pointer block rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-secondary hover:text-primary transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                        >
                        Join a Circle
                        </Link>
                        <Button
    asChild
    className="cursor-pointer mt-4 h-11 w-full rounded-full bg-[#4AA054]"
    >
                        <Link href="/sign-up" onClick={() => setIsMenuOpen(false)}>
                            Create a Circle
                        </Link>
                        </Button>
                    </div>
                </div>
            )}
        </header>
    )
}