'use client';

import { Users, Gift, Wallet, UserPlus, ArrowRight } from 'lucide-react';

interface ActivityItem {
    id: string;
    type: 'contribution' | 'payout' | 'member';
    icon: 'users' | 'gift' | 'wallet' | 'user-plus';
    title: string;
    description: string;
    time: string;
    amount?: string;
}

const activityData: ActivityItem[] = [
    {
        id: '1',
        type: 'contribution',
        icon: 'gift',
        title: 'Mary contributed ₦10,000 to Weekend Friends',
        description: '',
        time: '2 mins ago',
        amount: '₦10,000',
    },
    {
        id: '2',
        type: 'contribution',
        icon: 'gift',
        title: 'David contributed ₦20,000 to Rent Group',
        description: '',
        time: '15 mins ago',
        amount: '₦20,000',
    },
    {
        id: '3',
        type: 'payout',
        icon: 'wallet',
        title: 'Payout of ₦150,000 to Tunde',
        description: '',
        time: '1 hour ago',
        amount: '₦150,000',
    },
    {
        id: '4',
        type: 'member',
        icon: 'user-plus',
        title: 'New member joined Family Circle',
        description: '',
        time: '2 hours ago',
    },
];

function getIcon(type: string) {
    const iconMap: Record<string, React.ReactNode> = {
        gift: <Gift size={20} className="text-amber-500" />,
        wallet: <Wallet size={20} className="text-blue-500" />,
        'user-plus': <UserPlus size={20} className="text-purple-500" />,
        users: <Users size={20} className="text-green-500" />,
    };
    return iconMap[type];
}

export function RecentActivity() {
    return (
        <div className="bg-white rounded-2xl p-4 md:p-6">
        <h2 className="text-base md:text-lg font-bold text-gray-900 mb-4 md:mb-6">Recent Activity</h2>

        <div className="space-y-3 md:space-y-4">
            {activityData.map((item) => (
            <div key={item.id} className="flex items-start gap-3 md:gap-4 pb-3 md:pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
                <div className="shrink-0 w-9 md:w-10 h-9 md:h-10 bg-gray-100 rounded-full flex items-center justify-center">
                {getIcon(item.icon)}
                </div>

                <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-medium text-gray-900 leading-tight text-pretty">
                    {item.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                </div>

                {item.amount && (
                <p className="text-xs md:text-sm font-semibold text-gray-900 shrink-0 whitespace-nowrap">
                    {item.amount}
                </p>
                )}
            </div>
            ))}
        </div>

        <a
            href="#"
            className="inline-flex items-center gap-1 text-purple-600 font-medium text-xs md:text-sm mt-4 md:mt-6 hover:gap-2 transition-all"
        >
            View all activity
            <ArrowRight size={16} />
        </a>
        </div>
    );
}
