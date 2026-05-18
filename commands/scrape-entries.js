import { defineCommand } from 'citty';
import consola from 'consola';
import { requiresDb } from '../lib/db.js';
import { openBrowser, isLoadMoreDiv, loadNextDiaryPage, ENTRY_SELECTOR } from '../lib/browser.js';
import { diaryUrl } from '../lib/pages.js';
import { waitForEnter } from '../lib/util.js';

async function parseDiaryEntry(page, index) {
  const entry = page.locator(ENTRY_SELECTOR).nth(index);
  if (await isLoadMoreDiv(entry)) {
    return { type: 'load-more' };
  }

  const dateText = await entry.locator('.d-inline-flex > div').first().textContent();
  const date = dateText.trim().split('.').reverse().join('-');

  const cards = entry.locator('.card');
  const attendanceCard = cards.nth(0);
  const diaryCard = cards.nth(1);

  const kid_status = (await attendanceCard.locator('i.mdi-check').count()) > 0 ? 'present' : 'missing';
  const kid_note = await attendanceCard.innerHTML();

  const title = (await diaryCard.locator('h6').textContent()).trim();
  const content = await diaryCard.locator('.e3-summary').innerHTML();

  return { type: 'entry', date, title, content, kid_status, kid_note };
}

async function loop(page, state) {
  state = state || { index: 0 }
  const entryResult = await parseDiaryEntry(page, state.index);

  console.log(entryResult)

  if (entryResult.type === 'load-more') {
    consola.info('Reached end of loaded entries.');
    await waitForEnter();
    const loaded = await loadNextDiaryPage(page)
    if (!loaded) {
      consola.info('No more entries, stopping.')
      await waitForEnter()
      return { stop: true }
    }
    return state
  }

  const { date, title, kid_status } = entryResult;
  consola.info(`${date} (${state.index}): ${title} — kid was ${kid_status}`);

  return { index: state.index + 1 }
}

export default defineCommand({
  meta: { description: 'Scrape diary entries from eliis.eu' },
  async run() {
    requiresDb();

    const { page } = await openBrowser(diaryUrl());
    await page.waitForSelector('.e3-guardian-diary');

    let state = null
    while (!state || !state.stop) {
      state = await loop(page, state)
    }

    process.exit(0)
  },
});
