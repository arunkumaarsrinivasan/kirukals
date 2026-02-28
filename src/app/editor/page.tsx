'use client';

import { useState } from 'react';
import Link from 'next/link';
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

    const handleExportHtml = () => {
        downloadHtml(blocks, { title: 'Kirukal Export', theme });
        setShowExportMenu(false);
        setExportMessage('DOWNLOADED');
        setTimeout(() => setExportMessage(null), 2000);
    };

    const handleCopyHtml = async () => {
        const success = await copyHtmlToClipboard(blocks, { title: 'Kirukal Export', theme });
        setShowExportMenu(false);
        setExportMessage(success ? 'COPIED' : 'ERR: CLIPBOARD');
        setTimeout(() => setExportMessage(null), 2000);
    };

    return (
        <main
            style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                backgroundColor: 'var(--color-bg)',
                fontFamily: 'var(--font-mono)',
            }}
        >
            {/* Noise overlay */}
            <div
                aria-hidden
                style={{
                    position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, opacity: 0.05,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    backgroundSize: '200px 200px',
                }}
            />

            {/* ── Top Bar ── */}
            <header
                style={{
                    position: 'sticky', top: 0, zIndex: 40,
                    backgroundColor: 'var(--color-bg)',
                    borderBottom: '2px solid var(--color-border-strong)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 16px', height: '60px', flexShrink: 0,
                }}
            >
                {/* Left: brand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Link href="/" style={{ textDecoration: 'none' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '-1px', color: 'var(--color-fg)' }}>
                            KIRUKAL
                        </span>
                    </Link>
                    <span style={{ color: 'var(--color-border-strong)', fontSize: '0.7rem' }}>›</span>
                    <span style={{ color: 'var(--color-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        EDITOR
                    </span>
                </div>

                {/* Right: actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {exportMessage && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            ■ {exportMessage}
                        </span>
                    )}

                    <span style={{ fontSize: '0.65rem', color: 'var(--color-subtle)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        AUTO-SAVED
                    </span>

                    {/* Preview button */}
                    <button
                        onClick={() => setShowPreview(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 14px',
                            border: '1px solid var(--color-border-strong)',
                            backgroundColor: 'transparent',
                            color: 'var(--color-muted)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.65rem',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            transition: 'all 0.1s linear',
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-fg)';
                            (e.currentTarget as HTMLElement).style.color = 'var(--color-bg)';
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                            (e.currentTarget as HTMLElement).style.color = 'var(--color-muted)';
                        }}
                    >
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        PREVIEW
                    </button>

                    {/* Export button + dropdown */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 14px',
                                backgroundColor: 'var(--color-fg)',
                                color: 'var(--color-bg)',
                                border: 'none',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.65rem',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                fontWeight: 700,
                                borderLeft: '4px solid var(--color-accent)',
                                transition: 'opacity 0.1s',
                            }}
                        >
                            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            EXPORT
                            <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showExportMenu && (
                            <div style={{
                                position: 'absolute', right: 0, top: '100%', marginTop: '2px',
                                width: '180px',
                                backgroundColor: 'var(--color-surface)',
                                border: '1px solid var(--color-border-strong)',
                                zIndex: 50,
                                overflow: 'hidden',
                            }}>
                                {[
                                    { label: 'DOWNLOAD HTML', action: handleExportHtml },
                                    { label: 'COPY HTML', action: handleCopyHtml },
                                ].map((item) => (
                                    <button
                                        key={item.label}
                                        onClick={item.action}
                                        style={{
                                            width: '100%', padding: '12px 16px',
                                            textAlign: 'left',
                                            fontSize: '0.65rem',
                                            fontFamily: 'var(--font-mono)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            backgroundColor: 'transparent',
                                            color: 'var(--color-fg)',
                                            border: 'none',
                                            borderBottom: '1px solid var(--color-border)',
                                            transition: 'all 0.1s',
                                        }}
                                        onMouseEnter={(e) => {
                                            (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-fg)';
                                            (e.currentTarget as HTMLElement).style.color = 'var(--color-bg)';
                                        }}
                                        onMouseLeave={(e) => {
                                            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                                            (e.currentTarget as HTMLElement).style.color = 'var(--color-fg)';
                                        }}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* ── Canvas ── */}
            <div style={{ flex: 1, overflow: 'hidden', visibility: showPreview ? 'hidden' : 'visible' }}>
                <div style={{ width: '100%', height: '100%', overflow: 'hidden', paddingBottom: '80px' }}>
                    <InfiniteCanvas />
                </div>
            </div>

            <ToolOptionsPanel />
            <Toolbar />
            <CommandPalette />
            <PenDetectionIndicator />

            {showPreview && <PreviewMode onClose={() => setShowPreview(false)} />}

            {showExportMenu && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 30 }}
                    onClick={() => setShowExportMenu(false)}
                />
            )}
        </main>
    );
}
