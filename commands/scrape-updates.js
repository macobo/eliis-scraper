import { defineCommand } from 'citty';
import consola from 'consola';
import { requiresDb } from '../lib/db.js';
import { scrapeDiary } from './scrape-entries.js';
import { scrapeMedia } from './scrape-media.js';
import { dist } from './dist.js';

export default defineCommand({
  meta: { description: 'Scrape new entries, download media, and rebuild dist' },
  async run() {
    requiresDb();

    await scrapeDiary({ onlyNew: true });
    await scrapeMedia(1);
    dist('all');

    consola.success('All done.');
    process.exit(0);
  },
});
