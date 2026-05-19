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
- content: text (raw html)
- kid_status: 'present' | 'missing'
- kid_note: text (optional)

Unique key on `date`

### `media`

- id: automatic
- entry_id: fk
- date_index: int
- title: string
- remote_url: string
- thumbnail_url: string,
- local_url: string, default null
- local_thumbnail_url, string default null

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

Requires schema/database to be present, early exit if not.

`eliis.js scrape_media [parallelism]` — parallelism defaults to 1.

#### Helpers

- `filePath(date, dateIndex, url)` — derives extension from the URL path (e.g. `.jpg`, `.mp4`) and returns `${date}_${dateIndex.toString().padStart(3, '0')}.${ext}`.
- `download(sourceUrl, destination)` — checks if `destination` already exists; if not, fetches `sourceUrl` and writes to `destination`.
- `work(row)` — computes local paths for both files, kicks off both downloads in parallel, returns `{ id: row.id, local_url, local_thumbnail_url }`.
  - Main file: `dist/media/${filePath(date, dateIndex, remote_url)}`
  - Thumbnail: `dist/media/thumbnails/${filePath(date, dateIndex, thumbnail_url)}`

#### Main loop

1. `mkdir -p dist/media/thumbnails`.
2. Initialise an in-memory `blacklist` Set (ids that failed this run).
3. Query: media rows (joined with entries for `date`) where `local_url IS NULL AND local_thumbnail_url IS NULL` and `id NOT IN blacklist`.
4. Maintain a pool of `parallelism` concurrent `work()` calls. When a slot frees up, pull one new row from the query and start it.
   - **On success**: update the row with `local_url` and `local_thumbnail_url`; log progress (`done/total`).
   - **On failure**: log the error, add `row.id` to blacklist.
   - Either way: fetch one more row and continue.
5. Stop when no rows remain and all slots are idle.

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

The cards container has one or more `.card` divs:

1. **Attendance card** (first `.card`):
   - `kid_status`: `'present'` if `i.mdi-check` exists, `'missing'` if `i.mdi-close`.
   - `kid_note`: innerHTML of the card (raw HTML, preserve as-is).
2. **Diary entry cards** (remaining `.card`s, one or more):
   - Each card contains an `h6` title and a `.e3-summary` content block.
   - `content`: concatenate all diary cards as raw HTML, each wrapped as:
     ```html
     <div><h6>…title…</h6><div class="e3-summary">…</div></div>
     ```

A date group maps to one `entries` row.

### Media parsing

Reference DOM: `lib/dom_snapshot_4.html` (image modal + video modal).

`parseMedia(page, entry, entryIndex)` iterates all `.e3-image-thumbnail` elements inside `#imagesCollapse` within the entry (across all diary cards). For each thumbnail:

1. Click it to open the modal (`#view-media-file-modal`).
2. Call `parseSingleMedia(page)` to extract fields.
3. Click the button containing `.mdi-close-circle` to close the modal.
4. Wait for the modal to disappear before proceeding.

Returns an array of media objects with `date_index` (simple counter starting at 0 across all thumbnails for the entry).

`parseSingleMedia(page)`:
- `title`: `.e3-modal-header span` textContent (trimmed) — numeric ID string, e.g. `"1778837787279"`.
- `remote_url`: `src` of `.e3-image-view-container img` for images, or `.e3-image-view-container video` for videos.

### Scraping loop

Iterate over `ENTRY_SELECTOR` by index:

- **Detect type**: if the row contains the `"Vaata vanemaid päevikuid"` button it's the load-more row; otherwise it's a date-group.
- **Date-group**: parse and insert the entry, log, increment index.
- **Load-more row**: call `loadNextDiaryPage()`, which clicks the button and waits via `waitForFunction` until `ENTRY_SELECTOR` count increases (3 s timeout). Returns `false` if button absent; exit loop. Do not increment index — the row is replaced by new date-groups.


## Resulting web page

### Requirements

Has two tabs: `Päevik` (diary) and `Kaardid`.

Single html page with minimal javascript. Everything (except images) is embedded inline, including scripts into a single index.html file?

Should be cleanly designed and easy to read. Use tailwind for CSS.

#### Päevik

- Github-like 'activity' bar at top showing days kid was present vs missing. Clicking on each data point jumps to that day.
- Sidebar is google photos like navigation for easy jumping
- Displays each day one-by-one, showing the inline html for each.

#### Maps

- Table listing all the maps, sorted by `date` ascending. Collapsible rows by default collapsed.
- Clicking on an entry opens the tab showing the inner content nested underneath

### Technical

Code under ./frontend/. Build step takes that code and generates a single index.html file with everything (except images) inlined.

data.json format:
{
  "diary_entries": List<{ date: str, content: str, kid_status: 'present' | 'missing', kid_note: str, media: List<{ title: str, local_url: str, local_thumbnail_url: str }>}>,
  "maps": List<{ date: str, title: str, content: str }>
}

Media for each date is ordered by date_index.
