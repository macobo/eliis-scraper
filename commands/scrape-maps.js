import { defineCommand } from 'citty';
import consola from 'consola';
import { getChildId, requiresDb, upsertMap } from '../lib/db.js';
import { openBrowser } from '../lib/browser.js';
import { mapsUrl } from '../lib/pages.js';

export default defineCommand({
  meta: { description: 'Scrape maps from eliis.eu' },
  async run() {
    requiresDb();
    getChildId();

    const { page } = await openBrowser(mapsUrl());
    await page.waitForLoadState('networkidle');

    const rows = await page.evaluate(() =>
      Array.from(document.querySelectorAll('tbody tr')).map(tr => {
        const tds = tr.querySelectorAll('td');
        const link = tds[0]?.querySelector('a');
        return {
          title: link?.textContent?.trim() ?? '',
          dateText: tds[1]?.textContent?.trim() ?? '',
          href: link?.getAttribute('href') ?? '',
        };
      })
    );

    consola.info(`Found ${rows.length} maps to scrape`);

    for (const { title, dateText, href } of rows) {
      const date = dateText.split('.').reverse().join('-');
      await page.goto(`https://eliis.eu${href}`);
      await page.waitForLoadState('networkidle');

      const content = await page.locator('.template-view-wrap').first().innerHTML();
      upsertMap({ title, date, content });
      consola.info(`Scraped: ${title} (${date})`);
    }

    consola.info('Done.');
    process.exit(0);
  },
});
