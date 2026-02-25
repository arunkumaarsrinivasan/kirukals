'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
        <div className="min-h-screen bg-zinc-950 flex flex-col">

            {/* Nav */}
            <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60">
                <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-white font-logo text-xl">Kirukal</span>
                        <span className="text-zinc-600 text-sm">/ Diary</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Layout toggle */}
                        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1 gap-1">
                            <button
                                onClick={() => setLayoutMode('single')}
                                className={`px-3 py-1.5 text-xs rounded-md transition-all font-medium ${layoutMode === 'single'
                                        ? 'bg-zinc-700 text-white'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                            >
                                Single
                            </button>
                            <button
                                onClick={() => setLayoutMode('double')}
                                className={`px-3 py-1.5 text-xs rounded-md transition-all font-medium ${layoutMode === 'double'
                                        ? 'bg-zinc-700 text-white'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                            >
                                Double
                            </button>
                        </div>

                        {/* Scan page button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowScanner(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-medium rounded-lg hover:opacity-90 shadow-lg shadow-violet-500/20"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            </svg>
                            Scan Page
                        </motion.button>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 py-8">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-10 h-10 border-4 border-zinc-800 border-t-violet-500 rounded-full animate-spin" />
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

                {/* Empty state */}
                {!loading && entries.length === 0 && (
                    <EmptyState onScan={() => setShowScanner(true)} />
                )}
            </main>

            {/* Hover media preview popup */}
            <HoverMediaPreview
                media={hoveredMedia}
                anchorRect={hoveredAnchorRect}
                side={leftMedia.includes(hoveredMedia!) ? 'left' : 'right'}
            />

            {/* SVG connection arcs */}
            <ConnectionOverlay connections={connections} activeConnectionId={activeConnectionId} />

            {/* Page scanner modal */}
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

// ─── Single Layout ────────────────────────────────────────────────────────────

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
        <div className="grid grid-cols-[240px_1fr_240px] gap-6 items-start">
            {/* Left panel: Sketches */}
            <div className="sticky top-24">
                <MediaPanel side="left" items={leftMedia} activeMediaId={activeMediaId} />
            </div>

            {/* Center: Diary entries */}
            <div className="flex flex-col gap-5">
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

            {/* Right panel: Links & videos */}
            <div className="sticky top-24">
                <MediaPanel side="right" items={rightMedia} activeMediaId={activeMediaId} />
            </div>
        </div>
    );
}

// ─── Double Layout (book spread) ─────────────────────────────────────────────

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
        <div className="flex flex-col gap-8">
            {entries.map((entry) => (
                <div
                    key={entry.id}
                    className="grid grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-zinc-800 shadow-xl"
                    style={{
                        background: 'linear-gradient(135deg, #18181b 0%, #1c1917 50%, #18181b 100%)',
                    }}
                >
                    {/* Left page: scanned image / sketches */}
                    <div className="border-r border-zinc-800/60 p-6 flex flex-col gap-4 bg-zinc-900/40">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-zinc-600 uppercase tracking-widest">Page Image</span>
                            <span className="text-xs text-zinc-700">◀</span>
                        </div>
                        {entry.page_image_url ? (
                            <img
                                src={entry.page_image_url}
                                alt="Diary page"
                                className="rounded-xl w-full object-contain max-h-96 bg-amber-50/5 border border-zinc-700/30"
                            />
                        ) : (
                            <div className="flex-1 rounded-xl border-2 border-dashed border-zinc-800 flex items-center justify-center min-h-48">
                                <p className="text-zinc-700 text-sm">No page image</p>
                            </div>
                        )}

                        {/* Sketch components from this page */}
                        <div className="grid grid-cols-3 gap-2">
                            {allMedia
                                .filter((m) => m.parent_page_id === entry.id)
                                .map((sketch) => (
                                    <img
                                        key={sketch.id}
                                        src={sketch.thumbnail_url ?? sketch.url}
                                        alt={sketch.title ?? ''}
                                        className={`rounded-lg w-full h-16 object-contain bg-zinc-800 border transition-all ${activeMediaId === sketch.id
                                                ? 'border-violet-500 shadow-md shadow-violet-500/20'
                                                : 'border-zinc-700/40'
                                            }`}
                                    />
                                ))}
                        </div>
                    </div>

                    {/* Right page: diary text */}
                    <div className="p-6 relative" style={{ fontFamily: 'var(--font-logo, serif)' }}>
                        {/* Ruled line background */}
                        <div className="absolute inset-y-0 left-0 right-0 opacity-[0.025] pointer-events-none"
                            style={{
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

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ onScan }: { onScan: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20 flex items-center justify-center">
                <span className="text-5xl">📓</span>
            </div>
            <div className="text-center">
                <h2 className="text-white text-2xl font-semibold mb-2">Your diary is empty</h2>
                <p className="text-zinc-500 max-w-sm">
                    Scan a physical diary page, or start writing. Your sketches will come to life on screen.
                </p>
            </div>
            <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onScan}
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold rounded-2xl shadow-xl shadow-violet-500/25 hover:opacity-90"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
                Scan your first page
            </motion.button>
        </div>
    );
}
