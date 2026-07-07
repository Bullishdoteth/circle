import fs from 'fs';
import path from 'path';

export interface DocFrontmatter {
    title: string;
    description?: string;
    lastUpdated?: string;
}

export interface HeadingItem {
    text: string;
    id: string;
    depth: number;
}

export interface DocContent {
    slug: string;
    title: string;
    description: string;
    lastUpdated: string;
    readingTime: string;
    contentHtml: string;
    headings: HeadingItem[];
    rawMarkdown: string;
}

export interface SearchResult {
    slug: string;
    title: string;
    description: string;
    snippet: string;
}

const CONTENT_DIR = path.join(process.cwd(), 'content/docs');

/**
 * Normalizes title into an URL-friendly ID slug.
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

/**
 * Simple calculation of reading time based on word count.
 */
function calculateReadingTime(text: string): string {
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
}

/**
 * Basic syntax highlighting for code blocks in Markdown docs.
 * Safely parses JS/TS, SQL, JSON, and terminal shell scripts.
 */
function highlightCode(code: string, lang: string): string {
    // Escape HTML characters to prevent rendering problems
    let escaped = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    if (!lang) return escaped;

    const l = lang.toLowerCase();

    // 1. Comments: highlight them first
    const commentRegex = /(\/\/.*|\/\*[\s\S]*?\*\/|#\s.*)/g;
    // 2. Strings: single, double, backtick
    const stringRegex = /(&quot;[\s\S]*?&quot;|&#039;[\s\S]*?&#039;|`[\s\S]*?`)/g;
    // 3. Keywords
    const keywordRegex = /\b(const|let|var|function|return|import|export|from|class|extends|default|async|await|if|else|try|catch|finally|for|while|do|switch|case|break|continue|new|typeof|instanceof|throw|null|undefined|true|false|select|insert|update|delete|where|from|join|on|and|or|not|create|table|alter|drop|references|foreign|key|primary|index|unique|Bearer)\b/g;
    // 4. Types and Built-ins
    const typeRegex = /\b(string|number|boolean|any|void|Promise|NextResponse|NextRequest|Response|Request|db|users|circles|circleMembers|invitations|virtualAccounts|contributions|payouts|notifications|clerkClient|ClerkProvider|uuid|pgTable|text|timestamp|numeric|integer)\b/g;

    let highlighted = escaped;

    // Use a tokenization approach or carefully replace using markers to avoid nested replacements
    // Simple placeholder replacement strategy:
    const placeholders: string[] = [];
    
    // Extract comments
    highlighted = highlighted.replace(commentRegex, (match) => {
        const id = `__COMMENT_${placeholders.length}__`;
        placeholders.push(`<span class="text-neutral-500 italic">${match}</span>`);
        return id;
    });

    // Extract strings
    highlighted = highlighted.replace(stringRegex, (match) => {
        const id = `__STRING_${placeholders.length}__`;
        placeholders.push(`<span class="text-green-600 dark:text-green-400">${match}</span>`);
        return id;
    });

    // Replace keywords
    highlighted = highlighted.replace(keywordRegex, '<span class="text-rose-600 dark:text-rose-400 font-semibold">$1</span>');

    // Replace types
    highlighted = highlighted.replace(typeRegex, '<span class="text-cyan-600 dark:text-cyan-400">$1</span>');

    // Restore comments and strings
    for (let i = placeholders.length - 1; i >= 0; i--) {
        highlighted = highlighted.replace(`__COMMENT_${i}__`, placeholders[i]);
        highlighted = highlighted.replace(`__STRING_${i}__`, placeholders[i]);
    }

    return highlighted;
}

/**
 * Parses markdown custom callouts (> [!NOTE])
 */
function parseCallout(type: string, content: string): string {
    const t = type.toUpperCase();
    let border = 'border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20';
    let textTheme = 'text-blue-900 dark:text-blue-200';
    let title = 'Note';
    let svgIcon = `<svg class="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;

    if (t === 'WARNING') {
        border = 'border-l-4 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20';
        textTheme = 'text-amber-900 dark:text-amber-200';
        title = 'Warning';
        svgIcon = `<svg class="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`;
    } else if (t === 'IMPORTANT') {
        border = 'border-l-4 border-purple-500 bg-purple-50/50 dark:bg-purple-950/20';
        textTheme = 'text-purple-900 dark:text-purple-200';
        title = 'Important';
        svgIcon = `<svg class="h-5 w-5 text-purple-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>`;
    } else if (t === 'TIP') {
        border = 'border-l-4 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20';
        textTheme = 'text-emerald-900 dark:text-emerald-200';
        title = 'Tip';
        svgIcon = `<svg class="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>`;
    } else if (t === 'CAUTION') {
        border = 'border-l-4 border-red-500 bg-red-50/50 dark:bg-red-950/20';
        textTheme = 'text-red-900 dark:text-red-200';
        title = 'Caution';
        svgIcon = `<svg class="h-5 w-5 text-red-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`;
    }

    return `
<div class="my-6 p-4 rounded-r-lg ${border} ${textTheme}">
    <div class="flex items-center font-bold uppercase tracking-wider text-xs mb-1.5">
        ${svgIcon}
        <span>${title}</span>
    </div>
    <div class="text-sm leading-relaxed">${content}</div>
</div>`;
}

/**
 * Handcrafted highly-customized Markdown parser that builds exact standard markdown elements.
 */
export function renderMarkdownToHtml(markdown: string): { html: string; headings: HeadingItem[] } {
    const headings: HeadingItem[] = [];
    let lines = markdown.split(/\r?\n/);
    let html = '';
    let inCodeBlock = false;
    let codeContent = '';
    let codeLang = '';
    let inList = false;
    let listType: 'ul' | 'ol' | null = null;
    let inTable = false;
    let tableHeaders: string[] = [];
    let tableAlignments: ('left' | 'center' | 'right')[] = [];
    let tableRows: string[][] = [];

    // Helper to render lists
    const closeList = () => {
        if (inList) {
            html += listType === 'ul' ? '</ul>' : '</ol>';
            inList = false;
            listType = null;
        }
    };

    // Helper to render tables
    const closeTable = () => {
        if (inTable) {
            let tableHtml = '<div class="overflow-x-auto my-6 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm">';
            tableHtml += '<table class="w-full text-left text-sm border-collapse">';
            tableHtml += '<thead class="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">';
            tableHtml += '<tr>';
            tableHeaders.forEach((header, index) => {
                const align = tableAlignments[index] || 'left';
                const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
                tableHtml += `<th class="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100 ${alignClass}">${inlineParser(header)}</th>`;
            });
            tableHtml += '</tr></thead>';
            tableHtml += '<tbody class="divide-y divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-950">';
            tableRows.forEach((row) => {
                tableHtml += '<tr class="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors">';
                row.forEach((cell, index) => {
                    const align = tableAlignments[index] || 'left';
                    const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
                    tableHtml += `<td class="px-4 py-3 text-neutral-700 dark:text-neutral-300 ${alignClass}">${inlineParser(cell)}</td>`;
                });
                tableHtml += '</tr>';
            });
            tableHtml += '</tbody></table></div>';
            html += tableHtml;
            inTable = false;
            tableHeaders = [];
            tableAlignments = [];
            tableRows = [];
        }
    };

    // Inline regex parser for bold, italic, inline code, links, images
    const inlineParser = (text: string): string => {
        let result = text
            // Image rendering: ![alt](url)
            .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="rounded-lg my-6 max-w-full h-auto border border-neutral-200 dark:border-neutral-800 shadow-sm" />')
            // Link rendering: [text](url)
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-[#4AA054] hover:text-[#3d8545] font-medium underline transition-colors">$1</a>')
            // Strong: **text**
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-neutral-950 dark:text-white">$1</strong>')
            // Italic: *text* or _text_
            .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
            .replace(/_(.*?)_/g, '<em class="italic">$1</em>')
            // Inline code: `code`
            .replace(/`(.*?)`/g, '<code class="bg-neutral-100 dark:bg-neutral-800 text-[#4AA054] dark:text-[#64c26e] px-1.5 py-0.5 rounded font-mono text-sm border border-neutral-200/50 dark:border-neutral-700/50">$1</code>');
        return result;
    };

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // 1. Fenced Code Block Boundary
        if (line.trim().startsWith('```')) {
            if (inCodeBlock) {
                // Close block
                const highlighted = highlightCode(codeContent.trim(), codeLang);
                html += `
<div class="relative group my-6 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-950 shadow-md">
    <div class="flex items-center justify-between px-4 py-2 border-b border-neutral-800 bg-neutral-900 text-xs text-neutral-400 font-mono select-none">
        <span>${codeLang || 'code'}</span>
        <button onclick="navigator.clipboard.writeText(this.parentElement.nextElementSibling.innerText).then(() => { this.innerText = 'Copied!'; setTimeout(() => this.innerText = 'Copy', 2000); })" class="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 hover:text-white transition-colors cursor-pointer font-sans">Copy</button>
    </div>
    <pre class="overflow-x-auto p-4 font-mono text-sm leading-relaxed text-neutral-200"><code class="language-${codeLang}">${highlighted}</code></pre>
</div>`;
                inCodeBlock = false;
                codeContent = '';
                codeLang = '';
            } else {
                closeList();
                closeTable();
                inCodeBlock = true;
                codeLang = line.replace('```', '').trim();
            }
            continue;
        }

        // Inside code block
        if (inCodeBlock) {
            codeContent += line + '\n';
            continue;
        }

        const trimmed = line.trim();

        // 2. Callouts check: blockquote style > [!NOTE]
        if (trimmed.startsWith('&gt;') || trimmed.startsWith('>')) {
            closeList();
            closeTable();
            const cleanBlockquote = trimmed.replace(/^(&gt;|>)\s?/, '');
            
            // Check if it has callout header
            const calloutMatch = cleanBlockquote.match(/^\[!(NOTE|WARNING|IMPORTANT|TIP|CAUTION)\]/i);
            if (calloutMatch) {
                const type = calloutMatch[1];
                let calloutContent = cleanBlockquote.replace(/^\[!(NOTE|WARNING|IMPORTANT|TIP|CAUTION)\]\s?/, '');
                
                // Read subsequent lines if they are part of the callout
                while (i + 1 < lines.length && (lines[i+1].trim().startsWith('&gt;') || lines[i+1].trim().startsWith('>'))) {
                    i++;
                    const nextLineClean = lines[i].trim().replace(/^(&gt;|>)\s?/, '');
                    if (nextLineClean.match(/^\[!(NOTE|WARNING|IMPORTANT|TIP|CAUTION)\]/i)) {
                        i--; // backtrack and let next loop handle next callout
                        break;
                    }
                    calloutContent += ' ' + nextLineClean;
                }
                html += parseCallout(type, inlineParser(calloutContent.trim()));
                continue;
            }

            // Normal blockquote
            let blockquoteContent = cleanBlockquote;
            while (i + 1 < lines.length && (lines[i+1].trim().startsWith('&gt;') || lines[i+1].trim().startsWith('>'))) {
                i++;
                blockquoteContent += ' ' + lines[i].trim().replace(/^(&gt;|>)\s?/, '');
            }
            html += `<blockquote class="border-l-4 border-neutral-300 dark:border-neutral-700 pl-4 py-1 italic text-neutral-600 dark:text-neutral-400 my-6 leading-relaxed">${inlineParser(blockquoteContent)}</blockquote>`;
            continue;
        }

        // 3. Tables check: line starts with |
        if (trimmed.startsWith('|')) {
            closeList();
            
            // Split line by '|' (ignoring start and end empty elements)
            const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
            
            // Check if this is separator line (e.g. |---|---| or | :--- | :---: |)
            const isSeparator = cells.every(cell => /^:?-+:?$/.test(cell));
            
            if (isSeparator) {
                // Table header configuration
                tableAlignments = cells.map(cell => {
                    const starts = cell.startsWith(':');
                    const ends = cell.endsWith(':');
                    if (starts && ends) return 'center';
                    if (ends) return 'right';
                    return 'left';
                });
                inTable = true;
            } else {
                if (!inTable && tableHeaders.length === 0) {
                    // This is header line
                    tableHeaders = cells;
                } else {
                    // This is body row
                    tableRows.push(cells);
                }
            }
            continue;
        } else {
            closeTable();
        }

        // Empty line
        if (trimmed === '') {
            closeList();
            continue;
        }

        // 4. Headings: #, ##, ###, ####
        if (trimmed.startsWith('#')) {
            closeList();
            const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
            if (match) {
                const depth = match[1].length;
                const titleText = match[2];
                const headingId = slugify(titleText);
                
                if (depth === 1) {
                    html += `<h1 id="${headingId}" class="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-8 mb-4 border-b border-neutral-200 dark:border-neutral-800 pb-2">${inlineParser(titleText)}</h1>`;
                } else if (depth === 2) {
                    headings.push({ text: titleText, id: headingId, depth: 2 });
                    html += `<h2 id="${headingId}" class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mt-10 mb-4 border-b border-neutral-200/50 dark:border-neutral-800/50 pb-2 group flex items-center gap-2">${inlineParser(titleText)}<a href="#${headingId}" class="text-neutral-300 dark:text-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity font-normal text-lg">#</a></h2>`;
                } else if (depth === 3) {
                    headings.push({ text: titleText, id: headingId, depth: 3 });
                    html += `<h3 id="${headingId}" class="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white mt-8 mb-3 group flex items-center gap-2">${inlineParser(titleText)}<a href="#${headingId}" class="text-neutral-300 dark:text-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity font-normal text-base">#</a></h3>`;
                } else {
                    html += `<h${depth} id="${headingId}" class="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white mt-6 mb-2">${inlineParser(titleText)}</h${depth}>`;
                }
                continue;
            }
        }

        // 5. Lists check: Unordered (- or *), Ordered (1., 2.)
        const ulMatch = trimmed.match(/^[-*]\s+(.*)$/);
        const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (ulMatch || olMatch) {
            const isOl = !!olMatch;
            const content = isOl ? olMatch![2] : ulMatch![1];
            
            if (!inList || (isOl && listType === 'ul') || (!isOl && listType === 'ol')) {
                closeList();
                listType = isOl ? 'ol' : 'ul';
                html += listType === 'ul' 
                    ? '<ul class="list-disc pl-6 my-4 space-y-2 text-neutral-700 dark:text-neutral-300 leading-relaxed">' 
                    : '<ol class="list-decimal pl-6 my-4 space-y-2 text-neutral-700 dark:text-neutral-300 leading-relaxed">';
                inList = true;
            }
            html += `<li class="pl-1">${inlineParser(content)}</li>`;
            continue;
        }

        // Regular paragraph block
        closeList();
        html += `<p class="my-5 leading-8 text-neutral-700 dark:text-neutral-300">${inlineParser(trimmed)}</p>`;
    }

    // Close any unclosed blocks
    closeList();
    closeTable();

    return { html, headings };
}

/**
 * Loads a single document from filesystem and parses it.
 */
export function getDocBySlug(slug: string): DocContent | null {
    try {
        const docSlug = slug === '' ? 'introduction' : slug;
        const filePath = path.join(CONTENT_DIR, `${docSlug}.md`);

        if (!fs.existsSync(filePath)) {
            return null;
        }

        const rawFile = fs.readFileSync(filePath, 'utf-8');
        
        // Frontmatter parsing
        let title = docSlug.replace(/-/g, ' ');
        let description = '';
        let lastUpdated = '';
        let markdownBody = rawFile;

        if (rawFile.startsWith('---')) {
            const parts = rawFile.split('---');
            if (parts.length >= 3) {
                const frontmatterText = parts[1];
                markdownBody = parts.slice(2).join('---');

                // Read line by line
                frontmatterText.split('\n').forEach(line => {
                    const colonIdx = line.indexOf(':');
                    if (colonIdx !== -1) {
                        const key = line.substring(0, colonIdx).trim().toLowerCase();
                        const val = line.substring(colonIdx + 1).trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
                        if (key === 'title') title = val;
                        if (key === 'description') description = val;
                        if (key === 'lastupdated') lastUpdated = val;
                    }
                });
            }
        }

        // Fill in default updated date if missing
        if (!lastUpdated) {
            const stats = fs.statSync(filePath);
            lastUpdated = stats.mtime.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        const readingTime = calculateReadingTime(markdownBody);
        const { html, headings } = renderMarkdownToHtml(markdownBody);

        return {
            slug: docSlug,
            title,
            description,
            lastUpdated,
            readingTime,
            contentHtml: html,
            headings,
            rawMarkdown: markdownBody
        };
    } catch (e) {
        console.error(`Error loading doc slug ${slug}:`, e);
        return null;
    }
}

/**
 * Metadata info representing document properties.
 */
export interface SidebarLink {
    title: string;
    slug: string;
}

/**
 * Returns a list of all documents for navigation sidebar.
 * Sorted logically so introducing and onboarding are first.
 */
export function getAllDocs(): SidebarLink[] {
    if (!fs.existsSync(CONTENT_DIR)) {
        return [];
    }

    const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
    const docs = files.map(file => {
        const slug = file.replace('.md', '');
        const content = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8');
        
        let title = slug.replace(/-/g, ' ');
        if (content.startsWith('---')) {
            const parts = content.split('---');
            if (parts.length >= 3) {
                const fmLines = parts[1].split('\n');
                const titleLine = fmLines.find(l => l.trim().toLowerCase().startsWith('title:'));
                if (titleLine) {
                    title = titleLine.split(':')[1].trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
                }
            }
        }
        return { title, slug };
    });

    // Custom sorting priority mapping
    const orderPriority: Record<string, number> = {
        'introduction': 1,
        'getting-started': 2,
        'architecture': 3,
        'authentication': 4,
        'onboarding': 5,
        'circle-management': 6,
        'database': 7,
        'transactions': 8,
        'payments': 9,
        'api': 10,
        'development-guide': 11,
        'troubleshooting': 12,
        'faq': 13
    };

    return docs.sort((a, b) => {
        const pA = orderPriority[a.slug] || 99;
        const pB = orderPriority[b.slug] || 99;
        return pA - pB;
    });
}

/**
 * Search utility finding text segments across all md files.
 */
export function searchDocs(query: string): SearchResult[] {
    const term = query.toLowerCase().trim();
    if (!term || !fs.existsSync(CONTENT_DIR)) return [];

    const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
    const results: SearchResult[] = [];

    for (const file of files) {
        const slug = file.replace('.md', '');
        const rawContent = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8');
        
        let title = slug.replace(/-/g, ' ');
        let description = '';
        let body = rawContent;

        if (rawContent.startsWith('---')) {
            const parts = rawContent.split('---');
            if (parts.length >= 3) {
                const fmLines = parts[1].split('\n');
                const titleLine = fmLines.find(l => l.trim().toLowerCase().startsWith('title:'));
                const descLine = fmLines.find(l => l.trim().toLowerCase().startsWith('description:'));
                if (titleLine) title = titleLine.split(':')[1].trim().replace(/^"(.*)"$/, '$1');
                if (descLine) description = descLine.split(':')[1].trim().replace(/^"(.*)"$/, '$1');
                body = parts.slice(2).join('---');
            }
        }

        // Remove markup characters to query plain text
        const plainText = body
            .replace(/#+\s+/g, ' ')
            .replace(/```[\s\S]*?```/g, ' ')
            .replace(/`([^`]+)`/g, '$1')
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/\*([^*]+)\*/g, '$1');

        const idx = plainText.toLowerCase().indexOf(term);
        if (idx !== -1 || title.toLowerCase().includes(term) || description.toLowerCase().includes(term)) {
            // Extract snippet
            const snippetStart = Math.max(0, idx - 40);
            const snippetEnd = Math.min(plainText.length, idx + term.length + 60);
            let snippet = plainText.substring(snippetStart, snippetEnd).trim();
            if (snippetStart > 0) snippet = '...' + snippet;
            if (snippetEnd < plainText.length) snippet = snippet + '...';

            results.push({
                slug: slug === 'introduction' ? '' : slug,
                title,
                description,
                snippet: snippet || description || 'Found match in title/description.'
            });
        }
    }

    return results.slice(0, 10); // cap at 10 matches
}
