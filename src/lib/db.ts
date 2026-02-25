import { supabase } from './supabase';
import type { DiaryEntry, MediaItem, Connection } from '@/types/database';

// ─── Diary Entries ───────────────────────────────────────────────────────────

export async function getEntries() {
    const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as DiaryEntry[];
}

export async function getEntry(id: string) {
    const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('id', id)
        .single();
    if (error) throw error;
    return data as DiaryEntry;
}

export async function createEntry(entry: {
    title?: string | null;
    content?: object | null;
    plain_text?: string | null;
    tags?: string[];
    entry_type?: string;
    layout_mode?: string;
    page_image_url?: string | null;
}) {
    const { data, error } = await supabase
        .from('diary_entries')
        .insert(entry)
        .select()
        .single();
    if (error) throw error;
    return data as DiaryEntry;
}

export async function updateEntry(id: string, updates: Partial<DiaryEntry>) {
    const { data, error } = await supabase
        .from('diary_entries')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data as DiaryEntry;
}

export async function deleteEntry(id: string) {
    const { error } = await supabase.from('diary_entries').delete().eq('id', id);
    if (error) throw error;
}

// ─── Media Items ─────────────────────────────────────────────────────────────

export async function getMediaItems(ids?: string[]) {
    let query = supabase.from('media_items').select('*');
    if (ids?.length) query = query.in('id', ids);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as MediaItem[];
}

export async function createMediaItem(item: {
    type: string;
    url: string;
    title?: string | null;
    description?: string | null;
    thumbnail_url?: string | null;
    og_data?: object | null;
    parent_page_id?: string | null;
    bounding_box?: object | null;
}) {
    const { data, error } = await supabase
        .from('media_items')
        .insert(item)
        .select()
        .single();
    if (error) throw error;
    return data as MediaItem;
}

export async function deleteMediaItem(id: string) {
    const { error } = await supabase.from('media_items').delete().eq('id', id);
    if (error) throw error;
}

// ─── Connections ─────────────────────────────────────────────────────────────

export async function getConnections(entryId: string) {
    const { data, error } = await supabase
        .from('connections')
        .select(`*, media_items(*)`)
        .eq('entry_id', entryId);
    if (error) throw error;
    return (data ?? []) as (Connection & { media_items: MediaItem })[];
}

export async function createConnection(conn: {
    entry_id: string;
    media_id: string;
    span_text?: string | null;
    connection_type?: string;
    position_hint?: string | null;
}) {
    const { data, error } = await supabase
        .from('connections')
        .insert(conn)
        .select()
        .single();
    if (error) throw error;
    return data as Connection;
}

export async function deleteConnection(id: string) {
    const { error } = await supabase.from('connections').delete().eq('id', id);
    if (error) throw error;
}

// ─── Supabase Storage (for images) ───────────────────────────────────────────

export async function uploadPageImage(file: Blob, path: string): Promise<string> {
    const { error } = await supabase.storage
        .from('diary-pages')
        .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('diary-pages').getPublicUrl(path);
    return data.publicUrl;
}

export async function uploadSketchComponent(blob: Blob, path: string): Promise<string> {
    const { error } = await supabase.storage
        .from('sketch-components')
        .upload(path, blob, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('sketch-components').getPublicUrl(path);
    return data.publicUrl;
}
