/**
 * Embed utilities for detecting and transforming URLs from design tools
 */

import type { EmbedType } from '@/types/blocks';

interface EmbedPattern {
    type: EmbedType;
    patterns: RegExp[];
    getEmbedUrl: (url: string) => string;
}

const EMBED_PATTERNS: EmbedPattern[] = [
    {
        type: 'figma',
        patterns: [
            /figma\.com\/file\//,
            /figma\.com\/design\//,
            /figma\.com\/proto\//,
        ],
        getEmbedUrl: (url) =>
            `https://www.figma.com/embed?embed_host=kirukal&url=${encodeURIComponent(url)}`,
    },
    {
        type: 'figjam',
        patterns: [
            /figma\.com\/board\//,
        ],
        getEmbedUrl: (url) =>
            `https://www.figma.com/embed?embed_host=kirukal&url=${encodeURIComponent(url)}`,
    },
    {
        type: 'notion',
        patterns: [
            /notion\.so\/[^/]+\/[a-f0-9-]+/,
            /notion\.site\//,
            /[a-zA-Z0-9-]+\.notion\.site\//,
        ],
        getEmbedUrl: (url) => {
            // For Notion, we need to check if it's a public page
            // Public pages can be embedded directly
            return url.replace('notion.so', 'notion.site');
        },
    },
    {
        type: 'miro',
        patterns: [
            /miro\.com\/app\/board\//,
            /miro\.com\/welcomeonboard\//,
        ],
        getEmbedUrl: (url) => {
            // Extract board ID and create embed URL
            const match = url.match(/board\/([a-zA-Z0-9_=-]+)/);
            if (match) {
                return `https://miro.com/app/live-embed/${match[1]}/?embedMode=view_only_without_ui`;
            }
            return url;
        },
    },
    {
        type: 'youtube',
        patterns: [
            /youtube\.com\/watch\?v=/,
            /youtu\.be\//,
            /youtube\.com\/embed\//,
        ],
        getEmbedUrl: (url) => {
            const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
            if (match) {
                return `https://www.youtube.com/embed/${match[1]}`;
            }
            return url;
        },
    },
    {
        type: 'loom',
        patterns: [
            /loom\.com\/share\//,
            /loom\.com\/embed\//,
        ],
        getEmbedUrl: (url) => {
            const match = url.match(/loom\.com\/(?:share|embed)\/([a-f0-9]+)/);
            if (match) {
                return `https://www.loom.com/embed/${match[1]}`;
            }
            return url;
        },
    },
    {
        type: 'vimeo',
        patterns: [
            /vimeo\.com\/\d+/,
            /player\.vimeo\.com\/video\/\d+/,
        ],
        getEmbedUrl: (url) => {
            const match = url.match(/vimeo\.com\/(\d+)/);
            if (match) {
                return `https://player.vimeo.com/video/${match[1]}`;
            }
            return url;
        },
    },
];

/**
 * Extract URL from iframe embed code
 * Handles cases like: <iframe src="https://..." ...></iframe>
 */
export function extractUrlFromIframe(input: string): string | null {
    // Check if input contains iframe tag
    const iframeMatch = input.match(/<iframe[^>]*\s+src=["']([^"']+)["'][^>]*>/i);
    if (iframeMatch) {
        return iframeMatch[1];
    }
    return null;
}

/**
 * Parse embed input - handles both raw URLs and iframe embed codes
 * Returns the extracted/normalized URL
 */
export function parseEmbedInput(input: string): string {
    if (!input) return '';

    const trimmed = input.trim();

    // Try to extract URL from iframe code first
    const iframeUrl = extractUrlFromIframe(trimmed);
    if (iframeUrl) {
        // For Figma embeds, extract the original URL from the embed URL
        const figmaUrlMatch = iframeUrl.match(/figma\.com\/embed\?[^"]*url=([^&"]+)/);
        if (figmaUrlMatch) {
            return decodeURIComponent(figmaUrlMatch[1]);
        }
        return iframeUrl;
    }

    // If it looks like a URL, return as-is
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }

    // Try adding https:// if it looks like a domain
    if (trimmed.match(/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/)) {
        return `https://${trimmed}`;
    }

    return trimmed;
}

/**
 * Detect the embed type from a URL
 */
export function detectEmbedType(url: string): EmbedType {
    if (!url) return 'generic';

    // First, parse the input to get a clean URL
    const cleanUrl = parseEmbedInput(url);

    for (const pattern of EMBED_PATTERNS) {
        if (pattern.patterns.some(regex => regex.test(cleanUrl))) {
            return pattern.type;
        }
    }

    return 'generic';
}

/**
 * Get the embeddable URL for a given source URL
 */
export function getEmbedUrl(url: string, type?: EmbedType): string {
    if (!url) return '';

    const embedType = type || detectEmbedType(url);
    const pattern = EMBED_PATTERNS.find(p => p.type === embedType);

    if (pattern) {
        return pattern.getEmbedUrl(url);
    }

    // Generic fallback - use URL as-is
    return url;
}

/**
 * Check if a URL is embeddable
 */
export function isEmbeddableUrl(url: string): boolean {
    return detectEmbedType(url) !== 'generic' || isValidUrl(url);
}

/**
 * Simple URL validation
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Get display name for embed type
 */
export function getEmbedTypeName(type: EmbedType): string {
    const names: Record<EmbedType, string> = {
        figma: 'Figma',
        figjam: 'FigJam',
        notion: 'Notion',
        miro: 'Miro',
        youtube: 'YouTube',
        loom: 'Loom',
        vimeo: 'Vimeo',
        generic: 'Website',
    };
    return names[type];
}

/**
 * Get icon/color for embed type (for UI display)
 */
export function getEmbedTypeColor(type: EmbedType): string {
    const colors: Record<EmbedType, string> = {
        figma: '#f24e1e',
        figjam: '#a259ff',
        notion: '#000000',
        miro: '#ffd02f',
        youtube: '#ff0000',
        loom: '#625df5',
        vimeo: '#1ab7ea',
        generic: '#6b7280',
    };
    return colors[type];
}
