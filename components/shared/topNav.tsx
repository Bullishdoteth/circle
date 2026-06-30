'use client';

import { Bell } from 'lucide-react';
import { ReactNode } from 'react';
import Image from 'next/image';

interface TopNavProps {
    userImage: string;
    userName: string;
    sidebarToggle?: ReactNode;
}

export function TopNav({ userImage, userName, sidebarToggle }: TopNavProps) {
    return (
        <div className="bg-white border-b border-gray-200 h-16 md:h-20">
        <div className="flex items-center justify-between h-full px-4 md:px-8">
            <div className="flex items-center gap-4 flex-1">
            {sidebarToggle}
            {/*<h1 className="text-xl md:text-2xl font-semibold text-gray-900">Circle</h1>*/}
            </div>

            <div className="flex items-center gap-3 md:gap-4 shrink-0">
            <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Bell size={20} className="md:w-6 md:h-6 text-gray-700" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <Image
                src={userImage}
                alt={userName}
                width={40}
                height={40}
                className="w-9 md:w-10 h-9 md:h-10 rounded-full object-cover"
            />
            </div>
        </div>
        </div>
    );
}