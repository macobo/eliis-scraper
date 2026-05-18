import { firefox } from 'playwright';
import path from 'path';

const PROFILE_PATH = path.resolve('./firefox-profile');

export async function openBrowser({ headless = false } = {}) {
  const context = await firefox.launchPersistentContext(PROFILE_PATH, {
    headless,
  });
  const page = await context.newPage();
  await page.route('**/*', route =>
    route.resourceType() === 'image' ? route.abort() : route.continue()
  );
  return { context, page };
}
