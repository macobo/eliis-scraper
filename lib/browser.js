import { firefox } from 'playwright';
import path from 'path';

const PROFILE_PATH = path.resolve('./firefox-profile');

export async function openBrowser(url) {
  const context = await firefox.launchPersistentContext(PROFILE_PATH, { headless: false, args: ['--class=PlaywrightFF'] });
  const page = context.pages()[0] ?? await context.newPage();
  await page.route('**/*', route => {
    const type = route.request().resourceType();
    return (type === 'image' || type === 'media') ? route.abort() : route.continue();
  });
  await page.goto(url);
  return { context, page };
}
