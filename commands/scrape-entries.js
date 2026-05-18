import { defineCommand } from 'citty';
import consola from 'consola';
import { requiresDb } from '../lib/db.js';
import { openBrowser, isLoadMoreDiv, loadNextDiaryPage, ENTRY_SELECTOR } from '../lib/browser.js';
import { diaryUrl } from '../lib/pages.js';
import { waitForEnter, sleep } from '../lib/util.js';

async function cardContent(card) {
  return await card.evaluate(el => {
    const clone = el.cloneNode(true);
    clone.querySelector('#imagesCollapse')?.parentElement?.remove();
    clone.querySelector('.d-flex.align-items-center > button')?.parentElement?.remove();
    return clone.innerHTML;
  });
}

async function parseDiaryEntry(page, index) {
  const entry = page.locator(ENTRY_SELECTOR).nth(index);
  if (await isLoadMoreDiv(entry)) {
    return { type: 'load-more' };
  }

  const dateText = await entry.locator('.d-inline-flex > div').first().textContent();
  const date = dateText.trim().split('.').reverse().join('-');

  const cards = entry.locator('.card');
  const cardCount = await cards.count();
  if (cardCount < 2) {
    const html = await entry.innerHTML();
    consola.error(`Expected at least 2 cards at ${ENTRY_SELECTOR}[${index}], got ${cardCount}:\n${html}`);
    await waitForEnter();
    throw new Error(`Unexpected card count: ${cardCount}`);
  }
  const attendanceCard = cards.nth(0);

  const kid_status = (await attendanceCard.locator('i.mdi-check').count()) > 0 ? 'present' : 'missing';
  const kid_note = await attendanceCard.innerHTML();

  const contentParts = [];
  for (let i = 1; i < cardCount; i++) {
    const card = cards.nth(i);
    contentParts.push(await cardContent(card));
  }
  const content = contentParts.join('\n');

  if (contentParts > 1) {
    consola.warn('More than 2 content parts. Press Enter to continue')
    await waitForEnter();
  }

  return { type: 'entry', date, content, kid_status, kid_note };
}

async function loop(page, state) {
  state = state || { index: 0 }
  const entryResult = await parseDiaryEntry(page, state.index);

  consola.info(entryResult)

  if (entryResult.type === 'load-more') {
    consola.info('Reached end of currently loaded entries.');
    // await waitForEnter();
    await sleep(500);
    const loaded = await loadNextDiaryPage(page)
    if (!loaded) {
      consola.info('No more entries, stopping.')
      await waitForEnter()

      return { stop: true }
    }
    return state
  }

  const { date, kid_status } = entryResult;
  consola.info(`${date} (${state.index}): kid was ${kid_status}`);

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
