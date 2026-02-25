'use client';

import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '@/store/editor';
import type { Block } from '@/types/blocks';

// Command Palette (Cmd+K / Ctrl+K)
export function CommandPalette() {
    const {
        theme,
        searchOpen,
        setSearchOpen,
        searchQuery,
        setSearchQuery,
        searchBlocks,
        selectBlock,
        blocks
    } = useEditorStore();

    const inputRef = useRef<HTMLInputElement>(null);
    const [results, setResults] = useState<Block[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Open on Cmd+K / Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(!searchOpen);
            }
            if (e.key === 'Escape' && searchOpen) {
                setSearchOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [searchOpen, setSearchOpen]);

    // Focus input when opened
    useEffect(() => {
        if (searchOpen && inputRef.current) {
            inputRef.current.focus();
            setSearchQuery('');
            setResults([]);
            setSelectedIndex(0);
        }
    }, [searchOpen, setSearchQuery]);

    // Search when query changes
    useEffect(() => {
        if (searchQuery.trim()) {
            const matches = searchBlocks();
            setResults(matches);
            setSelectedIndex(0);
        } else {
            setResults([]);
        }
    }, [searchQuery, searchBlocks]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(i => Math.min(i + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            selectBlock(results[selectedIndex].id);
            setSearchOpen(false);
            // Scroll to block
            scrollToBlock(results[selectedIndex]);
        }
    };

    const scrollToBlock = (block: Block) => {
        // Attempt to scroll the block into view
        setTimeout(() => {
            const element = document.querySelector(`[data-block-id="${block.id}"]`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };

    const getBlockPreview = (block: Block): string => {
        switch (block.type) {
            case 'text':
                return (block as { plainText?: string }).plainText?.slice(0, 50) || 'Empty text';
            case 'section':
                return (block as { label?: string }).label || 'Section';
            case 'media':
                return (block as { alt?: string }).alt || 'Image';
            case 'embed':
                return (block as { url: string }).url?.slice(0, 40) || 'Embed';
            case 'markdown':
                return (block as { content: string }).content?.slice(0, 50) || 'Markdown';
            case 'diagram':
                return 'Diagram';
        }
    };

    const getBlockIcon = (type: string) => {
        const icons: Record<string, string> = {
            section: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z',
            text: 'M4 6h16M4 12h16M4 18h7',
            media: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
            embed: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
            markdown: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
            diagram: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7',
        };
        return icons[type] || icons.text;
    };

    if (!searchOpen) return null;

    const bgColor = theme === 'dark' ? 'rgba(24, 24, 27, 0.98)' : 'rgba(255, 255, 255, 0.98)';
    const borderColor = theme === 'dark' ? '#3f3f46' : '#e4e4e7';
    const textColor = theme === 'dark' ? '#e4e4e7' : '#18181b';
    const mutedColor = theme === 'dark' ? '#71717a' : '#a1a1aa';

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                onClick={() => setSearchOpen(false)}
            />

            {/* Command Palette */}
            <div
                className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-lg rounded-xl border shadow-2xl overflow-hidden"
                style={{ backgroundColor: bgColor, borderColor }}
            >
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor }}>
                    <svg className="w-5 h-5" style={{ color: mutedColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search blocks by content, tags, or alt text..."
                        className="flex-1 bg-transparent border-none outline-none text-sm"
                        style={{ color: textColor }}
                    />
                    <kbd
                        className="px-2 py-1 text-xs rounded"
                        style={{ backgroundColor: theme === 'dark' ? '#27272a' : '#f4f4f5', color: mutedColor }}
                    >
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                {results.length > 0 && (
                    <div className="max-h-80 overflow-auto py-2">
                        {results.map((block, index) => (
                            <button
                                key={block.id}
                                onClick={() => {
                                    selectBlock(block.id);
                                    setSearchOpen(false);
                                    scrollToBlock(block);
                                }}
                                className={`w-full px-4 py-2 flex items-center gap-3 text-left transition-colors ${index === selectedIndex
                                    ? 'bg-violet-600 text-white'
                                    : 'hover:bg-zinc-700/30'
                                    }`}
                                style={{ color: index === selectedIndex ? undefined : textColor }}
                            >
                                <svg
                                    className="w-4 h-4 shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    style={{ color: index === selectedIndex ? 'white' : mutedColor }}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={getBlockIcon(block.type)} />
                                </svg>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm truncate">{getBlockPreview(block)}</div>
                                    <div className="text-xs truncate" style={{ color: index === selectedIndex ? 'rgba(255,255,255,0.7)' : mutedColor }}>
                                        {block.tags?.join(', ') || block.type}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {searchQuery && results.length === 0 && (
                    <div className="px-4 py-6 text-center text-sm" style={{ color: mutedColor }}>
                        No blocks found matching "{searchQuery}"
                    </div>
                )}

                {/* Quick actions when no query */}
                {!searchQuery && (
                    <div className="px-4 py-3">
                        <div className="text-xs mb-2" style={{ color: mutedColor }}>
                            {blocks.length} blocks total • Search by content, tags, or alt text
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
