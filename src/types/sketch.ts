// Enhanced types for advanced sketch canvas with creative tools

export interface Point {
    x: number;
    y: number;
    pressure: number;      // 0-1, pen pressure
    tiltX: number;         // -90 to 90 degrees
    tiltY: number;         // -90 to 90 degrees
    timestamp: number;     // For velocity calculations
}

export interface Stroke {
    id: string;
    points: Point[];
    color: string;
    baseWidth: number;     // Base stroke width (modified by pressure)
    tool: SketchTool;
    opacity: number;       // 0-1
}

export interface SketchData {
    strokes: Stroke[];
    width: number;
    height: number;
    background: BackgroundType;
    zoom: number;
    panX: number;
    panY: number;
}

// Extended tools including creative schultzschultz-inspired tools
export type SketchTool =
    | 'pen'
    | 'pencil'
    | 'marker'
    | 'calligraphy'    // Broad nib calligraphy brush
    | 'eraser'
    | 'line'
    | 'rectangle'
    | 'circle'
    | 'arrow'
    | 'grid-paint'     // Snap-to-grid painting
    | 'smudge';        // Smudge/blur effect

export type BackgroundType = 'solid' | 'grid' | 'dots' | 'lines' | 'blueprint';

export interface SketchSettings {
    tool: SketchTool;
    color: string;
    strokeWidth: number;
    opacity: number;
    pressureSensitivity: number;  // 0-1, how much pressure affects width
    smoothing: number;            // 0-1, stroke smoothing level
    tiltEnabled: boolean;         // Use tilt for brush angle
    gridSize?: number;            // For grid-paint tool
    nibAngle?: number;            // For calligraphy tool (degrees)
}

export interface ViewState {
    zoom: number;
    panX: number;
    panY: number;
    isSpaceDown: boolean;  // For pan mode
}
