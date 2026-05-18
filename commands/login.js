import { defineCommand } from 'citty';
import consola from 'consola';
import { requiresDb, saveChildId } from '../lib/db.js';
import { openBrowser } from '../lib/browser.js';
import { LOGIN_URL, extractChildId } from '../lib/pages.js';
import { waitForEnter } from '../lib/util.js'

export default defineCommand({
  meta: { description: 'Open Firefox and log in to eliis.eu' },
  async run() {
    requiresDb();

    const { page } = await openBrowser(LOGIN_URL);

    consola.info('Please log in and navigate to the diary page, then press Enter');
    await waitForEnter();

    const url = page.url();
    consola.debug(`Current URL: ${url}`);

    const childId = extractChildId(url);
    if (!childId) {
      consola.error('URL does not match expected format eliis.eu/child/{id}/diary');
      process.exit(1);
    }

    saveChildId(childId);
    consola.success(`Saved child ID: ${childId}. You can now run scrape commands (scrape_entries, scrape_maps)`);
    process.exit(0)
  },
});
