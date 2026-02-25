'use client';

import { useState, useMemo } from 'react';
import type { MarkdownBlock } from '@/types/blocks';
import { useEditorStore } from '@/store/editor';

interface Props {
    block: MarkdownBlock;
}

/**
 * Simple markdown to HTML converter
 * Handles: headers, bold, italic, code, lists, links, blockquotes
 */
function parseMarkdown(md: string): string {
    if (!md) return '';

    let html = md
        // Escape HTML
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Headers
        .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
        .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
        .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-3">$1</h1>')
        // Bold & Italic
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/___(.+?)___/g, '<strong><em>$1</em></strong>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
        .replace(/_(.+?)_/g, '<em>$1</em>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-zinc-800 text-violet-400 text-sm font-mono">$1</code>')
        // Code blocks
        .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="p-4 rounded-lg bg-zinc-900 overflow-x-auto my-3"><code class="text-sm font-mono text-zinc-300">$2</code></pre>')
        // Blockquotes
        .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-violet-500 pl-4 italic text-zinc-400 my-2">$1</blockquote>')
        // Unordered lists
        .replace(/^[\*\-] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
        // Ordered lists
        .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-violet-400 hover:underline" target="_blank" rel="noopener">$1</a>')
        // Line breaks (double newline = paragraph)
        .replace(/\n\n/g, '</p><p class="my-2">')
        // Single line breaks
        .replace(/\n/g, '<br/>');

    // Wrap in paragraph if not already wrapped
    if (!html.startsWith('<')) {
        html = `<p class="my-2">${html}</p>`;
    }

    return html;
}

export function MarkdownElement({ block }: Props) {
    const { updateBlock, theme } = useEditorStore();
    const [isEditing, setIsEditing] = useState(!block.content);
    const [content, setContent] = useState(block.content || '');

    const handleSave = () => {
        updateBlock(block.id, { content });
        setIsEditing(false);
    };

    const renderedHtml = useMemo(() => parseMarkdown(block.content), [block.content]);

    const bgColor = theme === 'dark' ? '#18181b' : '#ffffff';
    const textColor = theme === 'dark' ? '#e4e4e7' : '#27272a';
    const borderColor = theme === 'dark' ? '#27272a' : '#e4e4e7';

    return (
        <div
            className="w-full h-full overflow-auto"
            style={{ backgroundColor: bgColor, color: textColor }}
            onDoubleClick={() => setIsEditing(true)}
        >
            {isEditing ? (
                <div className="w-full h-full flex flex-col p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-zinc-500">Markdown Editor</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-3 py-1 text-xs text-zinc-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-3 py-1 text-xs bg-violet-600 text-white rounded hover:bg-violet-500 transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Paste markdown content from ChatGPT, Perplexity, or write your own..."
                        className="flex-1 w-full p-3 rounded-lg border bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono text-sm"
                        style={{ borderColor, color: textColor }}
                        autoFocus
                    />
                    <div className="mt-2 text-xs text-zinc-500">
                        Supports: **bold**, *italic*, `code`, # headers, - lists, [links](url)
                    </div>
                </div>
            ) : (
                <div className="w-full h-full p-4 overflow-auto">
                    {/* Markdown badge */}
                    <div
                        className="absolute top-2 left-2 z-10 text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1.5"
                        style={{
                            backgroundColor: 'rgba(139, 92, 246, 0.2)',
                            color: '#8b5cf6',
                            border: '1px solid rgba(139, 92, 246, 0.3)'
                        }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                        Markdown
                    </div>

                    {block.content ? (
                        <div
                            className="prose prose-invert max-w-none pt-6"
                            dangerouslySetInnerHTML={{ __html: renderedHtml }}
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                            <div className="w-12 h-12 mb-4 rounded-xl bg-violet-500/20 flex items-center justify-center">
                                <svg className="w-6 h-6 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="text-sm">Double-click to add markdown content</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
