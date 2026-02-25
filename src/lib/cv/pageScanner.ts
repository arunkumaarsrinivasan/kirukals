/**
 * pageScanner.ts
 * On-device document scanner using OpenCV.js (WASM, runs in browser).
 * Detects diary page edges, corrects perspective, and crops cleanly.
 * All processing is local — no network, no API, no cost.
 */

export interface ScanResult {
    croppedDataUrl: string;
    corners: [number, number][]; // [x, y] × 4
    width: number;
    height: number;
}

export interface PageCorner {
    x: number;
    y: number;
}

let cvReady = false;

/**
 * Lazy-loads OpenCV.js from the public folder.
 * Cached after first load — subsequent calls are instant.
 */
export function loadOpenCV(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (cvReady) {
            resolve();
            return;
        }

        // Check if already loaded
        if (typeof window !== 'undefined' && (window as any).cv?.Mat) {
            cvReady = true;
            resolve();
            return;
        }

        const script = document.createElement('script');
        // Try local first; fallback to jsDelivr CDN (cached by browser after first load)
        script.src = '/opencv.js';
        script.onload = () => {
            // OpenCV.js has async WASM init
            const pollReady = setInterval(() => {
                if ((window as any).cv?.Mat) {
                    cvReady = true;
                    clearInterval(pollReady);
                    resolve();
                }
            }, 100);
            setTimeout(() => {
                clearInterval(pollReady);
                reject(new Error('OpenCV WASM init timeout'));
            }, 15000);
        };
        script.onerror = () => reject(new Error('Failed to load OpenCV.js'));
        document.head.appendChild(script);
    });
}

/**
 * Given an HTMLImageElement or ImageData, detects the document boundary
 * and returns the 4 corner points ordered: top-left, top-right, bottom-right, bottom-left
 */
export function detectPageCorners(imageElement: HTMLImageElement | HTMLCanvasElement): [number, number][] {
    const cv = (window as any).cv;
    if (!cv) throw new Error('OpenCV not loaded');

    const src = cv.imread(imageElement);
    const gray = new cv.Mat();
    const blurred = new cv.Mat();
    const edges = new cv.Mat();

    try {
        // 1. Convert to grayscale
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

        // 2. Gaussian blur to reduce noise
        const ksize = new cv.Size(5, 5);
        cv.GaussianBlur(gray, blurred, ksize, 0);

        // 3. Canny edge detection
        cv.Canny(blurred, edges, 50, 150);

        // 4. Dilate to close gaps
        const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
        cv.dilate(edges, edges, kernel);
        kernel.delete();

        // 5. Find contours
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

        // 6. Find largest 4-point contour (the page)
        let bestContour: any = null;
        let maxArea = 0;

        for (let i = 0; i < contours.size(); i++) {
            const cnt = contours.get(i);
            const area = cv.contourArea(cnt);
            const perimeter = cv.arcLength(cnt, true);

            // Approximate polygon
            const approx = new cv.Mat();
            cv.approxPolyDP(cnt, approx, 0.02 * perimeter, true);

            if (approx.rows === 4 && area > maxArea && area > (src.rows * src.cols * 0.1)) {
                maxArea = area;
                if (bestContour) bestContour.delete();
                bestContour = approx;
            } else {
                approx.delete();
            }
            cnt.delete();
        }

        contours.delete();
        hierarchy.delete();

        if (!bestContour) {
            // Fallback: use full image corners
            return [
                [0, 0],
                [src.cols, 0],
                [src.cols, src.rows],
                [0, src.rows],
            ];
        }

        // Extract and order corners: tl, tr, br, bl
        const pts: [number, number][] = [];
        for (let i = 0; i < 4; i++) {
            pts.push([bestContour.intAt(i, 0), bestContour.intAt(i, 1)]);
        }
        bestContour.delete();

        return orderCorners(pts);
    } finally {
        src.delete();
        gray.delete();
        blurred.delete();
        edges.delete();
    }
}

/**
 * Orders points as: top-left, top-right, bottom-right, bottom-left
 */
function orderCorners(pts: [number, number][]): [number, number][] {
    const sorted = [...pts].sort((a, b) => a[1] - b[1]); // sort by y
    const top = sorted.slice(0, 2).sort((a, b) => a[0] - b[0]);
    const bottom = sorted.slice(2, 4).sort((a, b) => a[0] - b[0]);
    return [top[0], top[1], bottom[1], bottom[0]]; // tl, tr, br, bl
}

/**
 * Applies perspective warp to straighten and crop the page.
 * corners: [tl, tr, br, bl] in source image coordinates
 * Returns a base64 data URL of the cropped page.
 */
export function perspectiveCrop(
    imageElement: HTMLImageElement | HTMLCanvasElement,
    corners: [number, number][],
    outputWidth = 1200,
    outputHeight = 1600
): string {
    const cv = (window as any).cv;
    if (!cv) throw new Error('OpenCV not loaded');

    const src = cv.imread(imageElement);

    const [tl, tr, br, bl] = corners;

    const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
        tl[0], tl[1],
        tr[0], tr[1],
        br[0], br[1],
        bl[0], bl[1],
    ]);

    const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
        0, 0,
        outputWidth, 0,
        outputWidth, outputHeight,
        0, outputHeight,
    ]);

    const M = cv.getPerspectiveTransform(srcPts, dstPts);
    const dst = new cv.Mat();
    const dsize = new cv.Size(outputWidth, outputHeight);
    cv.warpPerspective(src, dst, M, dsize);

    // Convert to canvas → data URL
    const canvas = document.createElement('canvas');
    cv.imshow(canvas, dst);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    src.delete();
    dst.delete();
    M.delete();
    srcPts.delete();
    dstPts.delete();

    return dataUrl;
}

/**
 * Full pipeline: load image → detect corners → warp
 */
export async function scanPage(
    source: File | Blob | string,
    manualCorners?: [number, number][]
): Promise<ScanResult> {
    await loadOpenCV();

    // Load image into HTMLImageElement
    const img = await loadImage(source);

    const corners = manualCorners ?? detectPageCorners(img);

    // Calculate natural aspect ratio from corners
    const w1 = Math.hypot(corners[1][0] - corners[0][0], corners[1][1] - corners[0][1]);
    const w2 = Math.hypot(corners[2][0] - corners[3][0], corners[2][1] - corners[3][1]);
    const h1 = Math.hypot(corners[3][0] - corners[0][0], corners[3][1] - corners[0][1]);
    const h2 = Math.hypot(corners[2][0] - corners[1][0], corners[2][1] - corners[1][1]);
    const width = Math.round((w1 + w2) / 2);
    const height = Math.round((h1 + h2) / 2);

    const croppedDataUrl = perspectiveCrop(img, corners, width, height);

    return { croppedDataUrl, corners, width, height };
}

function loadImage(source: File | Blob | string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        if (typeof source === 'string') {
            img.src = source;
        } else {
            img.src = URL.createObjectURL(source);
        }
    });
}
