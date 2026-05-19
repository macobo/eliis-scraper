# eliis-scraper

ELIIS is the Estonian kindergarten information system — a web app where teachers log daily diary entries, attendance, photos, and developmental assessments for each child. It's genuinely nice software, but there's no export function. When my daughter leaves kindergarten, all of it disappears.

This scraper saves everything locally and builds a single static HTML page so she can look back on it someday. The intent is to back up the result to a durable medium — a hard drive, a printed book, whatever outlasts the web.

## What it does

- Scrapes diary entries (daily notes, attendance, photos/videos)
- Scrapes developmental assessment maps
- Downloads all media files locally
- Builds a self-contained `dist/index.html` — serve it with `python -m http.server` and browse offline

A few things that were fun to build:
- **GitHub-style activity bar** showing days present vs. absent across the full kindergarten period
- **Persistent Firefox profile** — log in once, run scrapes forever without re-authenticating
- **Keyboard shortcuts** in the gallery (`r` for random entry, `g` for random photo)

## Setup

```bash
git clone ...
npm install

node eliis.js clear    # initialise the database
node eliis.js login    # opens Firefox — log in and navigate to the diary page
```

## Scraping

```bash
node eliis.js scrape_entries   # scrape all diary entries
node eliis.js scrape_media     # download photos and videos
node eliis.js scrape_maps      # scrape developmental assessments
node eliis.js dist             # build dist/index.html
```

Or to pull only what's new:

```bash
node eliis.js scrape_updates
```

## Viewing

```bash
cd dist && python -m http.server
```
