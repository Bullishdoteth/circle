/**
 * Converts a circle name into a web-friendly URL slug in real-time.
 */
export function generateSlug(text: string): string {
    if (!text) return '';
    
    return text
        .toLowerCase()
        .trim()
        .normalize('NFD') // Separate accents
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9 -]/g, '') // Remove invalid chars
        .replace(/\s+/g, '-') // Collapse whitespace and replace by -
        .replace(/-+/g, '-') // Collapse dashes
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, ''); // Trim - from end of text
}