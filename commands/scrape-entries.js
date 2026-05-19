import { defineCommand } from 'citty';
import consola from 'consola';
import { requiresDb, upsertEntry, upsertMedia } from '../lib/db.js';
import { openBrowser, isLoadMoreDiv, loadNextDiaryPage, exposeAllDiaryPictures, ENTRY_SELECTOR } from '../lib/browser.js';
import { diaryUrl } from '../lib/pages.js';
import { sleep } from '../lib/util.js';

async function parseMediaModal(page, date_index, entry_row) {
  const modal = page.locator('#view-media-file-modal');
  await modal.waitFor({ state: 'visible' });

  const title = (await modal.locator('.e3-modal-header span').textContent()).trim();
  const container = modal.locator('.e3-image-view-container');
  const remote_url = (await container.locator('img').count()) > 0
    ? await container.locator('img').getAttribute('src')
    : await container.locator('video').getAttribute('src');

  await modal.locator('.e3-modal-header button').click();
  await modal.waitFor({ state: 'hidden' });

  return { title, remote_url, date_index, entry_id: entry_row.id };
}

async function parseMedia(page, row, entryIndex) {
  await exposeAllDiaryPictures(page)
  const entry = page.locator(ENTRY_SELECTOR).nth(entryIndex);
  const thumbnails = entry.locator('#imagesCollapse .e3-image-thumbnail');
  const count = await thumbnails.count();
  consola.debug(`Entry ${entryIndex}: found ${count} media items`);
  const media = [];
  for (let i = 0; i < count; i++) {
    const thumbnail_url = await thumbnails.nth(i).evaluate(el => {
      const match = el.style.backgroundImage.match(/url\("([^"]+)"/);
      return match ? match[1] : null;
    });
    await thumbnails.nth(i).click();
    const item = await parseMediaModal(page, i, row);
    media.push({ ...item, thumbnail_url });
  }
  console.log(media)
  await sleep(300);
  return media;
}

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
    return { type: 'skip' }
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

  // if (contentParts > 1) {
  //   consola.warn('More than 2 content parts. Press Enter to continue')
  //   await waitForEnter();
  // }

  return { type: 'entry', date, content, kid_status, kid_note };
}

async function loop(state, options) {
  if (!state) {
    const { page } = await openBrowser(diaryUrl());
    await page.waitForSelector('.e3-guardian-diary');
    state = { index: 0, page }
  }

  const page = state.page
  const entryResult = await parseDiaryEntry(page, state.index);

  console.log(entryResult)

  if (entryResult.type === 'load-more') {
    consola.info('Reached end of currently loaded entries.');
    // await waitForEnter();
    await sleep(500);
    const loaded = await loadNextDiaryPage(page)
    if (!loaded) {
      consola.info('No more entries, stopping.')
      return { stop: true }
    }
    return state
  } else if (entryResult.type == 'skip') {
    consola.info(`$(${state.index}): skipping index`)
    return { index: state.index + 1, page }
  }

  const row = upsertEntry(entryResult);

  // Early exit - not a new entry
  if (options.onlyNew && row.updated) {
    return { stop: true }
  }

  let mediaStatus = 'did not record media'

  if (!row.updated) {
    const mediaRows = await parseMedia(page, row, state.index);
    upsertMedia(mediaRows);
    mediaStatus = `recorded ${mediaRows.length} media to download`
  }

  const { date, kid_status } = entryResult;
  consola.info(`${date} (${state.index}): kid was ${kid_status}, ${mediaStatus}`);
  await sleep(500);

  return { index: state.index + 1, page }
}

export async function scrapeDiary(options) {
  consola.info('Starting scraping diary.', options)

  let state = null
  while (!state || !state.stop) {
    state = await loop(state, options)
  }

  consola.success('Scraping diary done.');
}

export default defineCommand({
  meta: { description: 'Scrape diary entries from eliis.eu' },
  args: {
    only: { type: 'positional', description: "'all' or 'new'", default: 'all' },
  },
  async run({ args }) {
    requiresDb();

    const onlyNew = args.only === 'new';
    await scrapeDiary({ onlyNew });
    process.exit(0)
  },
});
