#!/usr/bin/env node
import { defineCommand, runMain } from 'citty';

const main = defineCommand({
  meta: { name: 'eliis', description: 'Eliis kindergarten scraper' },
  subCommands: {
    clear:          () => import('./commands/clear.js').then(r => r.default),
    login:          () => import('./commands/login.js').then(r => r.default),
    scrape_entries: () => import('./commands/scrape-entries.js').then(r => r.default),
    scrape_media:   () => import('./commands/scrape-media.js').then(r => r.default),
    scrape_maps:    () => import('./commands/scrape-maps.js').then(r => r.default),
    scrape_updates: () => import('./commands/scrape-updates.js').then(r => r.default),
    dist:           () => import('./commands/dist.js').then(r => r.default),
  },
});

runMain(main);
