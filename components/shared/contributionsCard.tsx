import { TrendingUp } from 'lucide-react';

    export function ContributionsCard({ activeCircle }: { activeCircle?: { currency: string } | null }) {
    const contrib = activeCircle ? `${activeCircle.currency === 'USD' ? '$' : '₦'}0` : '₦850,000';
    return (
        <div className="bg-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1">
            <p className="text-gray-600 text-xs md:text-sm mb-2">Contributions this month</p>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 text-balance">{contrib}</h3>
            <div className="flex items-center gap-1 text-green-600 text-xs md:text-sm font-medium">
            <TrendingUp size={16} />
            <span>+24% from last month</span>
            </div>
        </div>

        {/* Circular Progress Indicator */}
        <div className="relative w-20 h-20 md:w-24 md:h-24 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeDasharray={`${(85 / 100) * 2 * Math.PI * 45} ${
                2 * Math.PI * 45
                }`}
                strokeLinecap="round"
            />
            <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#5b21b6" />
                </linearGradient>
            </defs>
            </svg>

            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl md:text-2xl font-bold text-purple-600">85%</span>
            </div>
        </div>
        </div>
    );
}
