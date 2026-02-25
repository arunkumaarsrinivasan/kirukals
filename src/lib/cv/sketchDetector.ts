/**
 * sketchDetector.ts
 * On-device sketch/scribble component detection using OpenCV.js.
 * Groups nearby contours into logical sketch components.
 * Completely offline, no API cost.
 */

import type { SketchRegion } from '@/types/database';

export interface DetectionOptions {
    minArea?: number;        // Minimum contour area to consider (filters noise)
    groupDistance?: number;  // Max pixel distance to merge contours into one region
    padding?: number;        // Padding around detected bounding boxes
}

/**
 * Detects sketch/scribble regions in a scanned diary page image.
 * Returns bounding boxes for each logical sketch group.
 */
export function detectSketches(
    pageCanvas: HTMLCanvasElement,
    options: DetectionOptions = {}
): SketchRegion[] {
    const cv = (window as any).cv;
    if (!cv) throw new Error('OpenCV not loaded');

    const {
        minArea = 200,
        groupDistance = 40,
        padding = 8,
    } = options;

    const src = cv.imread(pageCanvas);
    const gray = new cv.Mat();
    const thresh = new cv.Mat();
    const inverted = new cv.Mat();

    try {
        // 1. Grayscale
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

        // 2. Adaptive threshold — handles uneven lighting from photo
        cv.adaptiveThreshold(
            gray, thresh, 255,
            cv.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv.THRESH_BINARY, 11, 2
        );

        // 3. Invert (sketches are dark on light paper → make them white on black)
        cv.bitwise_not(thresh, inverted);

        // 4. Morphological close to connect nearby strokes
        const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
        const closed = new cv.Mat();
        cv.morphologyEx(inverted, closed, cv.MORPH_CLOSE, kernel);
        kernel.delete();

        // 5. Find contours
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        cv.findContours(closed, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
        closed.delete();

        // 6. Collect bounding rects, filter noise
        const rects: { x: number; y: number; width: number; height: number }[] = [];

        for (let i = 0; i < contours.size(); i++) {
            const cnt = contours.get(i);
            const area = cv.contourArea(cnt);

            if (area >= minArea) {
                const rect = cv.boundingRect(cnt);
                rects.push({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
            }
            cnt.delete();
        }

        contours.delete();
        hierarchy.delete();

        // 7. Group nearby bounding rects into sketch components
        const groups = groupRects(rects, groupDistance);

        // 8. Extract thumbnails and build SketchRegion results
        const regions: SketchRegion[] = groups.map((g) => {
            const paddedX = Math.max(0, g.x - padding);
            const paddedY = Math.max(0, g.y - padding);
            const paddedW = Math.min(pageCanvas.width - paddedX, g.width + padding * 2);
            const paddedH = Math.min(pageCanvas.height - paddedY, g.height + padding * 2);

            // Crop thumbnail from canvas
            const thumbCanvas = document.createElement('canvas');
            thumbCanvas.width = paddedW;
            thumbCanvas.height = paddedH;
            const ctx = thumbCanvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(pageCanvas, paddedX, paddedY, paddedW, paddedH, 0, 0, paddedW, paddedH);
            }

            return {
                id: crypto.randomUUID(),
                boundingBox: { x: paddedX, y: paddedY, width: paddedW, height: paddedH },
                confidence: Math.min(1, (g.width * g.height) / 5000), // rough confidence
                approved: true,
                thumbnailDataUrl: thumbCanvas.toDataURL('image/png'),
            };
        });

        return regions;
    } finally {
        src.delete();
        gray.delete();
        thresh.delete();
        inverted.delete();
    }
}

/**
 * Groups overlapping or nearby bounding rects together using union-find approach.
 */
function groupRects(
    rects: { x: number; y: number; width: number; height: number }[],
    maxDistance: number
): { x: number; y: number; width: number; height: number }[] {
    if (rects.length === 0) return [];

    // Union-Find
    const parent = rects.map((_, i) => i);

    function find(i: number): number {
        if (parent[i] !== i) parent[i] = find(parent[i]);
        return parent[i];
    }

    function union(a: number, b: number) {
        parent[find(a)] = find(b);
    }

    // Check each pair
    for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
            if (rectsAreClose(rects[i], rects[j], maxDistance)) {
                union(i, j);
            }
        }
    }

    // Group by root
    const groups = new Map<number, typeof rects>();
    rects.forEach((r, i) => {
        const root = find(i);
        if (!groups.has(root)) groups.set(root, []);
        groups.get(root)!.push(r);
    });

    // Merge bounding boxes within each group
    return Array.from(groups.values()).map(mergeRects);
}

function rectsAreClose(
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number },
    d: number
): boolean {
    const ax1 = a.x - d, ay1 = a.y - d, ax2 = a.x + a.width + d, ay2 = a.y + a.height + d;
    const bx1 = b.x, by1 = b.y, bx2 = b.x + b.width, by2 = b.y + b.height;
    return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
}

function mergeRects(rects: { x: number; y: number; width: number; height: number }[]) {
    const x = Math.min(...rects.map((r) => r.x));
    const y = Math.min(...rects.map((r) => r.y));
    const x2 = Math.max(...rects.map((r) => r.x + r.width));
    const y2 = Math.max(...rects.map((r) => r.y + r.height));
    return { x, y, width: x2 - x, height: y2 - y };
}

/**
 * Converts a page image data URL to an HTMLCanvasElement for OpenCV processing.
 */
export function dataUrlToCanvas(dataUrl: string): Promise<HTMLCanvasElement> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);
            resolve(canvas);
        };
        img.src = dataUrl;
    });
}
