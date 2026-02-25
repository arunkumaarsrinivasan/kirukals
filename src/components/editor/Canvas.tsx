'use client';

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useEditorStore } from '@/store/editor';
import { VerticalSection } from './VerticalSection';
import { DraggableBlock } from './DraggableBlock';
import { SectionElement } from '../sections/SectionBlock';
import { RichTextEditor } from '../elements/RichTextEditor';
import { EmbedElement } from '../elements/EmbedElement';
import { MediaElement } from '../elements/MediaElement';
import { MarkdownElement } from '../elements/MarkdownElement';
import { DiagramElement } from '../elements/DiagramElement';
import type { SectionBlock, TextBlock, EmbedBlock, MediaBlock, MarkdownBlock, DiagramBlock } from '@/types/blocks';

export function InfiniteCanvas() {
    const { blocks, addBlock, selectBlock, selectedBlockId, theme, activeTool, sketchSettings } = useEditorStore();
    const canvasRef = useRef<HTMLDivElement>(null);

    const bgColor = theme === 'dark' ? '#0a0a0b' : '#f4f4f5';

    // Separate sections from other elements
    const sections = useMemo(() =>
        blocks.filter(b => b.type === 'section').sort((a, b) => a.y - b.y),
        [blocks]
    );
    const otherBlocks = useMemo(() =>
        blocks.filter(b => b.type !== 'section'),
        [blocks]
    );

    // Handle canvas click to add new section at the bottom
    const handleCanvasClick = useCallback((e: React.MouseEvent) => {
        if (e.target !== canvasRef.current) return;

        if (activeTool === 'select' || activeTool === 'draw') {
            selectBlock(null);
        } else if (activeTool === 'section') {
            // Add section at the bottom of existing sections
            const lastSectionY = sections.length > 0
                ? Math.max(...sections.map(s => s.y + s.height))
                : 0;
            addBlock('section', { x: 0, y: lastSectionY });
        } else {
            // For other elements, use click position
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top + (canvasRef.current?.scrollTop || 0);
            addBlock(activeTool, { x: x - 150, y: y - 50 });
        }
    }, [activeTool, addBlock, selectBlock, sections]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            // Don't handle if user is typing in an input/editor
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.closest('.ProseMirror')) return;

            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedBlockId) {
                    useEditorStore.getState().deleteBlock(selectedBlockId);
                }
            }
            if (e.key === 'Escape') {
                selectBlock(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedBlockId, selectBlock]);

    return (
        <div
            ref={canvasRef}
            className="relative w-full h-full overflow-auto"
            style={{ backgroundColor: bgColor }}
            onClick={handleCanvasClick}
        >
            {blocks.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 
                            flex items-center justify-center shadow-2xl shadow-violet-500/20">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2" style={{ color: theme === 'dark' ? '#fff' : '#18181b' }}>
                        Start Your Canvas
                    </h2>
                    <p className="text-center max-w-md mb-6" style={{ color: theme === 'dark' ? '#71717a' : '#52525b' }}>
                        Click anywhere to add a section. Sections stack vertically.
                        <br />Drag the bottom edge to resize height.
                    </p>
                    <div className="flex gap-2 text-xs" style={{ color: theme === 'dark' ? '#52525b' : '#a1a1aa' }}>
                        <kbd className="px-2 py-1 rounded" style={{ backgroundColor: theme === 'dark' ? '#27272a' : '#e4e4e7' }}>Section</kbd>
                        <kbd className="px-2 py-1 rounded" style={{ backgroundColor: theme === 'dark' ? '#27272a' : '#e4e4e7' }}>Text</kbd>
                        <kbd className="px-2 py-1 rounded" style={{ backgroundColor: theme === 'dark' ? '#27272a' : '#e4e4e7' }}>Embed</kbd>
                        <kbd className="px-2 py-1 rounded" style={{ backgroundColor: theme === 'dark' ? '#27272a' : '#e4e4e7' }}>Media</kbd>
                    </div>
                </div>
            )}

            {/* Vertical sections stack */}
            <div className="flex flex-col w-full">
                {sections.map((block) => (
                    <VerticalSection key={block.id} block={block as SectionBlock} />
                ))}
            </div>

            {/* Other draggable elements (text, embed, media) - positioned absolutely */}
            {otherBlocks.map((block) => (
                <DraggableBlock key={block.id} block={block} data-block-id={block.id}>
                    {block.type === 'text' && (
                        <RichTextEditor block={block as TextBlock} />
                    )}
                    {block.type === 'embed' && (
                        <EmbedElement block={block as EmbedBlock} />
                    )}
                    {block.type === 'media' && (
                        <MediaElement block={block as MediaBlock} />
                    )}
                    {block.type === 'markdown' && (
                        <MarkdownElement block={block as MarkdownBlock} />
                    )}
                    {block.type === 'diagram' && (
                        <DiagramElement block={block as DiagramBlock} />
                    )}
                </DraggableBlock>
            ))}

            {/* Add section button at the bottom */}
            {sections.length > 0 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        const lastSectionY = Math.max(...sections.map(s => s.y + s.height));
                        addBlock('section', { x: 0, y: lastSectionY });
                    }}
                    className="w-full py-8 border-2 border-dashed rounded-lg transition-all hover:border-violet-500/50 hover:bg-violet-500/5 group"
                    style={{
                        borderColor: theme === 'dark' ? '#27272a' : '#e4e4e7',
                    }}
                >
                    <div className="flex items-center justify-center gap-2" style={{ color: theme === 'dark' ? '#52525b' : '#a1a1aa' }}>
                        <svg className="w-5 h-5 group-hover:text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-sm group-hover:text-violet-500">Add Section</span>
                    </div>
                </button>
            )}
        </div>
    );
}
