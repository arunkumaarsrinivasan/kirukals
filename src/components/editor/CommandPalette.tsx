'use client';

import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '@/store/editor';
import type { Block } from '@/types/blocks';

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

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(!searchOpen);
            }
            if (e.key === 'Escape' && searchOpen) setSearchOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [searchOpen, setSearchOpen]);

    useEffect(() => {
        if (searchOpen && inputRef.current) {
            inputRef.current.focus();
            setSearchQuery('');
            setResults([]);
            setSelectedIndex(0);
        }
    }, [searchOpen, setSearchQuery]);

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
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
        else if (e.key === 'Enter' && results[selectedIndex]) {
            selectBlock(results[selectedIndex].id);
            setSearchOpen(false);
            scrollToBlock(results[selectedIndex]);
        }
    };

    const scrollToBlock = (block: Block) => {
        setTimeout(() => {
            const el = document.querySelector(`[data-block-id="${block.id}"]`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    };

    const getBlockPreview = (block: Block): string => {
        switch (block.type) {
            case 'text': return (block as any).plainText?.slice(0, 50) || 'Empty text';
            case 'section': return (block as any).label || 'Section';
            case 'media': return (block as any).alt || 'Image';
            case 'embed': return (block as any).url?.slice(0, 40) || 'Embed';
            case 'markdown': return (block as any).content?.slice(0, 50) || 'Markdown';
            case 'diagram': return 'Diagram';
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

    return (
        <>
            {/* Backdrop */}
            <div
                style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.7)' }}
                onClick={() => setSearchOpen(false)}
            />

            {/* Palette */}
            <div style={{
                position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
                zIndex: 50, width: '100%', maxWidth: '560px',
                backgroundColor: 'var(--color-surface)',
                border: '2px solid var(--color-border-strong)',
                overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    padding: '6px 16px',
                    borderBottom: '1px solid var(--color-border)',
                    fontSize: '0.55rem',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    color: 'var(--color-muted)',
                    display: 'flex',
                    justifyContent: 'space-between',
                }}>
                    <span>SEARCH BLOCKS</span>
                    <span>{blocks.length} TOTAL</span>
                </div>

                {/* Input */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--color-border)',
                }}>
                    <svg width="16" height="16" style={{ color: 'var(--color-muted)', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="SEARCH BY CONTENT, TAGS OR ALT TEXT..."
                        style={{
                            flex: 1, background: 'transparent', border: 'none', outline: 'none',
                            color: 'var(--color-fg)', fontFamily: 'var(--font-mono)',
                            fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px',
                        }}
                    />
                    <span style={{
                        padding: '3px 8px',
                        border: '1px solid var(--color-border)',
                        fontSize: '0.6rem',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--color-muted)',
                        textTransform: 'uppercase',
                    }}>
                        ESC
                    </span>
                </div>

                {/* Results */}
                {results.length > 0 && (
                    <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                        {results.map((block, index) => (
                            <button
                                key={block.id}
                                onClick={() => { selectBlock(block.id); setSearchOpen(false); scrollToBlock(block); }}
                                style={{
                                    width: '100%', padding: '12px 16px',
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    textAlign: 'left',
                                    border: 'none',
                                    borderBottom: '1px solid var(--color-border)',
                                    borderLeft: index === selectedIndex ? '4px solid var(--color-accent)' : '4px solid transparent',
                                    backgroundColor: index === selectedIndex ? 'var(--color-fg)' : 'transparent',
                                    color: index === selectedIndex ? 'var(--color-bg)' : 'var(--color-fg)',
                                    transition: 'all 0.1s linear',
                                }}
                            >
                                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                    style={{ flexShrink: 0, opacity: 0.7 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={getBlockIcon(block.type)} />
                                </svg>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {getBlockPreview(block)}
                                    </div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', opacity: 0.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '1px' }}>
                                        {block.tags?.join(' · ') || block.type.toUpperCase()}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* No results */}
                {searchQuery && results.length === 0 && (
                    <div style={{
                        padding: '24px 16px', textAlign: 'center',
                        fontFamily: 'var(--font-mono)', fontSize: '0.7rem', textTransform: 'uppercase',
                        color: 'var(--color-subtle)', letterSpacing: '1px',
                    }}>
                        NO MATCH: "{searchQuery}"
                    </div>
                )}

                {/* Hint */}
                {!searchQuery && (
                    <div style={{
                        padding: '12px 16px',
                        fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                        color: 'var(--color-subtle)', textTransform: 'uppercase', letterSpacing: '1px',
                    }}>
                        ↑↓ NAVIGATE · ↵ SELECT · ESC CLOSE
                    </div>
                )}
            </div>
        </>
    );
}
