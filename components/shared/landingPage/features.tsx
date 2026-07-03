import {
    ArrowLeftRight,
    BarChart3,
    Landmark,
    ShieldCheck,
    Users,
    Wallet,
    CalendarClock,
} from "lucide-react";

export default function Features() {
    return (
        <section
            id="features"
            className="scroll-mt-28 mx-auto mt-28 w-full max-w-7xl px-6"
        >
            <div className="mx-auto max-w-2xl text-center">
                <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-4 py-1 text-sm font-medium text-emerald-700">
                    Everything your savings community needs
                </span>

                <h2 className="mt-5 font-space-grotesk text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
                    Built for modern savings communities
                </h2>

                <p className="mt-5 text-lg leading-8 text-neutral-600">
                    Everything you need to organize, manage and grow transparent
                    savings circles—from collecting contributions to tracking
                    payouts.
                </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-4 lg:auto-rows-[220px]">
                {/* 1 */}
                <FeatureCard
                    className="lg:col-span-2 lg:row-span-2"
                    icon={<Landmark size={26} />}
                    title="Unique Virtual Accounts"
                    description="Assign every member or community a dedicated virtual account. Contributions are automatically linked to the correct savings circle without manual verification."
                />

                {/* 2 */}
                <FeatureCard
                    icon={<ArrowLeftRight size={24} />}
                    title="Automatic Reconciliation"
                    description="Incoming transfers are instantly matched with members so you always know who has contributed."
                />

                {/* 3 */}
                <FeatureCard
                    icon={<Users size={24} />}
                    title="Role-based Access"
                    description="Owners, treasurers, admins and members each have permissions tailored to their responsibilities."
                />

                {/* 4 */}
                <FeatureCard
                    icon={<BarChart3 size={24} />}
                    title="Contribution Insights"
                    description="View payment history, outstanding balances and member activity from one dashboard."
                />

                {/* 5 */}
                <FeatureCard
                    icon={<CalendarClock size={24} />}
                    title="Scheduled Payouts"
                    description="Keep everyone informed with organized payout rotations and contribution schedules."
                />

                {/* 6 */}
                <FeatureCard
                    className="lg:col-span-2"
                    icon={<Wallet size={26} />}
                    title="Built for Communities"
                    description="Whether it's an Ajo, Esusu, cooperative, school levy or family savings group, Circle provides the infrastructure to manage contributions transparently while reducing manual work."
                />

                {/* 7 */}
                <FeatureCard
                    icon={<ShieldCheck size={24} />}
                    title="Secure by Design"
                    description="Protected authentication, secure payments and detailed activity logs keep every transaction accountable."
                />
            </div>
        </section>
    );
}

interface FeatureCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    className?: string;
}

function FeatureCard({
    title,
    description,
    icon,
    className,
}: FeatureCardProps) {
    return (
        <article
            className={`group relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl ${className}`}
        >
            <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-emerald-100/60 blur-3xl transition-opacity group-hover:opacity-100" />

            <div className="relative flex h-full flex-col">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    {icon}
                </div>

                <h3 className="font-space-grotesk text-2xl font-semibold tracking-tight text-neutral-900">
                    {title}
                </h3>

                <p className="mt-4 leading-7 text-neutral-600">
                    {description}
                </p>

                <div className="mt-auto pt-8">
                    <span className="text-sm font-medium text-emerald-700">
                        Learn more →
                    </span>
                </div>
            </div>
        </article>
    );
}