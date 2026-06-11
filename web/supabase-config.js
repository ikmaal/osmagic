/**
 * Supabase connection — replace placeholders before deploying to GitHub Pages.
 * The anon key is safe to expose in the browser when RLS is configured (see supabase/schema.sql).
 */
window.OSMAGIC_SUPABASE_CONFIG = {
    url: 'https://YOUR_PROJECT_REF.supabase.co',
    anonKey: 'YOUR_ANON_PUBLIC_KEY',
    workspaceId: 'osmagic-team'
};
