import { defineCommand } from 'citty';
import consola from 'consola';
import { drop, createSchema } from '../lib/db.js';

export default defineCommand({
  meta: { description: 'Drop and recreate the database schema' },
  async run() {
    drop();
    consola.info('Dropped existing schema');
    createSchema();
    consola.success('Schema created');
  },
});
