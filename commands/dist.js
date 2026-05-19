import { defineCommand } from 'citty';
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, requiresDb } from '../lib/db.js';
import consola from 'consola';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function writeJSON() {
  requiresDb();

  const entries = db().prepare('SELECT * FROM entries ORDER BY date DESC').all();
  if (entries.length === 0) {
    consola.error('No entries found. Run scrape_entries first.');
    process.exit(1);
  }

  const allMedia = db().prepare(
    'SELECT entry_id, date_index, title, local_url, local_thumbnail_url FROM media WHERE local_url IS NOT NULL ORDER BY date_index ASC'
  ).all();
  if (allMedia.length === 0) {
    consola.error('No local media found. Run scrape_media first.');
    process.exit(1);
  }

  const mediaByEntryId = Map.groupBy(allMedia, m => m.entry_id);

  const diary_entries = entries.map(({ id, date, content, kid_status, kid_note }) => ({
    date,
    content,
    kid_status,
    kid_note,
    media: (mediaByEntryId.get(id) ?? []).map(({ title, local_url, local_thumbnail_url }) => ({
      title,
      local_url: local_url?.replace(/^dist\//, ''),
      local_thumbnail_url: local_thumbnail_url?.replace(/^dist\//, ''),
    })),
  }));

  const maps = db().prepare('SELECT date, title, content FROM maps ORDER BY date ASC').all();

  const dataPath = path.join(ROOT, 'frontend', 'src', 'data.json');
  writeFileSync(dataPath, JSON.stringify({ diary_entries, maps }, null, 2));
  consola.info(`Wrote data.json (${diary_entries.length} entries, ${allMedia.length} media, ${maps.length} maps)`);
}

function buildFrontend() {
  consola.info('Building frontend...');
  execSync('npm run build', {
    cwd: path.join(ROOT, 'frontend'),
    stdio: 'inherit',
  });
  consola.success('Built dist/index.html');
}

export default defineCommand({
  meta: { description: 'Build the static HTML output in dist/' },
  args: {
    mode: {
      type: 'positional',
      description: 'What to build: json | index.html | all',
      default: 'all',
      required: false,
    },
  },
  async run({ args }) {
    const { mode } = args;
    if (!['json', 'index.html', 'all'].includes(mode)) {
      consola.error(`Invalid mode "${mode}". Must be: json | index.html | all`);
      process.exit(1);
    }

    if (mode === 'json' || mode === 'all') writeJSON();
    if (mode === 'index.html' || mode === 'all') buildFrontend();
  },
});
