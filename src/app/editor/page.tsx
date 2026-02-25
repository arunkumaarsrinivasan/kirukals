'use client';

import { useState } from 'react';
import { InfiniteCanvas } from '@/components/editor/Canvas';
import { Toolbar } from '@/components/editor/Toolbar';
import { ToolOptionsPanel } from '@/components/editor/ToolOptionsPanel';
import { CommandPalette } from '@/components/editor/CommandPalette';
import { PenDetectionIndicator } from '@/hooks/usePenDetection';
import { PreviewMode } from '@/components/preview/PreviewMode';
import { useEditorStore } from '@/store/editor';
import { downloadHtml, copyHtmlToClipboard } from '@/utils/htmlExporter';

export default function EditorPage() {
    const { theme, blocks } = useEditorStore();

    const [showPreview, setShowPreview] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [exportMessage, setExportMessage] = useState<string | null>(null);

    const bgColor = theme === 'dark' ? '#0a0a0b' : '#f4f4f5';
    const borderColor = theme === 'dark' ? '#27272a' : '#e4e4e7';
    const headerBg = theme === 'dark' ? 'rgba(10, 10, 11, 0.9)' : 'rgba(255, 255, 255, 0.9)';

    const handleExportHtml = () => {
        downloadHtml(blocks, { title: 'Kirukal Export', theme });
        setShowExportMenu(false);
        setExportMessage('Downloaded!');
        setTimeout(() => setExportMessage(null), 2000);
    };

    const handleCopyHtml = async () => {
        const success = await copyHtmlToClipboard(blocks, { title: 'Kirukal Export', theme });
        setShowExportMenu(false);
        setExportMessage(success ? 'Copied to clipboard!' : 'Failed to copy');
        setTimeout(() => setExportMessage(null), 2000);
    };

    return (
        <main className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: bgColor }}>
            {/* Header */}
            <header
                className="sticky top-0 z-40 backdrop-blur-xl border-b"
                style={{ backgroundColor: headerBg, borderColor }}
            >
                <div className="w-full px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center">
                        <span className="font-logo text-2xl" style={{ color: theme === 'dark' ? '#fff' : '#18181b' }}>
                            Kirukal
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        {exportMessage && (
                            <span className="text-xs text-green-500 font-medium">{exportMessage}</span>
                        )}
                        <p className="text-xs" style={{ color: theme === 'dark' ? '#52525b' : '#a1a1aa' }}>
                            Auto-saved locally
                        </p>

                        {/* Preview Button */}
                        <button
                            onClick={() => setShowPreview(true)}
                            className="px-3 py-1.5 text-xs border rounded-lg transition-colors hover:bg-violet-500/10 flex items-center gap-1.5"
                            style={{
                                color: theme === 'dark' ? '#a1a1aa' : '#52525b',
                                borderColor
                            }}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Preview
                        </button>

                        {/* Export Button with Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                className="px-3 py-1.5 text-xs bg-violet-600 text-white rounded-lg transition-colors hover:bg-violet-500 flex items-center gap-1.5"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {showExportMenu && (
                                <div
                                    className="absolute right-0 top-full mt-2 w-48 rounded-lg border shadow-xl overflow-hidden"
                                    style={{
                                        backgroundColor: theme === 'dark' ? '#18181b' : '#fff',
                                        borderColor
                                    }}
                                >
                                    <button
                                        onClick={handleExportHtml}
                                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-violet-500/10 flex items-center gap-2 transition-colors"
                                        style={{ color: theme === 'dark' ? '#e4e4e7' : '#18181b' }}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download HTML
                                    </button>
                                    <button
                                        onClick={handleCopyHtml}
                                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-violet-500/10 flex items-center gap-2 transition-colors"
                                        style={{ color: theme === 'dark' ? '#e4e4e7' : '#18181b' }}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                        </svg>
                                        Copy HTML
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content - hide when preview is open to prevent z-index bleed */}
            <div className="flex-1 overflow-hidden" style={{ visibility: showPreview ? 'hidden' : 'visible' }}>
                <div className="w-full h-full overflow-hidden pb-20">
                    <InfiniteCanvas />
                </div>
            </div>

            {/* Tool Options Panel (above toolbar) */}
            <ToolOptionsPanel />

            {/* Toolbar */}
            <Toolbar />

            {/* Command Palette */}
            <CommandPalette />

            {/* Pen Detection Indicator */}
            <PenDetectionIndicator />

            {/* Preview Mode Overlay */}
            {showPreview && <PreviewMode onClose={() => setShowPreview(false)} />}

            {/* Click outside to close export menu */}
            {showExportMenu && (
                <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowExportMenu(false)}
                />
            )}
        </main>
    );
}
