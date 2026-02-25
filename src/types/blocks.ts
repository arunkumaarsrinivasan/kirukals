// Block type definitions for Kirukal editor - Free-form canvas

import type { SketchData } from './sketch';
import type { JSONContent } from '@tiptap/react';

export type BlockType = 'section' | 'text' | 'embed' | 'media' | 'markdown' | 'diagram';

export interface BaseBlock {
    id: string;
    type: BlockType;
    createdAt: number;
    // Position & Size
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
    // Meta
    title?: string;
    locked?: boolean;
    // Search & Tagging
    tags?: string[];
    altText?: string;
}

export interface SectionBlock extends BaseBlock {
    type: 'section';
    sketchData?: SketchData;
    collapsed?: boolean;
    // Section-specific theming
    backgroundColor?: string;
    label?: string;
}

export interface TextBlock extends BaseBlock {
    type: 'text';
    // Rich text content (Tiptap JSON format)
    content: JSONContent | string;
    plainText?: string; // For search indexing
    fontSize?: number;
    fontFamily?: string;
    textAlign?: 'left' | 'center' | 'right';
    fontWeight?: 'normal' | 'bold';
    color?: string;
}

// Embed type for design tools and media platforms
export type EmbedType =
    | 'figma'      // Figma design files
    | 'figjam'     // FigJam boards
    | 'notion'     // Notion pages
    | 'miro'       // Miro boards
    | 'youtube'    // YouTube videos
    | 'loom'       // Loom videos
    | 'vimeo'      // Vimeo videos
    | 'generic';   // Generic iframe

export interface EmbedMetadata {
    title?: string;
    thumbnail?: string;
    aspectRatio?: '16:9' | '4:3' | '1:1' | 'auto';
}

export interface EmbedBlock extends BaseBlock {
    type: 'embed';
    url: string;
    embedType?: EmbedType;
    metadata?: EmbedMetadata;
}

export interface MediaBlock extends BaseBlock {
    type: 'media';
    src: string;
    alt?: string;
    objectFit?: 'cover' | 'contain' | 'fill';
}

// Markdown block - renders pasted markdown/AI text beautifully
export interface MarkdownBlock extends BaseBlock {
    type: 'markdown';
    content: string;
    renderMode?: 'prose' | 'compact';
}

// Diagram block - visualizes mermaid/flowchart/XML structures
export type DiagramType = 'mermaid' | 'flowchart' | 'auto';

export interface DiagramBlock extends BaseBlock {
    type: 'diagram';
    source: string;
    diagramType?: DiagramType;
}

export type Block = SectionBlock | TextBlock | EmbedBlock | MediaBlock | MarkdownBlock | DiagramBlock;

// Theme
export type Theme = 'light' | 'dark';

// Active Tool State
export type ActiveTool = BlockType | 'select' | 'draw';
