import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Calendar, Clock, ChevronLeft } from 'lucide-react';
import { getDocBySlug, getAllDocs } from '@/lib/markdown';

interface DocsPageProps {
    params: Promise<{
        slug?: string[];
    }>;
}

export async function generateStaticParams() {
    const docs = getAllDocs();
    // Catch-all route needs format: { slug: [] } for index, or { slug: [name] }
    return [
        { slug: [] }, // introduction
        ...docs.map((doc) => ({
            slug: doc.slug === 'introduction' ? [] : [doc.slug],
        })),
    ];
}

export default async function DocsPage({ params }: DocsPageProps) {
    const resolvedParams = await params;
    const slugArray = resolvedParams.slug || [];
    const slug = slugArray.join('/');

    const doc = getDocBySlug(slug);

    if (!doc) {
        notFound();
    }

    // Dynamic Previous / Next pagination
    const allDocs = getAllDocs();
    const currentSlug = slug === '' ? 'introduction' : slug;
    const currentIndex = allDocs.findIndex((d) => d.slug === currentSlug);

    const prevDoc = currentIndex > 0 ? allDocs[currentIndex - 1] : null;
    const nextDoc = currentIndex < allDocs.length - 1 && currentIndex !== -1 ? allDocs[currentIndex + 1] : null;

    return (
        <div className="flex w-full gap-8 xl:gap-12 items-start">
            {/* Center Content Column */}
            <article className="flex-1 min-w-0">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-6">
                    <span className="hover:text-neutral-900 dark:hover:text-white transition-colors">Docs</span>
                    <ChevronRight className="h-3.5 w-3.5 text-neutral-300 dark:text-neutral-700" />
                    <span className="text-neutral-900 dark:text-neutral-200 capitalize font-semibold">
                        {doc.title}
                    </span>
                </nav>

                {/* Header Section */}
                <header className="mb-8 border-b border-neutral-100 dark:border-neutral-900 pb-8">
                    <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white mb-3">
                        {doc.title}
                    </h1>
                    {doc.description && (
                        <p className="text-lg text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-3xl">
                            {doc.description}
                        </p>
                    )}

                    {/* Metadata items */}
                    <div className="flex flex-wrap items-center gap-4 mt-6 text-xs text-neutral-400 dark:text-neutral-500 font-medium">
                        <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{doc.readingTime}</span>
                        </div>
                        <span className="text-neutral-200 dark:text-neutral-800">•</span>
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Last updated: {doc.lastUpdated}</span>
                        </div>
                    </div>
                </header>

                {/* Article HTML Body */}
                <div 
                    className="prose prose-neutral max-w-none dark:prose-invert leading-8 text-neutral-800 dark:text-neutral-200"
                    dangerouslySetInnerHTML={{ __html: doc.contentHtml }}
                />

                {/* Prev / Next Pagination Navigator */}
                <div className="mt-16 pt-8 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-4">
                    {prevDoc ? (
                        <Link
                            href={`/docs${prevDoc.slug === 'introduction' ? '' : `/${prevDoc.slug}`}`}
                            className="flex-1 max-w-[240px] flex items-center gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 text-left hover:border-[#4AA054] hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-all group"
                        >
                            <ChevronLeft className="h-5 w-5 text-neutral-400 group-hover:text-[#4AA054] transition-colors shrink-0" />
                            <div className="min-w-0">
                                <span className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Previous</span>
                                <span className="block text-sm font-bold text-neutral-800 dark:text-neutral-200 truncate mt-0.5">{prevDoc.title}</span>
                            </div>
                        </Link>
                    ) : (
                        <div className="flex-1" />
                    )}

                    {nextDoc ? (
                        <Link
                            href={`/docs${nextDoc.slug === 'introduction' ? '' : `/${nextDoc.slug}`}`}
                            className="flex-1 max-w-[240px] flex items-center justify-between gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 text-right hover:border-[#4AA054] hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-all group"
                        >
                            <div className="min-w-0 text-right">
                                <span className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Next</span>
                                <span className="block text-sm font-bold text-neutral-800 dark:text-neutral-200 truncate mt-0.5">{nextDoc.title}</span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-neutral-400 group-hover:text-[#4AA054] transition-colors shrink-0" />
                        </Link>
                    ) : (
                        <div className="flex-1" />
                    )}
                </div>
            </article>

            {/* Right Side Table of Contents (Floating sidebar on desktop) */}
            {doc.headings.length > 0 && (
                <aside className="hidden xl:block w-64 shrink-0 max-h-[calc(100vh-6rem)] overflow-y-auto sticky top-24 pt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3 pl-2">
                        On this page
                    </h4>
                    <ul className="space-y-2 border-l border-neutral-200 dark:border-neutral-800 pl-2 text-sm">
                        {doc.headings.map((heading) => {
                            const indent = heading.depth === 3 ? 'pl-4 text-xs' : 'font-medium';
                            return (
                                <li key={heading.id}>
                                    <a
                                        href={`#${heading.id}`}
                                        className={`block py-1 text-neutral-500 dark:text-neutral-400 hover:text-[#4AA054] dark:hover:text-[#64c26e] transition-colors truncate ${indent}`}
                                    >
                                        {heading.text}
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                </aside>
            )}
        </div>
    );
}
