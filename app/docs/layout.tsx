import { getAllDocs } from '@/lib/markdown';
import DocsNavigation from '@/components/shared/docsNavigation';

export const metadata = {
    title: 'Circle Developer Documentation',
    description: 'Complete architecture reference, payments guides, API specification, and environment configurations for Circle.',
};

export default function DocsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const links = getAllDocs();

    return (
        <DocsNavigation links={links}>
            {children}
        </DocsNavigation>
    );
}
