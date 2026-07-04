'use client';

import { ReactNode, useEffect, useState, Suspense } from 'react';
import { Sidebar, SidebarToggle } from '@/components/shared/sidebar';
import { TopNav } from '@/components/shared/topNav';

interface AppLayoutProps {
    children: ReactNode;
}

export default function AppLayout({
    children,
}: AppLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (isMobile) {
            setSidebarOpen(false);
        }
    }, [isMobile]);

    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Overlay */}
            {sidebarOpen && isMobile && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 md:hidden"
                    onClick={closeSidebar}
                    aria-hidden="true"
                />
            )}

            <div className="flex h-screen">
                {/* Sidebar */}
                <Suspense fallback={<div className="w-64 bg-white border-r border-gray-200 shrink-0 hidden md:block" />}>
                    <Sidebar
                        isOpen={sidebarOpen}
                        onClose={closeSidebar}
                    />
                </Suspense>

                {/* Right Content Area */}
                <div className="flex flex-1 flex-col min-w-0 md:ml-64">
                    {/* Top Navigation */}
                    <TopNav
                        userImage="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
                        userName="Ada"
                        sidebarToggle={
                            <SidebarToggle
                                onClick={() =>
                                    setSidebarOpen(!sidebarOpen)
                                }
                            />
                        }
                    />

                    {/* Page Content */}
                    <main className="flex-1 overflow-y-auto">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}