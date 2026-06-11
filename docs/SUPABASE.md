# Supabase team sync (GitHub Pages)

GitHub Pages only hosts static files. **Supabase** is your shared database in the cloud. The app in the browser talks to Supabase directly—no server on GitHub required.

## 1. Create tables in Supabase

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **SQL Editor** → **New query**.
3. Paste the contents of [`supabase/schema.sql`](../supabase/schema.sql) and click **Run**.

If the last two lines about `supabase_realtime` fail, enable replication manually:

- **Database** → **Publications** → `supabase_realtime` → add `osmagic_batches` and `osmagic_app_state`.

## 2. Get API credentials

1. **Project Settings** → **API**
2. Copy **Project URL** (e.g. `https://abcdefgh.supabase.co`)
3. Copy **anon public** key (not the `service_role` secret)

## 3. Configure the app

Edit [`web/supabase-config.js`](../web/supabase-config.js):

```javascript
window.OSMAGIC_SUPABASE_CONFIG = {
    url: 'https://YOUR_PROJECT_REF.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    workspaceId: 'osmagic-team'   // same string for you and your colleague
};
```

- **`workspaceId`**: pick one name for your team. Everyone must use the **same** value.
- The anon key is meant to be used in the browser. **Never** put `service_role` in this file or commit it.

## 4. Deploy to GitHub Pages

Commit `supabase-config.js` with your real URL and anon key, then push to `main`. The existing Pages workflow deploys `web/` including this file.

After deploy, open your Pages URL. The sidebar should show **Team cloud connected**.

## 5. Share with your colleague

1. Send them the **Pages URL** (same app).
2. They use the **same** `supabase-config.js` values (already in the repo after you push).
3. When you upload a trace, it saves to Supabase. Your colleague opens the app or clicks **Refresh cloud** to see it.

Changes also sync automatically via Supabase Realtime (short delay).

## What is stored in Supabase

| Data | Stored |
|------|--------|
| Import batches (labels, ids) | Yes |
| GeoJSON per batch | Yes |
| Sequence status & reviewer | Yes |
| Active batch / view state | Yes |

IndexedDB still caches data locally for faster reloads.

## Security note

The included SQL uses **open RLS policies** so anyone with your anon key can read/write your workspace tables. That is acceptable for a small trusted team if you keep the repo private and rotate keys if needed.

For production, add [Supabase Auth](https://supabase.com/docs/guides/auth) and restrict policies to signed-in users.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| “Local only — add Supabase config” | Fill in `supabase-config.js` and redeploy |
| “Cloud save failed” | Run `schema.sql`; check browser console for RLS errors |
| Colleague sees old data | Click **Refresh cloud** or wait for realtime (~1s) |
| Large files fail to save | Very large GeoJSON may hit size limits; split imports or use Storage later |
