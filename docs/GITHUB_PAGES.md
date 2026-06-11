# GitHub Pages deployment

The live site is built from the **`web/`** folder via GitHub Actions (see `.github/workflows/deploy-pages.yml`).

## One-time setup (repo owner)

1. Push this repository to GitHub (`main` branch).
2. Open the repo on GitHub → **Settings** → **Pages**.
3. Under **Build and deployment** → **Source**, choose **GitHub Actions** (not “Deploy from a branch”).
4. After the first push to `main`, open **Actions** and confirm **Deploy GitHub Pages** succeeds.

Your site URL will be:

`https://<github-username>.github.io/<repository-name>/`

Example: `https://ikmaal.github.io/osmagic/`

## Troubleshooting: site shows README instead of the app

That means Pages is publishing the **repository root** (Jekyll renders `README.md`), not the **`web/`** app.

**Fix (recommended):**

1. **Settings** → **Pages** → **Source** → select **GitHub Actions**.
2. **Actions** → run **Deploy GitHub Pages** (or push any commit to `main`).
3. When the workflow succeeds, open the URL shown on that run — the app loads at the repo root with no `/web/` in the path.

**Quick workaround** (if Source is still “Deploy from a branch” → `main` → `/ (root)`):

- Open `https://<user>.github.io/<repo>/web/` — the app lives in the `web/` folder.
- A root `index.html` in this repo redirects there automatically after you pull the latest `main`.

## What works on Pages

- Full UI: import traces, sequence list/table, status, reviewer, map preview (CDN tiles).
- Data is stored in each browser’s **IndexedDB** (not shared between users).

## What does not work on Pages alone

- **JOSM helper** (`tools/josm-helper.py`) — needs Python running locally; use `START-OSMAGIC.bat` on your machine for direct JOSM export.
- **Shared team database** — colleagues see the same app, not the same saved sequences (unless you add a backend later).

## Local development

```bash
py -3 server.py
```

Then open `http://localhost:8000`.
