'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePageScanner } from '@/hooks/usePageScanner';

interface PageScannerProps {
    onComplete?: (entryId: string) => void;
    onCancel?: () => void;
}

const STAGE_LABELS: Record<string, string> = {
    idle: 'Ready',
    loading_cv: 'Loading AI engine…',
    detecting: 'Detecting page edges…',
    adjusting: 'Adjust corners if needed',
    scanning: 'Correcting perspective…',
    detecting_sketches: 'Finding sketches…',
    reviewing: 'Review detected sketches',
    saving: 'Saving to cloud…',
    done: 'Saved!',
    error: 'Error',
};

export function PageScanner({ onComplete, onCancel }: PageScannerProps) {
    const { state, loadImage, runScan, updateRegion, savePage, reset } = usePageScanner();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [entryTitle, setEntryTitle] = useState('');
    const [stream, setStream] = useState<MediaStream | null>(null);

    // Corner drag state
    const [corners, setCorners] = useState<[number, number][] | null>(null);
    const [draggingCorner, setDraggingCorner] = useState<number | null>(null);

    useEffect(() => {
        if (state.corners && !corners) setCorners(state.corners);
    }, [state.corners, corners]);

    // Camera setup
    const startCamera = useCallback(async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.play();
            }
            setCameraActive(true);
        } catch {
            alert('Camera access denied. Please use file upload instead.');
        }
    }, []);

    const stopCamera = useCallback(() => {
        stream?.getTracks().forEach((t) => t.stop());
        setStream(null);
        setCameraActive(false);
    }, [stream]);

    // Capture frame from video
    const captureFrame = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
            if (blob) {
                stopCamera();
                loadImage(blob);
            }
        }, 'image/jpeg', 0.95);
    }, [stopCamera, loadImage]);

    const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) loadImage(file);
    }, [loadImage]);

    const handleSave = useCallback(async () => {
        const entry = await savePage(entryTitle || `Diary ${new Date().toLocaleDateString('en-IN')}`);
        if (entry) onComplete?.(entry.id);
    }, [savePage, entryTitle, onComplete]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
        >
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                    <div>
                        <h2 className="text-white font-semibold text-lg">📸 Scan Diary Page</h2>
                        <p className="text-zinc-400 text-sm mt-0.5">{STAGE_LABELS[state.stage] ?? state.stage}</p>
                    </div>
                    <button
                        onClick={() => { stopCamera(); reset(); onCancel?.(); }}
                        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Progress bar */}
                {state.stage !== 'idle' && state.stage !== 'done' && (
                    <div className="h-1 bg-zinc-800">
                        <motion.div
                            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${state.progress}%` }}
                            transition={{ duration: 0.4 }}
                        />
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    <AnimatePresence mode="wait">

                        {/* IDLE: Source Selection */}
                        {state.stage === 'idle' && (
                            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mt-8">
                                    <button
                                        onClick={startCamera}
                                        className="flex flex-col items-center gap-3 p-8 rounded-xl border-2 border-dashed border-zinc-700 hover:border-violet-500 hover:bg-violet-500/5 transition-all group"
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-zinc-800 group-hover:bg-violet-500/20 flex items-center justify-center transition-colors">
                                            <svg className="w-7 h-7 text-zinc-400 group-hover:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-medium text-zinc-300 group-hover:text-white">Use Camera</span>
                                    </button>

                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex flex-col items-center gap-3 p-8 rounded-xl border-2 border-dashed border-zinc-700 hover:border-fuchsia-500 hover:bg-fuchsia-500/5 transition-all group"
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-zinc-800 group-hover:bg-fuchsia-500/20 flex items-center justify-center transition-colors">
                                            <svg className="w-7 h-7 text-zinc-400 group-hover:text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-medium text-zinc-300 group-hover:text-white">Upload Photo</span>
                                    </button>

                                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                                </div>
                                <p className="text-center text-zinc-600 text-xs mt-6">
                                    AI detects page edges & sketches locally — no data sent to any server
                                </p>
                            </motion.div>
                        )}

                        {/* Camera Active */}
                        {cameraActive && (
                            <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="relative rounded-xl overflow-hidden bg-black">
                                <video ref={videoRef} autoPlay muted playsInline className="w-full max-h-[50vh] object-contain" />

                                {/* Overlay guide */}
                                <div className="absolute inset-4 border-2 border-violet-400/60 rounded-lg pointer-events-none">
                                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-violet-400 rounded-tl" />
                                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-violet-400 rounded-tr" />
                                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-violet-400 rounded-bl" />
                                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-violet-400 rounded-br" />
                                </div>

                                <canvas ref={canvasRef} className="hidden" />

                                <div className="absolute bottom-4 inset-x-0 flex justify-center gap-3">
                                    <button onClick={stopCamera}
                                        className="px-4 py-2 rounded-lg bg-zinc-800/90 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors">
                                        Cancel
                                    </button>
                                    <button onClick={captureFrame}
                                        className="w-16 h-16 rounded-full bg-white hover:bg-violet-100 transition-colors flex items-center justify-center shadow-xl">
                                        <div className="w-12 h-12 rounded-full border-4 border-zinc-400" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Loading / Detecting */}
                        {(state.stage === 'loading_cv' || state.stage === 'detecting' || state.stage === 'scanning' || state.stage === 'detecting_sketches') && (
                            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex flex-col items-center gap-6 py-12">
                                <div className="relative w-20 h-20">
                                    <div className="absolute inset-0 rounded-full border-4 border-zinc-800" />
                                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-500 animate-spin" />
                                    <div className="absolute inset-3 rounded-full bg-zinc-900 flex items-center justify-center">
                                        <span className="text-2xl">🤖</span>
                                    </div>
                                </div>
                                <p className="text-zinc-300">{STAGE_LABELS[state.stage]}</p>
                                {state.sourceDataUrl && (
                                    <img src={state.sourceDataUrl} alt="Source" className="max-w-xs rounded-lg opacity-40" />
                                )}
                            </motion.div>
                        )}

                        {/* Corner Adjusting */}
                        {state.stage === 'adjusting' && state.sourceDataUrl && corners && (
                            <motion.div key="adjusting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <p className="text-zinc-400 text-sm mb-3 text-center">Drag corners to adjust page boundary</p>
                                <CornerEditor
                                    imageUrl={state.sourceDataUrl}
                                    corners={corners}
                                    onChange={setCorners}
                                />
                                <div className="flex justify-center gap-3 mt-4">
                                    <button onClick={() => setCorners(state.corners)}
                                        className="px-4 py-2 text-sm text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors">
                                        Reset
                                    </button>
                                    <button onClick={() => runScan(corners as [number, number][])}
                                        className="px-6 py-2 text-sm bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium">
                                        Crop & Detect Sketches →
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Sketch Review */}
                        {state.stage === 'reviewing' && state.scanResult && (
                            <motion.div key="reviewing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <SketchReviewer
                                    pageDataUrl={state.scanResult.croppedDataUrl}
                                    regions={state.sketchRegions}
                                    onUpdate={updateRegion}
                                />

                                <div className="mt-4 border-t border-zinc-800 pt-4 flex items-center gap-3">
                                    <input
                                        type="text"
                                        placeholder="Entry title (optional)"
                                        value={entryTitle}
                                        onChange={(e) => setEntryTitle(e.target.value)}
                                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                                    />
                                    <button onClick={handleSave}
                                        className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm rounded-lg hover:opacity-90 font-medium shrink-0">
                                        Save to Diary ✓
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Done */}
                        {state.stage === 'done' && (
                            <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center gap-4 py-12">
                                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-white font-medium">Page saved to your diary!</p>
                                <button onClick={() => { reset(); onCancel?.(); }}
                                    className="px-6 py-2 text-sm text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors">
                                    Close
                                </button>
                            </motion.div>
                        )}

                        {/* Error */}
                        {state.stage === 'error' && (
                            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="flex flex-col items-center gap-4 py-12">
                                <p className="text-red-400">{state.error}</p>
                                <button onClick={reset}
                                    className="px-6 py-2 text-sm bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700">
                                    Try Again
                                </button>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Corner Editor ────────────────────────────────────────────────────────────

function CornerEditor({ imageUrl, corners, onChange }: {
    imageUrl: string;
    corners: [number, number][];
    onChange: (corners: [number, number][]) => void;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    const getRelativeCorners = () => {
        if (!imgRef.current) return corners;
        const { naturalWidth, naturalHeight, width, height } = imgRef.current;
        const scaleX = width / naturalWidth;
        const scaleY = height / naturalHeight;
        return corners.map(([x, y]) => [x * scaleX, y * scaleY] as [number, number]);
    };

    const handleMouseDown = (e: React.MouseEvent, idx: number) => {
        e.preventDefault();
        const onMove = (me: MouseEvent) => {
            if (!imgRef.current) return;
            const rect = imgRef.current.getBoundingClientRect();
            const { naturalWidth, naturalHeight, width, height } = imgRef.current;
            const px = Math.max(0, Math.min(me.clientX - rect.left, width));
            const py = Math.max(0, Math.min(me.clientY - rect.top, height));
            const nx = (px / width) * naturalWidth;
            const ny = (py / height) * naturalHeight;
            const updated = [...corners] as [number, number][];
            updated[idx] = [nx, ny];
            onChange(updated);
        };
        const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    const relCorners = getRelativeCorners();

    return (
        <div ref={containerRef} className="relative inline-block max-w-full">
            <img ref={imgRef} src={imageUrl} alt="Source page" className="max-h-[45vh] max-w-full rounded-lg select-none" />

            {/* Overlay polygon */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <polygon
                    points={relCorners.map(([x, y]) => `${x},${y}`).join(' ')}
                    fill="rgba(139,92,246,0.15)"
                    stroke="rgba(139,92,246,0.8)"
                    strokeWidth="2"
                />
            </svg>

            {/* Corner handles */}
            {relCorners.map(([x, y], i) => (
                <div
                    key={i}
                    className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full bg-violet-500 border-2 border-white cursor-grab active:cursor-grabbing shadow-lg"
                    style={{ left: x, top: y }}
                    onMouseDown={(e) => handleMouseDown(e, i)}
                />
            ))}
        </div>
    );
}

// ─── Sketch Reviewer ─────────────────────────────────────────────────────────

import type { SketchRegion } from '@/types/database';

function SketchReviewer({ pageDataUrl, regions, onUpdate }: {
    pageDataUrl: string;
    regions: SketchRegion[];
    onUpdate: (id: string, patch: Partial<SketchRegion>) => void;
}) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Page preview with bounding boxes */}
            <div className="relative">
                <p className="text-zinc-400 text-xs mb-2">Detected regions on page</p>
                <div className="relative inline-block">
                    <img src={pageDataUrl} alt="Scanned page" className="max-h-[50vh] rounded-lg w-full object-contain bg-zinc-800" />
                    {/* TODO: overlay bounding boxes as SVG */}
                </div>
            </div>

            {/* Detected sketch components */}
            <div>
                <p className="text-zinc-400 text-xs mb-2">{regions.length} sketch components found</p>
                <div className="space-y-2 max-h-[50vh] overflow-auto pr-1">
                    {regions.map((region) => (
                        <div key={region.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${region.approved
                                    ? 'border-violet-500/40 bg-violet-500/5'
                                    : 'border-zinc-800 bg-zinc-900 opacity-50'
                                }`}
                        >
                            {region.thumbnailDataUrl && (
                                <img
                                    src={region.thumbnailDataUrl}
                                    alt="sketch"
                                    className="w-14 h-14 rounded-lg object-contain bg-zinc-800 shrink-0"
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <input
                                    type="text"
                                    placeholder="Name this sketch…"
                                    value={region.label ?? ''}
                                    onChange={(e) => onUpdate(region.id, { label: e.target.value })}
                                    className="w-full bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none"
                                />
                                <p className="text-xs text-zinc-600 mt-0.5">
                                    {region.boundingBox.width}×{region.boundingBox.height}px
                                </p>
                            </div>
                            <button
                                onClick={() => onUpdate(region.id, { approved: !region.approved })}
                                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${region.approved ? 'bg-violet-500 text-white' : 'bg-zinc-800 text-zinc-500'
                                    }`}
                            >
                                {region.approved ? '✓' : '○'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
