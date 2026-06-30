import { ShieldCheck, ArrowRight } from 'lucide-react';

export function SecurityCard() {
    return (
        <div className="bg-linear-to-br from-purple-50 to-purple-100 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-start gap-3 md:gap-4">
        <div className="shrink-0 w-10 md:w-12 h-10 md:h-12 bg-purple-600 rounded-lg flex items-center justify-center">
            <ShieldCheck size={20} className="md:w-6 md:h-6 text-white" />
        </div>

        <div className="flex-1">
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">
            Your money is safe with Circle
            </h3>
            <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
            Bank-grade security, encrypted data, and transparent records you can trust.
            </p>

            <a
            href="#"
            className="inline-flex items-center gap-1 text-purple-600 font-medium text-xs md:text-sm hover:gap-2 transition-all"
            >
            Learn more
            <ArrowRight size={16} />
            </a>
        </div>
        </div>
    );
}
