import readline from 'readline';

export function waitForEnter() {
  const rl = readline.createInterface({ input: process.stdin });
  return new Promise(resolve => rl.once('line', () => { rl.close(); resolve(); }));
}
