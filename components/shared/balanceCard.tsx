import { Eye } from 'lucide-react';

export function BalanceCard({ activeCircle, totalCirclesCount = 1 }: { activeCircle?: { currency: string } | null; totalCirclesCount?: number }) {
    const formattedBalance = activeCircle ? `${activeCircle.currency === 'USD' ? '$' : '₦'}0` : '₦1,250,000';
    const circlesLabel = totalCirclesCount === 1 ? 'Across 1 circle' : `Across ${totalCirclesCount} circles`;

    return (
        <div className="bg-linear-to-br from-green-600 via-green-500 to-green-400 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
        {/* Background chart line */}
        <svg
            className="absolute inset-0 opacity-20"
            viewBox="0 0 300 200"
            preserveAspectRatio="none"
        >
            <path
            d="M 0 150 Q 50 120, 100 100 T 200 60 T 300 40"
            stroke="white"
            strokeWidth="2"
            fill="none"
            />
        </svg>

        <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
            <span className="text-xs md:text-sm font-medium opacity-90">Total Balance</span>
            <Eye size={16} className="opacity-70" />
            </div>

            <div className="mb-4 md:mb-6">
            <h2 className="text-3xl md:text-5xl font-bold mb-1 md:mb-2 text-balance">{formattedBalance}</h2>
            <p className="text-xs md:text-sm opacity-90">{circlesLabel}</p>
            </div>
        </div>
        </div>
    );
}
