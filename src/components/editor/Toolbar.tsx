'use client';

import { useState } from 'react';
import type { SketchTool } from '@/types/sketch';
import type { BlockType } from '@/types/blocks';
import { useEditorStore } from '@/store/editor';

const COLORS = [
    '#e0e0e0', '#ff003c', '#ff6b00', '#f5c400', '#00c853',
    '#00bcd4', '#2979ff', '#7c4dff', '#ff4081', '#080808'
];

const STROKE_WIDTHS = [2, 4, 8, 16];

const DRAW_SUB_TOOLS: { tool: SketchTool; label: string; icon: string }[] = [
    { tool: 'pen', label: 'PEN', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
    { tool: 'marker', label: 'MARK', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
    { tool: 'eraser', label: 'ERASE', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
];

const ALL_TOOLS: { tool: BlockType | 'select' | 'draw'; label: string; icon: string }[] = [
    { tool: 'select', label: 'SELECT', icon: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122' },
    { tool: 'section', label: 'SECTION', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z' },
    { tool: 'text', label: 'TEXT', icon: 'M4 6h16M4 12h16M4 18h7' },
    { tool: 'draw', label: 'DRAW', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
    { tool: 'embed', label: 'EMBED', icon: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14' },
    { tool: 'media', label: 'IMAGE', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
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
    const isDrawMode = activeTool === 'draw';

    const toolBtn = (isActive: boolean): React.CSSProperties => ({
        padding: '10px 12px',
        border: 'none',
        borderBottom: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
        backgroundColor: isActive ? 'var(--color-fg)' : 'transparent',
        color: isActive ? 'var(--color-bg)' : 'var(--color-muted)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.55rem',
        textTransform: 'uppercase' as const,
        letterSpacing: '1px',
        fontWeight: isActive ? 700 : 400,
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '4px',
        transition: 'all 0.1s linear',
    });

    return (
        <div
            style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
                backgroundColor: 'var(--color-bg)',
                borderTop: '2px solid var(--color-border-strong)',
            }}
        >
            <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
                {/* Main Tools */}
                <div style={{ display: 'flex', borderRight: '1px solid var(--color-border)' }}>
                    {ALL_TOOLS.map(({ tool, label, icon }) => (
                        <button
                            key={tool}
                            onClick={() => setActiveTool(tool)}
                            style={toolBtn(activeTool === tool)}
                            onMouseEnter={(e) => {
                                if (activeTool !== tool) {
                                    (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-surface)';
                                    (e.currentTarget as HTMLElement).style.color = 'var(--color-fg)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeTool !== tool) {
                                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                                    (e.currentTarget as HTMLElement).style.color = 'var(--color-muted)';
                                }
                            }}
                            title={label}
                        >
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
                            </svg>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Draw sub-tools */}
                {isDrawMode && (
                    <>
                        <div style={{ display: 'flex', borderRight: '1px solid var(--color-border)' }}>
                            {DRAW_SUB_TOOLS.map(({ tool, label, icon }) => (
                                <button
                                    key={tool}
                                    onClick={() => setSketchTool(tool)}
                                    style={toolBtn(sketchSettings.tool === tool)}
                                    title={label}
                                >
                                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
                                    </svg>
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Color picker */}
                        <div style={{ position: 'relative', borderRight: '1px solid var(--color-border)' }}>
                            <button
                                onClick={() => setShowColorPicker(!showColorPicker)}
                                title="Color"
                                style={{
                                    width: '48px', height: '48px',
                                    border: 'none',
                                    borderBottom: '4px solid var(--color-accent)',
                                    backgroundColor: sketchSettings.color,
                                    display: 'block',
                                }}
                            />
                            {showColorPicker && (
                                <div style={{
                                    position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                                    display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '8px',
                                    backgroundColor: 'var(--color-surface)',
                                    border: '1px solid var(--color-border-strong)',
                                    width: '120px',
                                }}>
                                    {COLORS.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => { updateSketchSettings({ color }); setShowColorPicker(false); }}
                                            style={{
                                                width: '24px', height: '24px',
                                                backgroundColor: color,
                                                border: sketchSettings.color === color ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                                                transition: 'transform 0.1s',
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Stroke width */}
                        <div style={{ display: 'flex', borderRight: '1px solid var(--color-border)' }}>
                            {STROKE_WIDTHS.map(w => (
                                <button
                                    key={w}
                                    onClick={() => updateSketchSettings({ strokeWidth: w })}
                                    title={`${w}px`}
                                    style={{
                                        width: '44px', height: '48px',
                                        border: 'none',
                                        borderBottom: sketchSettings.strokeWidth === w ? '2px solid var(--color-accent)' : '2px solid transparent',
                                        backgroundColor: sketchSettings.strokeWidth === w ? 'var(--color-surface)' : 'transparent',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.1s',
                                    }}
                                >
                                    <div style={{
                                        borderRadius: 0,
                                        width: Math.min(w * 1.5, 16),
                                        height: Math.min(w * 1.5, 16),
                                        backgroundColor: sketchSettings.strokeWidth === w ? 'var(--color-fg)' : 'var(--color-muted)',
                                    }} />
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {/* Search */}
                <button
                    onClick={() => setSearchOpen(true)}
                    title="Search (⌘K)"
                    style={{
                        padding: '10px 16px', height: '48px',
                        border: 'none',
                        borderRight: '1px solid var(--color-border)',
                        backgroundColor: 'transparent',
                        color: 'var(--color-muted)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.6rem',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        transition: 'all 0.1s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-surface)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-fg)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--color-muted)'; }}
                >
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    SEARCH
                    <span style={{ padding: '2px 6px', border: '1px solid var(--color-border)', fontSize: '0.55rem' }}>⌘K</span>
                </button>

                {/* Theme toggle */}
                <button
                    onClick={toggleTheme}
                    title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    style={{
                        padding: '10px 16px', height: '48px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: 'var(--color-muted)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.6rem',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        transition: 'all 0.1s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-surface)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-fg)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--color-muted)'; }}
                >
                    {theme === 'dark' ? '☀ LIGHT' : '☾ DARK'}
                </button>
            </div>
        </div>
    );
}
