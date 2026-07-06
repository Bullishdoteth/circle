'use client';

import { ReactNode } from 'react';
import Image from 'next/image';
import { Show, UserButton } from '@clerk/nextjs'
import { NotificationBell } from './notificationBell';

interface TopNavProps {
    userImage: string;
    userName: string;
    sidebarToggle?: ReactNode;
}

export function TopNav({ sidebarToggle }: TopNavProps) {
    return (
        <div className="bg-white border-b border-gray-200 h-16 md:h-20">
            <div className="flex items-center justify-between h-full px-4 md:px-8">
                <div className="flex items-center gap-4 flex-1">
                {sidebarToggle}
                {/*<h1 className="text-xl md:text-2xl font-semibold text-gray-900">Circle</h1>*/}
                </div>

                <div className="flex items-center gap-3 md:gap-4 shrink-0">
                <NotificationBell />

                <Show when="signed-in">
                    <UserButton />
                </Show>
                </div>
            </div>
        </div>
    );
}