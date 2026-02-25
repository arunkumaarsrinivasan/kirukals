'use client';

import { useState, useEffect, useCallback } from 'react';
import { getConnections } from '@/lib/db';
import type { Connection, MediaItem } from '@/types/database';

export type ConnectionWithMedia = Connection & { media_items: MediaItem };

export function useConnections(entryId: string | null) {
    const [connections, setConnections] = useState<ConnectionWithMedia[]>([]);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        if (!entryId) return;
        setLoading(true);
        try {
            const data = await getConnections(entryId);
            setConnections(data as ConnectionWithMedia[]);
        } finally {
            setLoading(false);
        }
    }, [entryId]);

    useEffect(() => { load(); }, [load]);

    return { connections, loading, reload: load };
}
