# GitHub Pages deployment

The live site is built from the **`web/`** folder via GitHub Actions (see `.github/workflows/deploy-pages.yml`).

## One-time setup (repo owner)

1. Push this repository to GitHub (`main` branch).
2. Open the repo on GitHub → **Settings** → **Pages**.
3. Under **Build and deployment** → **Source**, choose **GitHub Actions** (not “Deploy from a branch”).
4. After the first push to `main`, open **Actions** and confirm **Deploy GitHub Pages** succeeds.

Your site URL will be:

`https://<github-username>.github.io/<repository-name>/`

Example: `https://yourname.github.io/osmagic/`

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
