/**
 * HTML Exporter - Generates self-contained WYSIWYG HTML from canvas blocks
 * Export maintains exact positions from the editor with responsive scaling
 */

import type { Block, SectionBlock, TextBlock, EmbedBlock, MediaBlock, MarkdownBlock, DiagramBlock, Theme } from '@/types/blocks';
import { getEmbedUrl, getEmbedTypeName } from '@/utils/embedUtils';

// Design width - same as used in editor and preview
const DESIGN_WIDTH = 1440;

/**
 * Parse markdown to inline-styled HTML
 */
function parseMarkdownToHtml(md: string, theme: Theme): string {
    if (!md) return '';
    const codeColor = theme === 'dark' ? '#a78bfa' : '#7c3aed';
    const codeBg = theme === 'dark' ? '#27272a' : '#f4f4f5';

    return md
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/^### (.+)$/gm, '<h3 style="font-size: 1.125rem; font-weight: 600; margin: 0.5rem 0;">$1</h3>')
        .replace(/^## (.+)$/gm, '<h2 style="font-size: 1.25rem; font-weight: 600; margin: 0.5rem 0;">$1</h2>')
        .replace(/^# (.+)$/gm, '<h1 style="font-size: 1.5rem; font-weight: 700; margin: 0.5rem 0;">$1</h1>')
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, `<code style="padding: 0.125rem 0.375rem; background: ${codeBg}; color: ${codeColor}; border-radius: 0.25rem; font-family: monospace;">$1</code>`)
        .replace(/^> (.+)$/gm, '<blockquote style="border-left: 3px solid #8b5cf6; padding-left: 1rem; margin: 0.5rem 0; opacity: 0.8;">$1</blockquote>')
        .replace(/^[\*\-] (.+)$/gm, '<li style="margin-left: 1rem; list-style: disc;">$1</li>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #a78bfa; text-decoration: underline;" target="_blank">$1</a>')
        .replace(/\n\n/g, '</p><p style="margin: 0.5rem 0;">')
        .replace(/\n/g, '<br/>');
}

/**
 * Generate block HTML with absolute positioning
 */
function generateBlockHtml(block: Block, theme: Theme): string {
    const bgColor = theme === 'dark' ? '#18181b' : '#ffffff';
    const textColor = theme === 'dark' ? '#e4e4e7' : '#18181b';

    const positionStyle = `
        position: absolute;
        left: ${block.x}px;
        top: ${block.y}px;
        width: ${block.width}px;
        height: ${block.height}px;
        border-radius: 0.5rem;
        overflow: hidden;
    `;

    switch (block.type) {
        case 'text':
            const textBlock = block as TextBlock;
            const displayText = textBlock.plainText ||
                (typeof textBlock.content === 'string' ? textBlock.content : '');
            return `
                <div style="${positionStyle} background-color: ${bgColor};">
                    <div style="
                        padding: 1rem;
                        height: 100%;
                        font-size: ${textBlock.fontSize || 16}px;
                        font-family: ${textBlock.fontFamily || 'system-ui, sans-serif'};
                        text-align: ${textBlock.textAlign || 'left'};
                        font-weight: ${textBlock.fontWeight || 'normal'};
                        color: ${textBlock.color || textColor};
                        white-space: pre-wrap;
                        line-height: 1.6;
                    ">
                        ${displayText.replace(/\n/g, '<br/>')}
                    </div>
                </div>
            `;

        case 'embed':
            const embedBlock = block as EmbedBlock;
            const embedUrl = getEmbedUrl(embedBlock.url, embedBlock.embedType);
            return `
                <div style="${positionStyle} background-color: ${bgColor};">
                    <iframe 
                        src="${embedUrl}" 
                        style="width: 100%; height: 100%; border: none; display: block;"
                        allowfullscreen
                        loading="lazy"
                    ></iframe>
                </div>
            `;

        case 'media':
            const mediaBlock = block as MediaBlock;
            if (!mediaBlock.src) return '';
            return `
                <div style="${positionStyle}">
                    <img 
                        src="${mediaBlock.src}" 
                        alt="${mediaBlock.alt || 'Image'}"
                        style="width: 100%; height: 100%; object-fit: ${mediaBlock.objectFit || 'cover'}; display: block;"
                        loading="lazy"
                    />
                </div>
            `;

        case 'markdown':
            const mdBlock = block as MarkdownBlock;
            return `
                <div style="${positionStyle} background-color: ${bgColor}; padding: 1rem; color: ${textColor};">
                    ${parseMarkdownToHtml(mdBlock.content, theme)}
                </div>
            `;

        case 'diagram':
            const diagramBlock = block as DiagramBlock;
            return `
                <div style="${positionStyle} background-color: ${bgColor};">
                    <div class="mermaid" style="padding: 1rem; height: 100%; display: flex; align-items: center; justify-content: center;">
${diagramBlock.source}
                    </div>
                </div>
            `;

        default:
            return '';
    }
}

/**
 * Generate section HTML
 */
function generateSectionHtml(section: SectionBlock, theme: Theme): string {
    const bgColor = section.backgroundColor || (theme === 'dark' ? '#0a0a0b' : '#ffffff');
    const labelColor = theme === 'dark' ? '#a78bfa' : '#7c3aed';
    const labelBg = theme === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(124, 58, 237, 0.1)';

    return `
        <div style="
            position: absolute;
            left: 0;
            top: ${section.y}px;
            width: 100%;
            height: ${section.height}px;
            background-color: ${bgColor};
        ">
            ${section.label ? `
                <div style="
                    position: absolute;
                    top: 0.5rem;
                    left: 1rem;
                    padding: 0.25rem 0.5rem;
                    border-radius: 0.25rem;
                    font-size: 0.75rem;
                    font-weight: 500;
                    background-color: ${labelBg};
                    color: ${labelColor};
                ">${section.label}</div>
            ` : ''}
        </div>
    `;
}

export interface ExportOptions {
    title?: string;
    theme?: Theme;
    includeMermaid?: boolean;
}

/**
 * Generate complete WYSIWYG HTML document from blocks
 */
export function exportToHtml(blocks: Block[], options: ExportOptions = {}): string {
    const {
        title = 'Kirukal Export',
        theme = 'dark',
        includeMermaid = true
    } = options;

    const bgColor = theme === 'dark' ? '#0a0a0b' : '#ffffff';
    const textColor = theme === 'dark' ? '#e4e4e7' : '#18181b';

    // Separate sections and other blocks
    const sections = blocks.filter(b => b.type === 'section').sort((a, b) => a.y - b.y) as SectionBlock[];
    const otherBlocks = blocks.filter(b => b.type !== 'section');

    // Calculate canvas height
    const canvasHeight = sections.length > 0
        ? Math.max(...sections.map(s => s.y + s.height))
        : Math.max(...blocks.map(b => b.y + b.height), 800);

    const sectionsHtml = sections.map(s => generateSectionHtml(s, theme)).join('\n');
    const blocksHtml = otherBlocks.map(b => generateBlockHtml(b, theme)).join('\n');

    const mermaidScript = includeMermaid ? `
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
    <script>
        mermaid.initialize({ 
            startOnLoad: true, 
            theme: '${theme === 'dark' ? 'dark' : 'default'}',
            securityLevel: 'loose'
        });
    </script>
    ` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        html, body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: ${bgColor};
            color: ${textColor};
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
            overflow-x: hidden;
        }
        /* Responsive Canvas Container */
        .kirukal-canvas {
            width: ${DESIGN_WIDTH}px;
            min-height: ${canvasHeight}px;
            position: relative;
            margin: 0 auto;
            transform-origin: top center;
        }
        /* Responsive scaling */
        @media (max-width: ${DESIGN_WIDTH}px) {
            .kirukal-canvas {
                transform: scale(calc(100vw / ${DESIGN_WIDTH}));
                margin-bottom: calc(${canvasHeight}px * (100vw / ${DESIGN_WIDTH} - 1));
            }
        }
        /* Ensure images don't break layout */
        img {
            max-width: 100%;
        }
        /* Print styles */
        @media print {
            .kirukal-canvas {
                transform: none !important;
                width: 100% !important;
            }
        }
    </style>
    ${mermaidScript}
</head>
<body>
    <div class="kirukal-canvas">
        <!-- Sections (backgrounds) -->
        ${sectionsHtml}
        
        <!-- Content blocks -->
        ${blocksHtml}
    </div>
</body>
</html>`;
}

/**
 * Download HTML as file
 */
export function downloadHtml(blocks: Block[], options: ExportOptions = {}): void {
    const html = exportToHtml(blocks, options);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${options.title || 'kirukal-export'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Copy HTML to clipboard
 */
export async function copyHtmlToClipboard(blocks: Block[], options: ExportOptions = {}): Promise<boolean> {
    try {
        const html = exportToHtml(blocks, options);
        await navigator.clipboard.writeText(html);
        return true;
    } catch (err) {
        console.error('Failed to copy:', err);
        return false;
    }
}
