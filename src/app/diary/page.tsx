'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { getEntries, getMediaItems } from '@/lib/db';
import { useConnections } from '@/hooks/useConnections';
import { DiaryEntryCard } from '@/components/diary/DiaryEntryCard';
import { MediaPanel } from '@/components/diary/MediaPanel';
import { HoverMediaPreview } from '@/components/diary/HoverMediaPreview';
import { ConnectionOverlay } from '@/components/diary/ConnectionOverlay';
import { PageScanner } from '@/components/diary/PageScanner';
import type { DiaryEntry, MediaItem } from '@/types/database';

type LayoutMode = 'single' | 'double';

export default function DiaryPage() {
    const [entries, setEntries] = useState<DiaryEntry[]>([]);
    const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
    const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
    const [hoveredMedia, setHoveredMedia] = useState<MediaItem | null>(null);
    const [hoveredAnchorRect, setHoveredAnchorRect] = useState<DOMRect | undefined>();
    const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);
    const [layoutMode, setLayoutMode] = useState<LayoutMode>('single');
    const [showScanner, setShowScanner] = useState(false);
    const [loading, setLoading] = useState(true);

    const { connections } = useConnections(selectedEntryId);

    const loadData = useCallback(async () => {
        try {
            const [entriesData, mediaData] = await Promise.all([
                getEntries(),
                getMediaItems(),
            ]);
            setEntries(entriesData);
            setAllMedia(mediaData);
            if (entriesData.length && !selectedEntryId) {
                setSelectedEntryId(entriesData[0].id);
            }
        } catch (err) {
            console.error('Failed to load diary:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedEntryId]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleHoverLink = useCallback((media: MediaItem | null, anchorRect?: DOMRect) => {
        setHoveredMedia(media);
        setHoveredAnchorRect(anchorRect);
    }, []);

    const leftMedia = allMedia.filter((m) =>
        m.type === 'image' || m.type === 'sketch' || m.type === 'sketch_component'
    );
    const rightMedia = allMedia.filter((m) =>
        m.type === 'link' || m.type === 'video' || m.type === 'embed'
    );

    const activeMediaId = hoveredMedia?.id ?? null;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-mono)' }}>

            {/* Noise overlay */}
            <div
                aria-hidden
                style={{
                    position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, opacity: 0.06,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    backgroundSize: '200px 200px',
                }}
            />

            {/* ── Top Bar ── */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 40,
                backgroundColor: 'var(--color-bg)',
                borderBottom: '2px solid var(--color-border-strong)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 24px', height: '60px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Link href="/" style={{ textDecoration: 'none' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '-1px', color: 'var(--color-fg)' }}>
                            KIRUKAL
                        </span>
                    </Link>
                    <span style={{ color: 'var(--color-border-strong)', fontSize: '0.7rem' }}>›</span>
                    <span style={{ color: 'var(--color-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        DIARY
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Layout toggle */}
                    <div style={{ display: 'flex', border: '1px solid var(--color-border-strong)', overflow: 'hidden' }}>
                        {(['single', 'double'] as LayoutMode[]).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setLayoutMode(mode)}
                                style={{
                                    padding: '8px 16px',
                                    fontSize: '0.65rem',
                                    fontFamily: 'var(--font-mono)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    border: 'none',
                                    borderRight: mode === 'single' ? '1px solid var(--color-border-strong)' : 'none',
                                    backgroundColor: layoutMode === mode ? 'var(--color-fg)' : 'transparent',
                                    color: layoutMode === mode ? 'var(--color-bg)' : 'var(--color-muted)',
                                    fontWeight: layoutMode === mode ? 700 : 400,
                                    transition: 'all 0.1s linear',
                                }}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>

                    {/* Scan button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowScanner(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '8px 16px',
                            backgroundColor: 'var(--color-fg)',
                            color: 'var(--color-bg)',
                            border: 'none',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.65rem',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            fontWeight: 700,
                            borderLeft: '4px solid var(--color-accent)',
                        }}
                    >
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        </svg>
                        SCAN PAGE
                    </motion.button>
                </div>
            </header>

            {/* ── Main ── */}
            <main style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '32px 16px' }}>
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px', gap: '12px', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        <span className="raw-blink" style={{ color: 'var(--color-accent)' }}>■</span>
                        LOADING INDEX...
                    </div>
                ) : layoutMode === 'single' ? (
                    <SingleLayout
                        entries={entries}
                        selectedEntryId={selectedEntryId}
                        connections={connections}
                        leftMedia={leftMedia}
                        rightMedia={rightMedia}
                        activeMediaId={activeMediaId}
                        onSelectEntry={setSelectedEntryId}
                        onHoverLink={handleHoverLink}
                    />
                ) : (
                    <DoubleLayout
                        entries={entries}
                        selectedEntryId={selectedEntryId}
                        connections={connections}
                        allMedia={allMedia}
                        activeMediaId={activeMediaId}
                        onSelectEntry={setSelectedEntryId}
                        onHoverLink={handleHoverLink}
                    />
                )}

                {!loading && entries.length === 0 && (
                    <EmptyState onScan={() => setShowScanner(true)} />
                )}
            </main>

            {/* Status bar */}
            <footer style={{
                borderTop: '2px solid var(--color-border-strong)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 24px', height: '40px',
                fontSize: '0.65rem', fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase', color: 'var(--color-muted)',
                backgroundColor: 'var(--color-bg)', letterSpacing: '1px',
            }}>
                <span>ENTRIES: {entries.length}</span>
                <span>LAYOUT: {layoutMode.toUpperCase()}</span>
                <span>MODE: DIARY</span>
            </footer>

            <HoverMediaPreview
                media={hoveredMedia}
                anchorRect={hoveredAnchorRect}
                side={leftMedia.includes(hoveredMedia!) ? 'left' : 'right'}
            />

            <ConnectionOverlay connections={connections} activeConnectionId={activeConnectionId} />

            <AnimatePresence>
                {showScanner && (
                    <PageScanner
                        onComplete={(entryId) => {
                            setShowScanner(false);
                            loadData();
                            setSelectedEntryId(entryId);
                        }}
                        onCancel={() => setShowScanner(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Single Layout ─────────────────────────────────────────────────────────────

function SingleLayout({ entries, selectedEntryId, connections, leftMedia, rightMedia, activeMediaId, onSelectEntry, onHoverLink }: {
    entries: DiaryEntry[];
    selectedEntryId: string | null;
    connections: any[];
    leftMedia: MediaItem[];
    rightMedia: MediaItem[];
    activeMediaId: string | null;
    onSelectEntry: (id: string) => void;
    onHoverLink: (media: MediaItem | null, rect?: DOMRect) => void;
}) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 240px', gap: '24px', alignItems: 'start' }}>
            <div style={{ position: 'sticky', top: '80px' }}>
                <MediaPanel side="left" items={leftMedia} activeMediaId={activeMediaId} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {entries.map((entry) => (
                    <DiaryEntryCard
                        key={entry.id}
                        entry={entry}
                        connections={selectedEntryId === entry.id ? connections : []}
                        layoutMode="single"
                        isSelected={selectedEntryId === entry.id}
                        onSelect={() => onSelectEntry(entry.id)}
                        onHoverLink={onHoverLink}
                    />
                ))}
            </div>
            <div style={{ position: 'sticky', top: '80px' }}>
                <MediaPanel side="right" items={rightMedia} activeMediaId={activeMediaId} />
            </div>
        </div>
    );
}

// ─── Double Layout (book spread) ──────────────────────────────────────────────

function DoubleLayout({ entries, selectedEntryId, connections, allMedia, activeMediaId, onSelectEntry, onHoverLink }: {
    entries: DiaryEntry[];
    selectedEntryId: string | null;
    connections: any[];
    allMedia: MediaItem[];
    activeMediaId: string | null;
    onSelectEntry: (id: string) => void;
    onHoverLink: (media: MediaItem | null, rect?: DOMRect) => void;
}) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {entries.map((entry) => (
                <div
                    key={entry.id}
                    style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr',
                        border: '1px solid var(--color-border-strong)',
                        overflow: 'hidden',
                        backgroundColor: 'var(--color-surface)',
                    }}
                >
                    {/* Left page: scanned image */}
                    <div style={{ borderRight: '2px solid var(--color-border-strong)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.6rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'var(--font-mono)' }}>
                                PAGE IMAGE
                            </span>
                            <span style={{ fontSize: '0.6rem', color: 'var(--color-subtle)' }}>◀</span>
                        </div>
                        {entry.page_image_url ? (
                            <img
                                src={entry.page_image_url}
                                alt="Diary page"
                                style={{
                                    width: '100%', objectFit: 'contain', maxHeight: '384px',
                                    border: '1px solid var(--color-border)',
                                    filter: 'grayscale(20%)',
                                }}
                            />
                        ) : (
                            <div style={{
                                flex: 1, border: '1px dashed var(--color-border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '192px',
                            }}>
                                <p style={{ color: 'var(--color-subtle)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                                    NO_PAGE_IMAGE
                                </p>
                            </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                            {allMedia
                                .filter((m) => m.parent_page_id === entry.id)
                                .map((sketch) => (
                                    <img
                                        key={sketch.id}
                                        src={sketch.thumbnail_url ?? sketch.url}
                                        alt={sketch.title ?? ''}
                                        style={{
                                            width: '100%', height: '64px', objectFit: 'contain',
                                            backgroundColor: 'var(--color-canvas)',
                                            border: `1px solid ${activeMediaId === sketch.id ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                            transition: 'border-color 0.1s',
                                        }}
                                    />
                                ))}
                        </div>
                    </div>

                    {/* Right page: diary text */}
                    <div style={{ padding: '24px', position: 'relative', fontFamily: 'var(--font-logo, serif)' }}>
                        <div
                            aria-hidden
                            style={{
                                position: 'absolute', inset: 0, opacity: 0.03, pointerEvents: 'none',
                                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(255,255,255,0.5) 28px)',
                                backgroundSize: '100% 28px',
                            }}
                        />
                        <DiaryEntryCard
                            entry={entry}
                            connections={selectedEntryId === entry.id ? connections : []}
                            layoutMode="double"
                            isSelected={selectedEntryId === entry.id}
                            onSelect={() => onSelectEntry(entry.id)}
                            onHoverLink={onHoverLink}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onScan }: { onScan: () => void }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '128px 24px', gap: '24px' }}>
            {/* Icon box */}
            <div style={{
                width: '80px', height: '80px',
                border: '2px solid var(--color-border-strong)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2.5rem',
            }}>
                📓
            </div>

            {/* Copy */}
            <div style={{ textAlign: 'center' }}>
                <h2 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.8rem',
                    letterSpacing: '-1px',
                    color: 'var(--color-fg)',
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                }}>
                    DIARY IS EMPTY
                </h2>
                <p style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', maxWidth: '360px', lineHeight: 1.7 }}>
                    Scan a physical diary page, or start writing. Your sketches will come to life on screen.
                </p>
            </div>

            {/* CTA */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onScan}
                style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '16px 32px',
                    backgroundColor: 'var(--color-fg)',
                    color: 'var(--color-bg)',
                    border: 'none',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    fontWeight: 700,
                    borderLeft: '4px solid var(--color-accent)',
                }}
            >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
                SCAN FIRST PAGE
            </motion.button>
        </div>
    );
}
