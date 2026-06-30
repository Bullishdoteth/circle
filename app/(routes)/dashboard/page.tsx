'use client';

import { BalanceCard } from '@/components/shared/balanceCard';
import { ContributionsCard } from '@/components/shared/contributionsCard';
import { Greetings } from '@/components/shared/greetings';
import { RecentActivity } from '@/components/shared/recentActivity';
import { SecurityCard } from '@/components/shared/securityCard';
import { TopCircles } from '@/components/shared/topCircles';


export default function Dashboard() {
    return (
        <div className="bg-gray-50">

            {/* Scrollable Content */}
            <div className="flex-1 overflow-auto">
                <div className="p-4 md:p-8">
                {/* Header - Greeting */}
                <Greetings userName="Ada" />

                {/* Top Section - Balance and Contributions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                    <div className="lg:col-span-2">
                    <BalanceCard />
                    </div>
                    <div>
                    <ContributionsCard />
                    </div>
                </div>

                {/* Middle Section - Recent Activity and Top Circles */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
                    <RecentActivity />
                    <TopCircles />
                </div>

                {/* Bottom Section - Security Card */}
                <SecurityCard />
                </div>
            </div>
        </div>
    );
}
