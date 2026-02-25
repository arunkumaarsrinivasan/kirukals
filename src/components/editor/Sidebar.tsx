'use client';

import { useEditorStore } from '@/store/editor';
import type { Block } from '@/types/blocks';

export function Sidebar() {
    const { blocks, selectedBlockId, selectBlock, deleteBlock, bringToFront, sendToBack, theme } = useEditorStore();

    // Sort blocks by zIndex for display
    const sortedBlocks = [...blocks].sort((a, b) => b.zIndex - a.zIndex);

    const bgColor = theme === 'dark' ? '#0a0a0b' : '#ffffff';
    const borderColor = theme === 'dark' ? '#27272a' : '#e4e4e7';
    const textColor = theme === 'dark' ? '#a1a1aa' : '#52525b';
    const textColorActive = theme === 'dark' ? '#ffffff' : '#18181b';

    const getBlockIcon = (block: Block) => {
        switch (block.type) {
            case 'section':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
                    </svg>
                );
            case 'text':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                );
            case 'embed':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                );
            case 'media':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                );
        }
    };

    return (
        <div
            className="w-56 h-full flex flex-col border-r"
            style={{ backgroundColor: bgColor, borderColor }}
        >
            {/* Header */}
            <div className="px-4 py-3 border-b" style={{ borderColor }}>
                <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: textColor }}>
                    Layers
                </h3>
            </div>

            {/* Layer list */}
            <div className="flex-1 overflow-y-auto py-2">
                {sortedBlocks.length === 0 ? (
                    <p className="px-4 py-8 text-xs text-center" style={{ color: textColor }}>
                        No elements yet
                    </p>
                ) : (
                    sortedBlocks.map((block) => {
                        const isSelected = selectedBlockId === block.id;
                        return (
                            <div
                                key={block.id}
                                className={`group flex items-center gap-2 px-3 py-2 mx-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-violet-500/20' : 'hover:bg-zinc-800/50'}`}
                                onClick={() => selectBlock(block.id)}
                            >
                                <span style={{ color: isSelected ? '#8b5cf6' : textColor }}>
                                    {getBlockIcon(block)}
                                </span>
                                <span
                                    className="flex-1 text-sm truncate"
                                    style={{ color: isSelected ? textColorActive : textColor }}
                                >
                                    {block.title || `${block.type.charAt(0).toUpperCase() + block.type.slice(1)}`}
                                </span>
                                <div className={`flex gap-0.5 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); bringToFront(block.id); }}
                                        className="p-1 rounded hover:bg-zinc-700"
                                        title="Bring to front"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); sendToBack(block.id); }}
                                        className="p-1 rounded hover:bg-zinc-700"
                                        title="Send to back"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
                                        className="p-1 rounded hover:bg-red-500/30 text-zinc-500 hover:text-red-400"
                                        title="Delete"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer with element counts */}
            <div className="px-4 py-2 border-t text-xs" style={{ borderColor, color: textColor }}>
                {blocks.length} element{blocks.length !== 1 ? 's' : ''}
            </div>
        </div>
    );
}
