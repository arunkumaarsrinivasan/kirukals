'use client';

import { useState } from 'react';
import type { SketchTool } from '@/types/sketch';
import type { BlockType } from '@/types/blocks';
import { useEditorStore } from '@/store/editor';

const COLORS = [
    '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#000000'
];

const STROKE_WIDTHS = [2, 4, 8, 16];

// Sub-tools for draw mode (pen, marker, eraser)
const DRAW_SUB_TOOLS: { tool: SketchTool; label: string; icon: string }[] = [
    { tool: 'pen', label: 'Pen', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
    { tool: 'marker', label: 'Marker', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
    { tool: 'eraser', label: 'Eraser', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
];

// All tools in one row - pen is included here
const ALL_TOOLS: { tool: BlockType | 'select' | 'draw'; label: string; icon: string }[] = [
    { tool: 'select', label: 'Select', icon: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122' },
    { tool: 'section', label: 'Section', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z' },
    { tool: 'text', label: 'Text', icon: 'M4 6h16M4 12h16M4 18h7' },
    { tool: 'draw', label: 'Pen', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
    { tool: 'embed', label: 'Embed', icon: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14' },
    { tool: 'media', label: 'Image', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
];

export function Toolbar() {
    const {
        theme,
        toggleTheme,
        activeTool,
        setActiveTool,
        sketchSettings,
        setSketchTool,
        updateSketchSettings,
        setSearchOpen
    } = useEditorStore();

    const [showColorPicker, setShowColorPicker] = useState(false);

    const bgColor = theme === 'dark' ? 'rgba(10, 10, 11, 0.95)' : 'rgba(255, 255, 255, 0.95)';
    const borderColor = theme === 'dark' ? '#27272a' : '#e4e4e7';
    const toolBg = theme === 'dark' ? '#18181b' : '#f4f4f5';

    // Check if draw mode is active
    const isDrawMode = activeTool === 'draw';

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t"
            style={{ backgroundColor: bgColor, borderColor }}
        >
            <div className="w-full px-4 py-3">
                <div className="flex items-center justify-center gap-3 flex-wrap">
                    {/* Main Tools */}
                    <div className="flex gap-0.5 p-1 rounded-xl border" style={{ backgroundColor: toolBg, borderColor }}>
                        {ALL_TOOLS.map(({ tool, label, icon }) => (
                            <button
                                key={tool}
                                onClick={() => {
                                    if (tool === 'draw') {
                                        // Toggle draw mode or switch to it
                                        setActiveTool('draw');
                                    } else {
                                        setActiveTool(tool);
                                    }
                                }}
                                className={`p-2.5 rounded-lg transition-all duration-150 ${activeTool === tool
                                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                                        : 'hover:bg-zinc-700/50'
                                    }`}
                                style={{ color: activeTool === tool ? undefined : theme === 'dark' ? '#a1a1aa' : '#52525b' }}
                                title={label}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
                                </svg>
                            </button>
                        ))}
                    </div>

                    {/* Expandable Draw Tools - only show when draw mode is active */}
                    {isDrawMode && (
                        <>
                            <div className="w-px h-8" style={{ backgroundColor: borderColor }} />

                            {/* Draw Sub-Tools (Pen, Marker, Eraser) */}
                            <div
                                className="flex gap-0.5 p-1 rounded-xl border animate-in slide-in-from-left-2 duration-200"
                                style={{ backgroundColor: toolBg, borderColor }}
                            >
                                {DRAW_SUB_TOOLS.map(({ tool, label, icon }) => (
                                    <button
                                        key={tool}
                                        onClick={() => setSketchTool(tool)}
                                        className={`p-2.5 rounded-lg transition-all duration-150 ${sketchSettings.tool === tool
                                                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                                                : 'hover:bg-zinc-700/50'
                                            }`}
                                        style={{ color: sketchSettings.tool === tool ? undefined : theme === 'dark' ? '#a1a1aa' : '#52525b' }}
                                        title={label}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
                                        </svg>
                                    </button>
                                ))}
                            </div>

                            {/* Color Picker */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowColorPicker(!showColorPicker)}
                                    className="w-10 h-10 rounded-xl border-2 transition-colors shadow-inner"
                                    style={{ backgroundColor: sketchSettings.color, borderColor }}
                                    title="Color"
                                />
                                {showColorPicker && (
                                    <div
                                        className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 flex gap-1 p-2 rounded-xl border shadow-2xl"
                                        style={{ backgroundColor: toolBg, borderColor }}
                                    >
                                        {COLORS.map(color => (
                                            <button
                                                key={color}
                                                onClick={() => { updateSketchSettings({ color }); setShowColorPicker(false); }}
                                                className={`w-7 h-7 rounded-lg transition-transform hover:scale-110 ${sketchSettings.color === color ? 'ring-2 ring-violet-500 ring-offset-2' : ''
                                                    }`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Stroke Width */}
                            <div className="flex gap-0.5 p-1 rounded-xl border" style={{ backgroundColor: toolBg, borderColor }}>
                                {STROKE_WIDTHS.map(w => (
                                    <button
                                        key={w}
                                        onClick={() => updateSketchSettings({ strokeWidth: w })}
                                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${sketchSettings.strokeWidth === w
                                                ? 'bg-violet-600 shadow-lg'
                                                : 'hover:bg-zinc-700/50'
                                            }`}
                                        title={`${w}px`}
                                    >
                                        <div
                                            className="rounded-full"
                                            style={{
                                                width: Math.min(w * 1.5, 14),
                                                height: Math.min(w * 1.5, 14),
                                                backgroundColor: sketchSettings.strokeWidth === w ? '#fff' : (theme === 'dark' ? '#a1a1aa' : '#52525b')
                                            }}
                                        />
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    <div className="w-px h-8" style={{ backgroundColor: borderColor }} />

                    {/* Search Button */}
                    <button
                        onClick={() => setSearchOpen(true)}
                        className="p-2.5 rounded-xl border transition-colors hover:bg-zinc-700/50 flex items-center gap-2"
                        style={{ borderColor, color: theme === 'dark' ? '#a1a1aa' : '#52525b' }}
                        title="Search (⌘K)"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <kbd className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: theme === 'dark' ? '#27272a' : '#e4e4e7' }}>
                            ⌘K
                        </kbd>
                    </button>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 rounded-xl border transition-colors hover:bg-zinc-700/50"
                        style={{ borderColor, color: theme === 'dark' ? '#a1a1aa' : '#52525b' }}
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {theme === 'dark' ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
