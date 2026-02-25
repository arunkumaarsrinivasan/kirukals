'use client';

import { useState, useEffect } from 'react';
import { useEditorStore } from '@/store/editor';
import type { Block, TextBlock, MediaBlock, EmbedBlock, SectionBlock } from '@/types/blocks';

// Collapsible panel that shows context-sensitive options
export function ToolOptionsPanel() {
    const {
        theme,
        selectedBlockId,
        blocks,
        activeTool,
        updateBlock,
        deleteBlock,
        duplicateBlock,
        bringToFront,
        sendToBack,
        sketchSettings,
        updateSketchSettings,
    } = useEditorStore();

    const [isExpanded, setIsExpanded] = useState(false);

    const selectedBlock = blocks.find(b => b.id === selectedBlockId);

    // Auto-expand when a block is selected or draw tool is active
    useEffect(() => {
        setIsExpanded(!!selectedBlock || activeTool === 'draw');
    }, [selectedBlock, activeTool]);

    const bgColor = theme === 'dark' ? 'rgba(24, 24, 27, 0.98)' : 'rgba(255, 255, 255, 0.98)';
    const borderColor = theme === 'dark' ? '#27272a' : '#e4e4e7';
    const textColor = theme === 'dark' ? '#e4e4e7' : '#18181b';
    const mutedColor = theme === 'dark' ? '#71717a' : '#a1a1aa';

    // Option button component
    const OptionButton = ({
        onClick,
        children,
        danger = false,
        title
    }: {
        onClick: () => void;
        children: React.ReactNode;
        danger?: boolean;
        title: string;
    }) => (
        <button
            onClick={onClick}
            className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs ${danger
                    ? 'hover:bg-red-500/20 text-red-500'
                    : 'hover:bg-violet-500/20'
                }`}
            style={{ color: danger ? undefined : textColor }}
            title={title}
        >
            {children}
        </button>
    );

    // Color picker for sections
    const SECTION_COLORS = [
        { value: undefined, label: 'Default' },
        { value: '#18181b', label: 'Dark' },
        { value: '#27272a', label: 'Gray' },
        { value: '#1e1b4b', label: 'Indigo' },
        { value: '#14532d', label: 'Green' },
        { value: '#7f1d1d', label: 'Red' },
        { value: '#78350f', label: 'Amber' },
        { value: '#ffffff', label: 'White' },
        { value: '#f4f4f5', label: 'Light' },
    ];

    if (!isExpanded) return null;

    return (
        <div
            className="fixed bottom-[72px] left-1/2 -translate-x-1/2 z-40 backdrop-blur-xl border rounded-xl shadow-2xl overflow-hidden transition-all"
            style={{ backgroundColor: bgColor, borderColor }}
        >
            <div className="px-4 py-2 flex items-center gap-4">
                {/* Select Tool Options */}
                {activeTool === 'select' && selectedBlock && (
                    <>
                        <div className="flex items-center gap-1 text-xs" style={{ color: mutedColor }}>
                            <span className="capitalize">{selectedBlock.type}</span>
                        </div>

                        <div className="w-px h-6" style={{ backgroundColor: borderColor }} />

                        <OptionButton onClick={() => duplicateBlock(selectedBlock.id)} title="Duplicate">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>Duplicate</span>
                        </OptionButton>

                        <OptionButton onClick={() => bringToFront(selectedBlock.id)} title="Bring to Front">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 15l7-7 7 7" />
                            </svg>
                            <span>Front</span>
                        </OptionButton>

                        <OptionButton onClick={() => sendToBack(selectedBlock.id)} title="Send to Back">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                            </svg>
                            <span>Back</span>
                        </OptionButton>

                        <div className="w-px h-6" style={{ backgroundColor: borderColor }} />

                        <OptionButton onClick={() => deleteBlock(selectedBlock.id)} danger title="Delete">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete</span>
                        </OptionButton>
                    </>
                )}

                {/* Section-specific options */}
                {selectedBlock?.type === 'section' && (
                    <>
                        <div className="w-px h-6" style={{ backgroundColor: borderColor }} />

                        <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: mutedColor }}>Background:</span>
                            <div className="flex gap-1">
                                {SECTION_COLORS.map(({ value, label }) => (
                                    <button
                                        key={label}
                                        onClick={() => updateBlock<SectionBlock>(selectedBlock.id, { backgroundColor: value })}
                                        className={`w-5 h-5 rounded transition-transform hover:scale-110 border ${(selectedBlock as SectionBlock).backgroundColor === value
                                                ? 'ring-2 ring-violet-500 ring-offset-1'
                                                : ''
                                            }`}
                                        style={{
                                            backgroundColor: value || (theme === 'dark' ? '#0a0a0b' : '#f4f4f5'),
                                            borderColor
                                        }}
                                        title={label}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: mutedColor }}>Label:</span>
                            <input
                                type="text"
                                value={(selectedBlock as SectionBlock).label || ''}
                                onChange={(e) => updateBlock<SectionBlock>(selectedBlock.id, { label: e.target.value })}
                                placeholder="Section label..."
                                className="text-xs px-2 py-1 rounded border bg-transparent w-32"
                                style={{ borderColor, color: textColor }}
                            />
                        </div>
                    </>
                )}

                {/* Text-specific options */}
                {selectedBlock?.type === 'text' && (
                    <>
                        <div className="w-px h-6" style={{ backgroundColor: borderColor }} />

                        <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: mutedColor }}>Align:</span>
                            {(['left', 'center', 'right'] as const).map((align) => (
                                <button
                                    key={align}
                                    onClick={() => updateBlock<TextBlock>(selectedBlock.id, { textAlign: align })}
                                    className={`p-1.5 rounded transition-colors ${(selectedBlock as TextBlock).textAlign === align
                                            ? 'bg-violet-600 text-white'
                                            : 'hover:bg-zinc-700/50'
                                        }`}
                                    style={{ color: (selectedBlock as TextBlock).textAlign === align ? undefined : mutedColor }}
                                    title={`Align ${align}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {align === 'left' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />}
                                        {align === 'center' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" />}
                                        {align === 'right' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" />}
                                    </svg>
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {/* Media-specific options */}
                {selectedBlock?.type === 'media' && (
                    <>
                        <div className="w-px h-6" style={{ backgroundColor: borderColor }} />

                        <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: mutedColor }}>Fit:</span>
                            {(['cover', 'contain', 'fill'] as const).map((fit) => (
                                <button
                                    key={fit}
                                    onClick={() => updateBlock<MediaBlock>(selectedBlock.id, { objectFit: fit })}
                                    className={`px-2 py-1 text-xs rounded transition-colors ${(selectedBlock as MediaBlock).objectFit === fit
                                            ? 'bg-violet-600 text-white'
                                            : 'hover:bg-zinc-700/50'
                                        }`}
                                    style={{ color: (selectedBlock as MediaBlock).objectFit === fit ? undefined : mutedColor }}
                                >
                                    {fit}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: mutedColor }}>Alt:</span>
                            <input
                                type="text"
                                value={(selectedBlock as MediaBlock).alt || ''}
                                onChange={(e) => updateBlock<MediaBlock>(selectedBlock.id, { alt: e.target.value })}
                                placeholder="Alt text for search..."
                                className="text-xs px-2 py-1 rounded border bg-transparent w-40"
                                style={{ borderColor, color: textColor }}
                            />
                        </div>
                    </>
                )}

                {/* Draw tool options */}
                {activeTool === 'draw' && !selectedBlock && (
                    <>
                        <span className="text-xs" style={{ color: mutedColor }}>
                            Draw: {sketchSettings.tool}
                        </span>

                        <div className="w-px h-6" style={{ backgroundColor: borderColor }} />

                        <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: mutedColor }}>Size:</span>
                            <input
                                type="range"
                                min="1"
                                max="32"
                                value={sketchSettings.strokeWidth}
                                onChange={(e) => updateSketchSettings({ strokeWidth: Number(e.target.value) })}
                                className="w-20 accent-violet-500"
                            />
                            <span className="text-xs w-6" style={{ color: textColor }}>{sketchSettings.strokeWidth}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: mutedColor }}>Smoothing:</span>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={sketchSettings.smoothing}
                                onChange={(e) => updateSketchSettings({ smoothing: Number(e.target.value) })}
                                className="w-16 accent-violet-500"
                            />
                        </div>
                    </>
                )}

                {/* Collapse button */}
                <button
                    onClick={() => setIsExpanded(false)}
                    className="p-1.5 rounded-lg hover:bg-zinc-700/50 ml-2"
                    style={{ color: mutedColor }}
                    title="Collapse"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
