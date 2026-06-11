# Repository layout

| Path | Purpose |
|------|---------|
| **`web/`** | Frontend: `index.html`, `app.js`, styles, task-manager UI, favicon |
| **`tools/`** | Python utilities: `josm-helper.py` (JOSM bridge), `prompt_tracker.py` |
| **`docs/`** | Guides, troubleshooting, prompt-tracking docs |
| **`data/`** | Local data (e.g. `prompt_history.json` for the tracker) |
| **`archive/`** | Old bundles, backups, scratch files (not required to run the app) |
| **`exports/`** | OSM files written when exporting locally (gitignored) |
| **`server.py`** | Local dev server: serves `web/` at `http://localhost:8000` |
| **`START-OSMAGIC.bat`** | Windows launcher: JOSM + helper + browser |

Run the app locally from the repo root:

```bash
python server.py
```

Run the JOSM helper only:

```bash
python tools/josm-helper.py
```

## GitHub Pages

If you publish this repo with GitHub Pages from the default branch, set the **publishing folder** to **`/web`** so `index.html` is the site entry point.
