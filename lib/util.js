import readline from 'readline';

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export function waitForEnter() {
  const rl = readline.createInterface({ input: process.stdin });
  return new Promise(resolve => rl.once('line', () => { rl.close(); resolve(); }));
}
