import { firefox } from 'playwright';
import path from 'path';

const PROFILE_PATH = path.resolve('./firefox-profile');

const BUTTON_WAIT_TIMEOUT = 3000;

export const ENTRY_SELECTOR = '.e3-main-container > div > .e3-guardian-diary > div > div';

export async function exposeAllDiaryPictures(page) {
  let count = 0
  while (true) {
    const btn = page.getByRole('button', { name: 'Kuva rohkem' }).first();
    try {
      await btn.waitFor({ state: 'visible', timeout: BUTTON_WAIT_TIMEOUT });
    } catch {
      return count
    }
    await btn.click();
    count += 1
  }
}

function loadMoreButton(locator) {
  return locator.getByRole('button', { name: 'Vaata vanemaid päevikuid' });
}

export async function isLoadMoreDiv(locator) {
  return (await loadMoreButton(locator).count()) > 0;
}

export async function loadNextDiaryPage(page) {
  const btn = loadMoreButton(page);
  try {
    await btn.waitFor({ state: 'visible', timeout: BUTTON_WAIT_TIMEOUT });
  } catch {
    return false;
  }
  if (!await btn.isEnabled()) return false;
  const prevCount = await page.locator(ENTRY_SELECTOR).count();
  await btn.click();
  try {
    await page.waitForFunction(
      ({ sel, prev }) => document.querySelectorAll(sel).length > prev,
      { sel: ENTRY_SELECTOR, prev: prevCount },
      { timeout: BUTTON_WAIT_TIMEOUT }
    );
  } catch { /* timed out, continue anyway */ }
  return true;
}

export async function openBrowser(url) {
  const context = await firefox.launchPersistentContext(PROFILE_PATH, { headless: false, args: ['--class=PlaywrightFF'] });
  const page = context.pages()[0] ?? await context.newPage();
  await page.route('**/*', route => {
    const type = route.request().resourceType();
    return (type === 'image' || type === 'media') ? route.abort() : route.continue();
  });
  await page.goto(url);
  await page.addStyleTag({ content: `.e3-main-container .e3-image-thumbnail { width: 30px !important; height: 30px !important; background: red !important; }` });
  return { context, page };
}
