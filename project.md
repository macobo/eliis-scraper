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

#### `child`

Should have single entry.

- child_id: string

#### `entries`

- id: automatic
- date: iso8601
- title: string
- content: text (raw html)
- kid_status: 'present' | 'missing'
- kid_note: text (optional)

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
3. Upsert id to `child` table

### `eliis.js scrape_entries`

Requires schema/database to be present and `child` table filled, early exit if not.

Open DIARY_PAGE (https://eliis.eu/child/{child_id}/diary)

Scrapes each date/entry:
- first creating the `entries` entry
- then appropriate `media` entries (in batch). Note that local_url is left blank as that's scraped in a later step.
- Logs something like `Scraped {date}. Kid was {kid_status}, {len(media)} media.

If reached the end of the page, click `Vaata vanemaid päevikuid` to load more entries.

TODO: Block media requests to keep the scraping cheap as possible.

### `eliis.js scrape_media`

Requires schema/database to be present and `child` table filled, early exit if not.

Logs progress, tracking done/total, updated after each scrape is done.

Run `mkdir -p build/media`.

For each entry in `media` table without local_url, download to `build/media/{iso8601_date}-{%000d-formatted-date_index}.{ext}` and update the entry.

### `eliis.js scrape_maps`

Requires schema/database to be present and `child` table filled, early exit if not.

Opens MAPS_PAGE. Early exit if login page, instruct to run `eliis.js login`

(Ex: https://eliis.eu/child/{child_id}/maps)

The page should contain a table with a bunch of 'maps'. Scrape each. Save content as raw html.

### `eliis.js dist`

Requires:
- Schema/database to be present
- >0 entries in entries table
- >0 entries with local_url in `media` table.

Builds the resulting HTML page in `dist/` folder. TODO.


### Open questions

- How to organize code into subcommands cleanly?
