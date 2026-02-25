import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Block, BlockType, SectionBlock, TextBlock, EmbedBlock, MediaBlock, MarkdownBlock, DiagramBlock, Theme, ActiveTool } from '@/types/blocks';
import type { SketchData, SketchSettings, SketchTool } from '@/types/sketch';

interface EditorStore {
    blocks: Block[];
    selectedBlockId: string | null;
    theme: Theme;

    // Centralized Tool State (fixes Phase 1)
    activeTool: ActiveTool;
    sketchSettings: SketchSettings;

    // Search State (Phase 5)
    searchQuery: string;
    searchOpen: boolean;

    // Actions
    addBlock: (type: BlockType, position?: { x: number; y: number }) => string;
    updateBlock: <T extends Block>(id: string, updates: Partial<T>) => void;
    updateSketchData: (id: string, sketchData: SketchData) => void;
    deleteBlock: (id: string) => void;
    selectBlock: (id: string | null) => void;
    duplicateBlock: (id: string) => void;

    // Tool Actions (Phase 1)
    setActiveTool: (tool: ActiveTool) => void;
    setSketchTool: (tool: SketchTool) => void;
    updateSketchSettings: (updates: Partial<SketchSettings>) => void;

    // Positioning & Layering
    moveBlock: (id: string, x: number, y: number) => void;
    resizeBlock: (id: string, width: number, height: number) => void;
    bringToFront: (id: string) => void;
    sendToBack: (id: string) => void;
    bringForward: (id: string) => void;
    sendBackward: (id: string) => void;

    // Theme
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;

    // Search (Phase 5)
    setSearchQuery: (query: string) => void;
    setSearchOpen: (open: boolean) => void;
    searchBlocks: () => Block[];

    // Utils
    clearAll: () => void;
    exportBlocks: () => Block[];
    importBlocks: (blocks: Block[]) => void;
}

let zIndexCounter = 1;

const defaultSketchSettings: SketchSettings = {
    tool: 'pen',
    color: '#ffffff',
    strokeWidth: 4,
    opacity: 1,
    pressureSensitivity: 0.8,
    smoothing: 0.5,
    tiltEnabled: true,
    nibAngle: 45,
};

function createBlock(type: BlockType, position?: { x: number; y: number }): Block {
    const base = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        x: position?.x ?? 100,
        y: position?.y ?? 100,
        zIndex: zIndexCounter++,
    };

    switch (type) {
        case 'section':
            return {
                ...base,
                type: 'section',
                x: 0, // Sections always start at x=0
                width: 9999, // Full width (will be constrained by container)
                height: 400,
                collapsed: false,
                backgroundColor: undefined,
                label: '',
            } as SectionBlock;
        case 'text':
            return {
                ...base,
                type: 'text',
                width: 400,
                height: 150,
                content: '', // Will be JSONContent when edited
                plainText: '',
                fontSize: 16,
                fontFamily: 'sans-serif',
                textAlign: 'left',
                fontWeight: 'normal',
            } as TextBlock;
        case 'embed':
            return {
                ...base,
                type: 'embed',
                width: 500,
                height: 300,
                url: '',
                embedType: 'generic',
            } as EmbedBlock;
        case 'media':
            return {
                ...base,
                type: 'media',
                width: 400,
                height: 300,
                src: '',
                objectFit: 'cover',
            } as MediaBlock;
        case 'markdown':
            return {
                ...base,
                type: 'markdown',
                width: 500,
                height: 200,
                content: '',
                renderMode: 'prose',
            } as MarkdownBlock;
        case 'diagram':
            return {
                ...base,
                type: 'diagram',
                width: 600,
                height: 400,
                source: '',
                diagramType: 'auto',
            } as DiagramBlock;
    }
}

// Helper to extract plain text from block for search
function getBlockSearchText(block: Block): string {
    const parts: string[] = [];

    if (block.title) parts.push(block.title);
    if (block.altText) parts.push(block.altText);
    if (block.tags) parts.push(...block.tags);

    switch (block.type) {
        case 'text':
            if ((block as TextBlock).plainText) {
                parts.push((block as TextBlock).plainText!);
            } else if (typeof (block as TextBlock).content === 'string') {
                parts.push((block as TextBlock).content as string);
            }
            break;
        case 'section':
            if ((block as SectionBlock).label) parts.push((block as SectionBlock).label!);
            break;
        case 'markdown':
            parts.push((block as MarkdownBlock).content);
            break;
        case 'embed':
            parts.push((block as EmbedBlock).url);
            break;
    }

    return parts.join(' ').toLowerCase();
}

export const useEditorStore = create<EditorStore>()(
    persist(
        (set, get) => ({
            blocks: [],
            selectedBlockId: null,
            theme: 'dark',
            activeTool: 'select',
            sketchSettings: defaultSketchSettings,
            searchQuery: '',
            searchOpen: false,

            addBlock: (type, position) => {
                const newBlock = createBlock(type, position);
                set((state) => ({
                    blocks: [...state.blocks, newBlock],
                    selectedBlockId: newBlock.id,
                }));
                return newBlock.id;
            },

            updateBlock: (id, updates) => {
                set((state) => ({
                    blocks: state.blocks.map((b) =>
                        b.id === id ? { ...b, ...updates } : b
                    ),
                }));
            },

            updateSketchData: (id, sketchData) => {
                set((state) => ({
                    blocks: state.blocks.map((b) =>
                        b.id === id ? { ...b, sketchData } : b
                    ),
                }));
            },

            deleteBlock: (id) => {
                set((state) => ({
                    blocks: state.blocks.filter((b) => b.id !== id),
                    selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
                }));
            },

            selectBlock: (id) => set({ selectedBlockId: id }),

            duplicateBlock: (id) => {
                const block = get().blocks.find(b => b.id === id);
                if (!block) return;

                const newBlock = {
                    ...block,
                    id: crypto.randomUUID(),
                    createdAt: Date.now(),
                    x: block.x + 20,
                    y: block.y + 20,
                    zIndex: zIndexCounter++,
                };

                set((state) => ({
                    blocks: [...state.blocks, newBlock as Block],
                    selectedBlockId: newBlock.id,
                }));
            },

            // Tool Actions
            setActiveTool: (tool) => set({ activeTool: tool }),

            setSketchTool: (tool) => {
                set((state) => ({
                    activeTool: 'draw',
                    sketchSettings: { ...state.sketchSettings, tool },
                }));
            },

            updateSketchSettings: (updates) => {
                set((state) => ({
                    sketchSettings: { ...state.sketchSettings, ...updates },
                }));
            },

            moveBlock: (id, x, y) => {
                set((state) => ({
                    blocks: state.blocks.map((b) =>
                        b.id === id ? { ...b, x, y } : b
                    ),
                }));
            },

            resizeBlock: (id, width, height) => {
                set((state) => ({
                    blocks: state.blocks.map((b) =>
                        b.id === id ? { ...b, width: Math.max(50, width), height: Math.max(50, height) } : b
                    ),
                }));
            },

            bringToFront: (id) => {
                const maxZ = Math.max(...get().blocks.map(b => b.zIndex), 0);
                set((state) => ({
                    blocks: state.blocks.map((b) =>
                        b.id === id ? { ...b, zIndex: maxZ + 1 } : b
                    ),
                }));
            },

            sendToBack: (id) => {
                const minZ = Math.min(...get().blocks.map(b => b.zIndex), 0);
                set((state) => ({
                    blocks: state.blocks.map((b) =>
                        b.id === id ? { ...b, zIndex: minZ - 1 } : b
                    ),
                }));
            },

            bringForward: (id) => {
                const block = get().blocks.find(b => b.id === id);
                if (!block) return;
                const above = get().blocks
                    .filter(b => b.zIndex > block.zIndex)
                    .sort((a, b) => a.zIndex - b.zIndex)[0];
                if (above) {
                    set((state) => ({
                        blocks: state.blocks.map((b) => {
                            if (b.id === id) return { ...b, zIndex: above.zIndex };
                            if (b.id === above.id) return { ...b, zIndex: block.zIndex };
                            return b;
                        }),
                    }));
                }
            },

            sendBackward: (id) => {
                const block = get().blocks.find(b => b.id === id);
                if (!block) return;
                const below = get().blocks
                    .filter(b => b.zIndex < block.zIndex)
                    .sort((a, b) => b.zIndex - a.zIndex)[0];
                if (below) {
                    set((state) => ({
                        blocks: state.blocks.map((b) => {
                            if (b.id === id) return { ...b, zIndex: below.zIndex };
                            if (b.id === below.id) return { ...b, zIndex: block.zIndex };
                            return b;
                        }),
                    }));
                }
            },

            setTheme: (theme) => set({ theme }),
            toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

            // Search
            setSearchQuery: (query) => set({ searchQuery: query }),
            setSearchOpen: (open) => set({ searchOpen: open }),

            searchBlocks: () => {
                const { blocks, searchQuery } = get();
                if (!searchQuery.trim()) return [];

                const query = searchQuery.toLowerCase();
                return blocks.filter(block =>
                    getBlockSearchText(block).includes(query)
                );
            },

            clearAll: () => set({ blocks: [], selectedBlockId: null }),
            exportBlocks: () => get().blocks,
            importBlocks: (blocks) => {
                zIndexCounter = Math.max(...blocks.map(b => b.zIndex), 0) + 1;
                set({ blocks, selectedBlockId: null });
            },
        }),
        {
            name: 'kirukal-canvas-v4', // Bump version for new schema
        }
    )
);
