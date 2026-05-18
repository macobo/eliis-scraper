import { firefox } from 'playwright';
import path from 'path';

const PROFILE_PATH = path.resolve('./firefox-profile');

export async function openBrowser(url) {
  const context = await firefox.launchPersistentContext(PROFILE_PATH, { headless: false });
  const page = context.pages()[0] ?? await context.newPage();
  await page.route('**/*', route =>
    route.resourceType() === 'image' ? route.abort() : route.continue()
  );
  await page.goto(url);
  return { context, page };
}
