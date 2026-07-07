import Image from "next/image";
import Link from "next/link";
import { FaLinkedinIn, FaInstagram, FaTwitter, FaApple, FaGooglePlay } from "react-icons/fa";

const productLinks = [
    { label: "Features", href: "/#features" },
    { label: "How it Works", href: "/#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "Security", href: "#/security" },
];

const companyLinks = [
    { label: "About", href: "/#about" },
    { label: "Blog", href: "/#blog" },
    { label: "Careers", href: "/#careers" },
    { label: "Contact", href: "/#contact" },
];

const resourceLinks = [
    { label: "Help Center", href: "/#help" },
    { label: "Community", href: "/#community" },
    { label: "Status", href: "/#status" },
    { label: "Developers", href: "/docs" },
];

const legalLinks = [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Cookies", href: "/cookies" },
];

export default function Footer() {
    return (
        <footer className="border-t border-neutral-200 bg-white">
            <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
                {/* Top */}
                <div className="grid gap-14 lg:grid-cols-[1.4fr_2fr]">
                {/* Brand */}
                <div>
                    <Image
                    src="/circle.png"
                    alt="Circle"
                    width={150}
                    height={42}
                    className="h-10 w-auto"
                    />

                    <p className="mt-6 max-w-md text-sm leading-7 text-neutral-600">
                    Save together with complete transparency. Create savings
                    circles, collect contributions, track every payment and
                    distribute payouts—all in one place.
                    </p>

                    {/* App badges */}
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link
                            href="#"
                            className="inline-flex w-fit cursor-not-allowed select-none items-center gap-3 rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-white opacity-70 transition-all hover:opacity-100"
                        >
                            <FaApple className="h-7 w-7" />

                            <div className="flex flex-col leading-none">
                            <span className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400">
                                Coming Soon
                            </span>

                            <span className="text-[15px] font-semibold">
                                App Store
                            </span>
                            </div>
                        </Link>

                        <Link
                            href="#"
                            className="inline-flex w-fit cursor-not-allowed select-none items-center gap-3 rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-white opacity-70 transition-all hover:opacity-100"
                        >
                            <FaGooglePlay className="h-6 w-6" />

                            <div className="flex flex-col leading-none">
                            <span className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400">
                                Coming Soon
                            </span>

                            <span className="text-[15px] font-semibold">
                                Google Play
                            </span>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Links */}
                <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
                    <div>
                    <h3 className="text-sm font-semibold text-black">
                        Product
                    </h3>

                    <ul className="mt-5 space-y-3">
                        {productLinks.map((item) => (
                        <li key={item.label}>
                            <Link
                            href={item.href}
                            className="text-sm text-neutral-600 transition-colors hover:text-black"
                            >
                            {item.label}
                            </Link>
                        </li>
                        ))}
                    </ul>
                    </div>

                    <div>
                    <h3 className="text-sm font-semibold text-black">
                        Company
                    </h3>

                    <ul className="mt-5 space-y-3">
                        {companyLinks.map((item) => (
                        <li key={item.label}>
                            <Link
                            href={item.href}
                            className="text-sm text-neutral-600 transition-colors hover:text-black"
                            >
                            {item.label}
                            </Link>
                        </li>
                        ))}
                    </ul>
                    </div>

                    <div>
                    <h3 className="text-sm font-semibold text-black">
                        Resources
                    </h3>

                    <ul className="mt-5 space-y-3">
                        {resourceLinks.map((item) => (
                        <li key={item.label}>
                            <Link
                            href={item.href}
                            className="text-sm text-neutral-600 transition-colors hover:text-black"
                            >
                            {item.label}
                            </Link>
                        </li>
                        ))}
                    </ul>
                    </div>

                    <div>
                    <h3 className="text-sm font-semibold text-black">
                        Legal
                    </h3>

                    <ul className="mt-5 space-y-3">
                        {legalLinks.map((item) => (
                        <li key={item.label}>
                            <Link
                            href={item.href}
                            className="text-sm text-neutral-600 transition-colors hover:text-black"
                            >
                            {item.label}
                            </Link>
                        </li>
                        ))}
                    </ul>
                    </div>
                </div>
                </div>

                {/* Divider */}
                <div className="my-10 h-px bg-neutral-200" />

                {/* Bottom */}
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-neutral-500">
                    © {new Date().getFullYear()} Circle. All rights reserved.
                    </p>

                    <p className="mt-2 text-sm text-neutral-500">
                    Bank-level security • End-to-end encryption
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                    href="#"
                    className="rounded-full border border-neutral-200 p-2 text-neutral-600 transition-colors hover:border-neutral-300 hover:text-black"
                    >
                    <FaTwitter className="h-4 w-4" />
                    </Link>

                    <Link
                    href="#"
                    className="rounded-full border border-neutral-200 p-2 text-neutral-600 transition-colors hover:border-neutral-300 hover:text-black"
                    >
                    <FaInstagram className="h-4 w-4" />
                    </Link>

                    <Link
                    href="#"
                    className="rounded-full border border-neutral-200 p-2 text-neutral-600 transition-colors hover:border-neutral-300 hover:text-black"
                    >
                    <FaLinkedinIn className="h-4 w-4" />
                    </Link>
                </div>
                </div>
            </div>
        </footer>
    );
}