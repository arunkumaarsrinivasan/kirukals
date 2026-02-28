/**
 * KIRUKAL — RAW_INPUT Design Tokens
 *
 * Extracted from the react-app.js brutalist/raw aesthetic.
 * Use CSS variables (defined in globals.css) for all styling in components.
 * Use these JS constants only where CSS variables can't be used:
 *   - HTML5 Canvas drawing contexts (strokeStyle, fillStyle, etc.)
 *   - Dynamic inline styles driven by runtime state
 */

// ─────────────────────────────────────────────
// COLOR PALETTE
// ─────────────────────────────────────────────

export const colors = {
    /** Page background — near-black */
    bg: '#080808',
    /** Elevated surface (sidebar, panels) */
    surface: '#0a0a0a',
    /** Canvas / drawing area background */
    canvas: '#111111',
    /** Canvas grid area */
    canvasArea: '#0c0c0c',
    /** Primary foreground / text */
    fg: '#e0e0e0',
    /** Muted text / icons */
    muted: '#666666',
    /** Subtle text — barely visible */
    subtle: '#444444',
    /** Default border color */
    border: '#333333',
    /** Strong border (headers, separators) */
    borderStrong: '#e0e0e0',
    /** Accent / danger / active indicator */
    accent: '#ff003c',
    /** Pure black */
    black: '#000000',
} as const;

export type ColorKey = keyof typeof colors;

// ─────────────────────────────────────────────
// TYPOGRAPHY
// ─────────────────────────────────────────────

export const fonts = {
    /** Display / brand — Archivo Black */
    display: "'Archivo Black', sans-serif",
    /** Body / UI / mono — Space Mono */
    mono: "'Space Mono', monospace",
} as const;

export const fontSizes = {
    xs: '0.7rem',
    sm: '0.8rem',
    base: '14px',
    lg: '1rem',
    display: '2rem',
    hero: '6rem',
} as const;

// ─────────────────────────────────────────────
// SPACING
// ─────────────────────────────────────────────

export const spacing = {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
} as const;

// ─────────────────────────────────────────────
// LAYOUT
// ─────────────────────────────────────────────

export const layout = {
    topBarHeight: '60px',
    sidebarWidth: '320px',
    toolbarWidth: '80px',
    statusBarHeight: '40px',
    gridSize: '40px',
} as const;

// ─────────────────────────────────────────────
// CANVAS DRAWING PRESETS
// Used with CanvasRenderingContext2D
// ─────────────────────────────────────────────

export const canvasTools = {
    pen: {
        globalCompositeOperation: 'source-over' as GlobalCompositeOperation,
        strokeStyle: colors.fg,
        lineWidth: 2,
        lineCap: 'square' as CanvasLineCap,
    },
    marker: {
        globalCompositeOperation: 'source-over' as GlobalCompositeOperation,
        strokeStyle: 'rgba(255, 255, 255, 0.5)',
        lineWidth: 10,
        lineCap: 'square' as CanvasLineCap,
    },
    eraser: {
        globalCompositeOperation: 'destination-out' as GlobalCompositeOperation,
        strokeStyle: 'rgba(0,0,0,1)',
        lineWidth: 20,
        lineCap: 'square' as CanvasLineCap,
    },
} as const;

export type CanvasToolKey = keyof typeof canvasTools;

// ─────────────────────────────────────────────
// NOISE OVERLAY
// ─────────────────────────────────────────────

export const noiseOverlaySvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`;

// ─────────────────────────────────────────────
// THEME OBJECT (convenience export)
// ─────────────────────────────────────────────

export const theme = {
    colors,
    fonts,
    fontSizes,
    spacing,
    layout,
    canvasTools,
    noiseOverlaySvg,
} as const;

export default theme;
