import { getChildId } from './db.js';

export const LOGIN_URL = 'https://eliis.eu/auth/login';


export function diaryUrl() {
  return `https://eliis.eu/child/${getChildId()}/diary`;
}

export function mapsUrl() {
  return `https://eliis.eu/child/${getChildId()}/maps`;
}

export function extractChildId(url) {
  const match = url.match(/eliis\.eu\/child\/([^/]+)\/diary/);
  return match ? match[1] : null;
}
