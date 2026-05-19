# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Spec

See `project.md` for the full project specification, architecture, and planned subcommands.

## Commands

```bash
node eliis.js --help         # List subcommands
node eliis.js <subcommand>   # Run a subcommand
```

## Code Structure

- `eliis.js` — CLI entry point, subcommand registration
- `commands/` — one file per subcommand; keep thin, delegate to `lib/`
- `lib/db.js` — SQLite singleton (`db()`), schema management, all query helpers
- `lib/browser.js` — Playwright browser (`openBrowser(url)`)
- `lib/pages.js` — URL constants/builders and page-specific extraction logic

## Tech Stack

- **Node.js** with ES modules or CommonJS
- **Playwright** for browser automation (persistent Firefox profile)
- **SQLite** (`better-sqlite3`) for local persistence

## Playwright Notes

- Use a persistent browser context (`launchPersistentContext`) so the Firefox profile (cookies/session) is reused across runs
- Prefer `page.waitForSelector` / `page.waitForLoadState` over arbitrary sleeps
- Block unnecessary resource types (images, media) during scraping when page rendering isn't needed: `await page.route('**/*', route => route.resourceType() === 'image' ? route.abort() : route.continue())`

## SQLite Notes

- Use synchronous `better-sqlite3` API — avoids async complexity for CLI scripts
- Wrap bulk inserts in a transaction for performance
