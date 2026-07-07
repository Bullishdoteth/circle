'use server';

import { searchDocs, SearchResult } from '@/lib/markdown';

/**
 * Server action to search docs.
 */
export async function searchDocsAction(query: string): Promise<SearchResult[]> {
    try {
        return searchDocs(query);
    } catch (e) {
        console.error('Failed to search docs action:', e);
        return [];
    }
}
