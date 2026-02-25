'use client';

import { useState, useRef, useCallback } from 'react';
import { loadOpenCV, detectPageCorners, perspectiveCrop, scanPage, type ScanResult } from '@/lib/cv/pageScanner';
import { detectSketches, dataUrlToCanvas } from '@/lib/cv/sketchDetector';
import { uploadPageImage, uploadSketchComponent, createMediaItem, createEntry } from '@/lib/db';
import type { SketchRegion } from '@/types/database';

export type ScanStage =
    | 'idle'
    | 'loading_cv'
    | 'capturing'
    | 'detecting'
    | 'adjusting'   // User adjusting corners
    | 'scanning'    // Perspective warp running
    | 'detecting_sketches'
    | 'reviewing'   // User reviewing sketch regions
    | 'saving'
    | 'done'
    | 'error';

export interface PageScannerState {
    stage: ScanStage;
    sourceDataUrl: string | null;
    corners: [number, number][] | null;
    scanResult: ScanResult | null;
    sketchRegions: SketchRegion[];
    error: string | null;
    progress: number; // 0-100
}

export function usePageScanner() {
    const [state, setState] = useState<PageScannerState>({
        stage: 'idle',
        sourceDataUrl: null,
        corners: null,
        scanResult: null,
        sketchRegions: [],
        error: null,
        progress: 0,
    });

    const imgRef = useRef<HTMLImageElement | null>(null);

    const update = (patch: Partial<PageScannerState>) =>
        setState((s) => ({ ...s, ...patch }));

    /**
     * Load an image (file or camera capture) and detect corners
     */
    const loadImage = useCallback(async (source: File | Blob) => {
        update({ stage: 'loading_cv', error: null, progress: 10 });

        try {
            await loadOpenCV();
            update({ progress: 30 });

            // Convert to data URL for display
            const dataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.readAsDataURL(source);
            });

            update({ sourceDataUrl: dataUrl, stage: 'detecting', progress: 50 });

            // Load into img element for OpenCV
            const img = await new Promise<HTMLImageElement>((resolve) => {
                const el = new Image();
                el.onload = () => resolve(el);
                el.src = dataUrl;
            });
            imgRef.current = img;

            const corners = detectPageCorners(img);
            update({ corners, stage: 'adjusting', progress: 70 });
        } catch (err) {
            update({ stage: 'error', error: String(err) });
        }
    }, []);

    /**
     * After user adjusts corners, run perspective warp
     */
    const runScan = useCallback(async (adjustedCorners?: [number, number][]) => {
        if (!state.sourceDataUrl) return;
        update({ stage: 'scanning', progress: 75 });

        try {
            const result = await scanPage(state.sourceDataUrl, adjustedCorners ?? state.corners ?? undefined);
            update({ scanResult: result, stage: 'detecting_sketches', progress: 80 });

            // Detect sketches in the cropped page
            const pageCanvas = await dataUrlToCanvas(result.croppedDataUrl);
            const regions = detectSketches(pageCanvas, { minArea: 300, groupDistance: 50, padding: 10 });
            update({ sketchRegions: regions, stage: 'reviewing', progress: 90 });
        } catch (err) {
            update({ stage: 'error', error: String(err) });
        }
    }, [state.sourceDataUrl, state.corners]);

    /**
     * Update a sketch region (approve/reject/rename)
     */
    const updateRegion = useCallback((id: string, patch: Partial<SketchRegion>) => {
        setState((s) => ({
            ...s,
            sketchRegions: s.sketchRegions.map((r) => r.id === id ? { ...r, ...patch } : r),
        }));
    }, []);

    /**
     * Save the scanned page + approved sketch regions to Supabase
     */
    const savePage = useCallback(async (entryTitle: string) => {
        if (!state.scanResult) return;
        update({ stage: 'saving', progress: 95 });

        try {
            // 1. Upload page image to Supabase Storage
            const blob = await dataUrlToBlob(state.scanResult.croppedDataUrl);
            const filename = `pages/${Date.now()}.jpg`;
            const pageUrl = await uploadPageImage(blob, filename);

            // 2. Create diary entry
            const entry = await createEntry({
                title: entryTitle,
                content: null,
                plain_text: null,
                tags: [],
                entry_type: 'diary',
                layout_mode: 'single',
                page_image_url: pageUrl,
            });

            // 3. Upload approved sketch components
            const approvedRegions = state.sketchRegions.filter((r) => r.approved && r.thumbnailDataUrl);

            for (const region of approvedRegions) {
                const sketchBlob = await dataUrlToBlob(region.thumbnailDataUrl!);
                const sketchPath = `sketches/${entry.id}/${region.id}.png`;
                const sketchUrl = await uploadSketchComponent(sketchBlob, sketchPath);

                await createMediaItem({
                    type: 'sketch_component',
                    url: sketchUrl,
                    title: region.label ?? `Sketch ${region.id.slice(0, 6)}`,
                    description: null,
                    thumbnail_url: sketchUrl,
                    og_data: null,
                    parent_page_id: entry.id,
                    bounding_box: region.boundingBox,
                });
            }

            update({ stage: 'done', progress: 100 });
            return entry;
        } catch (err) {
            update({ stage: 'error', error: String(err) });
        }
    }, [state.scanResult, state.sketchRegions]);

    const reset = useCallback(() => {
        setState({
            stage: 'idle',
            sourceDataUrl: null,
            corners: null,
            scanResult: null,
            sketchRegions: [],
            error: null,
            progress: 0,
        });
    }, []);

    return { state, loadImage, runScan, updateRegion, savePage, reset };
}

function dataUrlToBlob(dataUrl: string): Promise<Blob> {
    return fetch(dataUrl).then((r) => r.blob());
}
