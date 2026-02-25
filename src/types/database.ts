// Full TypeScript types for Supabase database schema
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
    public: {
        Tables: {
            diary_entries: {
                Row: {
                    id: string;
                    title: string | null;
                    content: Json | null;
                    plain_text: string | null;
                    tags: string[] | null;
                    entry_type: 'diary' | 'case_study' | 'sketch' | 'note';
                    layout_mode: 'single' | 'double';
                    page_image_url: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['diary_entries']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['diary_entries']['Insert']>;
            };
            media_items: {
                Row: {
                    id: string;
                    type: 'image' | 'video' | 'link' | 'sketch' | 'embed' | 'sketch_component';
                    url: string;
                    title: string | null;
                    description: string | null;
                    thumbnail_url: string | null;
                    og_data: Json | null;
                    // For sketch components detected by AI
                    parent_page_id: string | null;
                    bounding_box: Json | null; // { x, y, width, height } relative to parent page
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['media_items']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['media_items']['Insert']>;
            };
            connections: {
                Row: {
                    id: string;
                    entry_id: string;
                    media_id: string;
                    span_text: string | null;
                    connection_type: 'hover' | 'click' | 'sidebar';
                    position_hint: 'left' | 'right' | 'float' | null;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['connections']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['connections']['Insert']>;
            };
        };
    };
}

// Convenience row types
export type DiaryEntry = Database['public']['Tables']['diary_entries']['Row'];
export type MediaItem = Database['public']['Tables']['media_items']['Row'];
export type Connection = Database['public']['Tables']['connections']['Row'];

// Sketch region detected by AI
export interface SketchRegion {
    id: string;
    boundingBox: { x: number; y: number; width: number; height: number };
    confidence: number;
    label?: string;
    approved?: boolean;
    thumbnailDataUrl?: string;
}
