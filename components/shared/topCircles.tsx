'use client';

interface Circle {
    id: string;
    name: string;
    members: number;
    balance: string;
    image: string;
    progressPercent: number;
}

const circlesData: Circle[] = [
    {
        id: '1',
        name: 'Weekend Friends',
        members: 12,
        balance: '₦480,000',
        image: '👥',
        progressPercent: 95,
    },
    {
        id: '2',
        name: 'Rent Group',
        members: 8,
        balance: '₦320,000',
        image: '🏠',
        progressPercent: 80,
    },
    {
        id: '3',
        name: 'Family Circle',
        members: 10,
        balance: '₦250,000',
        image: '👨‍👩‍👧‍👦',
        progressPercent: 65,
    },
    {
        id: '4',
        name: 'Investment Club',
        members: 15,
        balance: '₦200,000',
        image: '📈',
        progressPercent: 75,
    },
];

export function TopCircles() {
    return (
        <div className="bg-white rounded-2xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-base md:text-lg font-bold text-gray-900">Top Circles</h2>
            <a href="#" className="text-purple-600 font-medium text-xs md:text-sm hover:underline">
            View all
            </a>
        </div>

        <div className="space-y-4 md:space-y-6">
            {circlesData.map((circle) => (
            <div key={circle.id}>
                <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                <div className="w-7 md:w-8 h-7 md:h-8 rounded-full bg-linear-to-br from-purple-100 to-purple-50 flex items-center justify-center text-base md:text-lg shrink-0">
                    {circle.image}
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="text-xs md:text-sm font-semibold text-gray-900 truncate">
                    {circle.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                    {circle.members} members
                    </p>
                </div>

                <span className="text-xs md:text-sm font-bold text-gray-900 shrink-0 whitespace-nowrap">
                    {circle.balance}
                </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 md:h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className="h-full bg-linear-to-r from-purple-600 to-purple-400 rounded-full"
                    style={{ width: `${circle.progressPercent}%` }}
                />
                </div>
            </div>
            ))}
        </div>
        </div>
    );
}
