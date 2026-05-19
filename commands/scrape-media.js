import fs from 'fs/promises';
import path from 'path';
import { defineCommand } from 'citty';
import consola from 'consola';
import { requiresDb, getPendingMediaCount, getNextPendingMedia, updateMediaLocalPaths } from '../lib/db.js';
import { sleep } from '../lib/util.js';

const MEDIA_DIR = 'dist/media';
const THUMB_DIR = 'dist/media/thumbnails';

const SLEEP_BETWEEN_ROWS_MS = 100; // ms

function filePath(date, dateIndex, url) {
  const ext = new URL(url).pathname.split('.').pop();
  return `${date}_${String(dateIndex).padStart(3, '0')}.${ext}`;
}

async function download(sourceUrl, destination) {
  try {
    await fs.access(destination);
    return false;
  } catch {}
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${sourceUrl}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length === 0) throw new Error(`Empty response for ${sourceUrl}`);
  await fs.writeFile(destination, buffer);
  return true
}

async function work(row) {
  const local_url = path.join(MEDIA_DIR, filePath(row.date, row.date_index, row.remote_url));
  const local_thumbnail_url = path.join(THUMB_DIR, filePath(row.date, row.date_index, row.thumbnail_url));
  const [mainWrite, thumbWrite] = await Promise.all([
    download(row.remote_url, local_url),
    download(row.thumbnail_url, local_thumbnail_url),
  ]);
  const write = mainWrite || thumbWrite;
  if (write) {
    await sleep(SLEEP_BETWEEN_ROWS_MS);
  }
  return { id: row.id, local_url, local_thumbnail_url };
}

async function worker(blacklist, stats) {
  while (true) {
    const row = getNextPendingMedia(blacklist);
    console.log(row)
    if (!row) break;
    try {
      const result = await work(row);
      updateMediaLocalPaths(result.id, result.local_url, result.local_thumbnail_url);
      stats.done++;
      consola.info(`${stats.done}/${stats.total} (blacklisted: ${blacklist.length})`);
    } catch (err) {
      consola.error(`Failed media ${row.id}`, err);
      blacklist.push(row.id);
    }
  }
}

export default defineCommand({
  meta: { description: 'Download media files for scraped entries' },
  args: {
    parallelism: { type: 'positional', description: 'Number of parallel downloads', default: '1' },
  },
  async run({ args }) {
    requiresDb();
    const parallelism = parseInt(args.parallelism, 10);

    await fs.mkdir(THUMB_DIR, { recursive: true });

    const blacklist = [];
    const stats = { done: 0, total: getPendingMediaCount() };
    consola.info(`Downloading ${stats.total} media items with parallelism ${parallelism}`);

    await Promise.all(Array.from({ length: parallelism }, () => worker(blacklist, stats)));

    consola.info('Done.');
  },
});
