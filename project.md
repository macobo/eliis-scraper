# Eliisi scraper

## Goals

Save entries and information from eliis (kindergarden site) to a persistent data storage format so kid can later look back on it.

From a technical point of view, create a single index.html page that served from filesystem via e.g. python -m http.server allows
seeing all entries laid out + images.

## Scraper

Node.js scraper leveraging playwright to scrape the site. Features:
- Multiple sub-commands to facilitate operation
- A sqllite database to schedule work.
- Leverages a persistent firefox profile to avoid logging in each time scraper is started. Under `./firefox-profile/`
- Has useful logging system built in as well.

### Database schema

#### `config`

Should have single entry.

- key: string
- data: JSON

Currently only key is `child_id` and `data` would be json-encoded string.

#### `entries`

- id: automatic
- date: iso8601
- title: string
- content: text (raw html)
- kid_status: 'present' | 'missing'
- kid_note: text (optional)

Unique key on `date`

### `media`

- id: automatic
- entry_id: fk
- date_index: int
- title: string
- upload_note: text
- remote_url: string
- local_url: string, default null

### `maps`

- id: automatic
- title: string
- date: iso8601
- content: text (raw html)

### `eliis.js` and `eliis.js -h` and `eliis.js --help`

Outputs all subcommands with instructions.

### Auxilary: `eliis.js clear`

Drops existing database and re-creates the schema.

### `eliis.js login`

Requires schema/database to be present, early exit if not.

Opens a firefox page `https://eliis.eu/`. Tells user to log in and navigate to diary page and to press enter and waits for enter.

On enter:
1. grab the current url.
2. Check it's in the format `eliis.eu/child/{id}/diary`
3. Upsert to `config` table

### `eliis.js scrape_entries`

Requires schema/database to be present and `child_id` config filled, early exit if not.

Open DIARY_PAGE (https://eliis.eu/child/{child_id}/diary)

Scrapes each date/entry:
- first creating the `entries` entry
- then appropriate `media` entries (in batch). Note that local_url is left blank as that's scraped in a later step.
- Logs something like `Scraped {date}. Kid was {kid_status}, {len(media)} media.

If reached the end of the page, click `Vaata vanemaid päevikuid` to load more entries.

TODO: Block media requests to keep the scraping cheap as possible.

### `eliis.js scrape_media`

Requires schema/database to be present and `child_id` config filled, early exit if not.

Logs progress, tracking done/total, updated after each scrape is done.

Run `mkdir -p build/media`.

For each entry in `media` table without local_url, download to `build/media/{iso8601_date}-{%000d-formatted-date_index}.{ext}` and update the entry.

### `eliis.js scrape_maps`

Requires schema/database to be present and `child_id` config filled, early exit if not.

Opens MAPS_PAGE. Early exit if login page, instruct to run `eliis.js login`

(Ex: https://eliis.eu/child/{child_id}/maps)

The page should contain a table with a bunch of 'maps'. Scrape each. Save content as raw html.

### `eliis.js dist`

Requires:
- Schema/database to be present
- >0 entries in entries table
- >0 entries with local_url in `media` table.

Builds the resulting HTML page in `dist/` folder. TODO.


## Entry Parsing Strategy

Reference DOM: `lib/dom_snapshot_2.html` (single entry), `lib/dom_snapshot.html` (full page).

### Page structure

Entry rows are selected via `ENTRY_SELECTOR` (`browser.js`): `.e3-main-container > div > .e3-guardian-diary > div > div`. The `.e3-guardian-diary` is wrapped in two extra divs before the individual entry rows appear.

Each date-group row has two direct child divs:

1. **Date div** — contains `.d-inline-flex > div` whose text is `"DD.MM.YYYY"`. Convert to ISO8601: split on `.`, reverse, join with `-`.
2. **Cards container** — contains two `.card` divs.

### Card types

The cards container has two `.card` divs in a fixed order:

1. **Attendance card** (first `.card`):
   - `kid_status`: `'present'` if `i.mdi-check` exists, `'missing'` if `i.mdi-close`.
   - `kid_note`: innerHTML of the card (raw HTML, preserve as-is).
2. **Diary entry card** (second `.card`):
   - `title`: h6 text content (e.g. `"Päevakirjeldus - Sipsikud R04"`).
   - `content`: innerHTML of `.e3-summary` (raw HTML, preserve as-is). Some entries have multiple content sections inside `.e3-summary`; grabbing the whole element captures all of them.

A date group maps to one `entries` row.

### Media (future)

Inside the diary entry card, `#imagesCollapse` holds thumbnail divs. Full media info requires clicking each image — TODO.

### Scraping loop

Iterate over `ENTRY_SELECTOR` by index:

- **Detect type**: if the row contains the `"Vaata vanemaid päevikuid"` button it's the load-more row; otherwise it's a date-group.
- **Date-group**: parse and insert the entry, log, increment index.
- **Load-more row**: call `loadNextDiaryPage()`, which clicks the button and waits via `waitForFunction` until `ENTRY_SELECTOR` count increases (3 s timeout). Returns `false` if button absent; exit loop. Do not increment index — the row is replaced by new date-groups.

### Open questions

