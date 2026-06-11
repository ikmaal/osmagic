/**
 * Sync OSMAGIC batches + GeoJSON to Supabase for shared team access on GitHub Pages.
 */
class SupabaseSync {
    constructor() {
        this.client = null;
        this.enabled = false;
        this.workspaceId = 'osmagic-team';
        this._reloadTimer = null;
        this._onRemoteChange = null;
        this._channel = null;
    }

    isConfigured() {
        const cfg = window.OSMAGIC_SUPABASE_CONFIG;
        if (!cfg?.url || !cfg?.anonKey) return false;
        if (String(cfg.url).includes('YOUR_PROJECT')) return false;
        if (String(cfg.anonKey).includes('YOUR_ANON')) return false;
        return true;
    }

    async init() {
        if (!this.isConfigured()) {
            this.enabled = false;
            return false;
        }
        if (typeof supabase === 'undefined' || !supabase.createClient) {
            console.warn('Supabase JS library not loaded');
            this.enabled = false;
            return false;
        }
        const cfg = window.OSMAGIC_SUPABASE_CONFIG;
        this.workspaceId = cfg.workspaceId || 'osmagic-team';
        this.client = supabase.createClient(cfg.url, cfg.anonKey);
        this.enabled = true;
        return true;
    }

    onRemoteChange(callback) {
        this._onRemoteChange = callback;
    }

    subscribeRealtime() {
        if (!this.enabled || !this.client) return;
        if (this._channel) {
            this.client.removeChannel(this._channel);
            this._channel = null;
        }
        this._channel = this.client
            .channel(`osmagic-${this.workspaceId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'osmagic_batches' },
                () => this._scheduleRemoteReload()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'osmagic_app_state' },
                () => this._scheduleRemoteReload()
            )
            .subscribe();
    }

    unsubscribeRealtime() {
        if (this._channel && this.client) {
            this.client.removeChannel(this._channel);
            this._channel = null;
        }
    }

    _scheduleRemoteReload() {
        if (!this._onRemoteChange) return;
        clearTimeout(this._reloadTimer);
        this._reloadTimer = setTimeout(() => {
            this._onRemoteChange();
        }, 800);
    }

    async loadWorkspace() {
        if (!this.enabled) return null;

        const ws = this.workspaceId;

        const [{ data: stateRow, error: stateErr }, { data: batchRows, error: batchErr }] =
            await Promise.all([
                this.client
                    .from('osmagic_app_state')
                    .select('active_batch_id, current_index, current_view')
                    .eq('workspace_id', ws)
                    .maybeSingle(),
                this.client
                    .from('osmagic_batches')
                    .select('*')
                    .eq('workspace_id', ws)
                    .order('created_at', { ascending: true })
            ]);

        if (stateErr) throw stateErr;
        if (batchErr) throw batchErr;

        if (!batchRows?.length && !stateRow) {
            return null;
        }

        const batches = (batchRows || []).map(row => ({
            id: row.id,
            label: row.label || 'Import',
            createdAt: row.created_at || new Date().toISOString(),
            currentIndex: row.current_index ?? 0,
            currentView: row.current_view || 'all',
            geojson: row.geojson || { type: 'FeatureCollection', features: [] },
            sequences: (row.sequences_meta || []).map(s => ({
                id: s.id,
                status: s.status ?? '',
                reviewedBy: s.reviewedBy ?? ''
            }))
        }));

        return {
            activeBatchId: stateRow?.active_batch_id ?? batches[0]?.id ?? null,
            currentIndex: stateRow?.current_index ?? 0,
            currentView: stateRow?.current_view || 'all',
            batches
        };
    }

    async saveWorkspace(taskData, importBatches) {
        if (!this.enabled) return;

        const ws = this.workspaceId;
        const now = new Date().toISOString();

        const stateRow = {
            workspace_id: ws,
            active_batch_id: taskData.activeBatchId || null,
            current_index: taskData.currentIndex ?? 0,
            current_view: taskData.currentView || 'all',
            updated_at: now
        };

        const batchRows = importBatches.map(b => ({
            workspace_id: ws,
            id: b.id,
            label: b.label || 'Import',
            created_at: b.createdAt || now,
            current_index: b.currentIndex ?? 0,
            current_view: b.currentView || 'all',
            geojson: b.geojson || { type: 'FeatureCollection', features: [] },
            sequences_meta: (b.sequences || []).map(seq => ({
                id: seq.id,
                status: seq.status ?? '',
                reviewedBy: seq.reviewedBy || ''
            })),
            updated_at: now
        }));

        const { error: stateErr } = await this.client
            .from('osmagic_app_state')
            .upsert(stateRow, { onConflict: 'workspace_id' });
        if (stateErr) throw stateErr;

        if (batchRows.length === 0) {
            const { error: delErr } = await this.client
                .from('osmagic_batches')
                .delete()
                .eq('workspace_id', ws);
            if (delErr) throw delErr;
            return;
        }

        const { error: batchErr } = await this.client
            .from('osmagic_batches')
            .upsert(batchRows, { onConflict: 'workspace_id,id' });
        if (batchErr) throw batchErr;

        const keepIds = batchRows.map(r => r.id);
        const { data: existing, error: listErr } = await this.client
            .from('osmagic_batches')
            .select('id')
            .eq('workspace_id', ws);
        if (listErr) throw listErr;

        const toDelete = (existing || [])
            .map(r => r.id)
            .filter(id => !keepIds.includes(id));

        if (toDelete.length) {
            const { error: delErr } = await this.client
                .from('osmagic_batches')
                .delete()
                .eq('workspace_id', ws)
                .in('id', toDelete);
            if (delErr) throw delErr;
        }
    }

    async deleteBatch(batchId) {
        if (!this.enabled || !batchId) return;
        const { error } = await this.client
            .from('osmagic_batches')
            .delete()
            .eq('workspace_id', this.workspaceId)
            .eq('id', batchId);
        if (error) throw error;
    }

    async clearWorkspace() {
        if (!this.enabled) return;
        const ws = this.workspaceId;
        await Promise.all([
            this.client.from('osmagic_batches').delete().eq('workspace_id', ws),
            this.client.from('osmagic_app_state').delete().eq('workspace_id', ws)
        ]);
    }
}

const supabaseSync = new SupabaseSync();
