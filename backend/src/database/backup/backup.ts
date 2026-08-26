/**
 * Development database SNAPSHOT tool — non-destructive.
 *
 * Exports every business collection to timestamped JSON files so the
 * pre-reset state can always be inspected or restored manually.
 *
 * Run with:  npm run backup --workspace=backend
 *
 * NEVER points at production: it reads whatever MONGODB_URI is set in
 * backend/.env (the development database).
 */

import * as mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/soloflow';

const COLLECTIONS = [
  'users',
  'clients',
  'projects',
  'proposals',
  'invoices',
  'activities',
  'calendarevents',
  'subscriptions',
  'aiusages',
];

async function backup() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected:', MONGODB_URI);

  const db = mongoose.connection.db!;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join(__dirname, '../../../database-backups', stamp);
  fs.mkdirSync(outDir, { recursive: true });

  const summary: Record<string, number> = {};
  for (const name of COLLECTIONS) {
    const coll = db.collection(name);
    const docs = await coll.find({}).toArray();
    summary[name] = docs.length;
    if (docs.length > 0) {
      const file = path.join(outDir, `${name}.json`);
      fs.writeFileSync(
        file,
        JSON.stringify(docs, (_k, v) => (typeof v === 'bigint' ? String(v) : v), 2),
        'utf8',
      );
    }
  }

  fs.writeFileSync(
    path.join(outDir, '_manifest.json'),
    JSON.stringify({ createdAt: new Date().toISOString(), uri: MONGODB_URI, counts: summary }, null, 2),
    'utf8',
  );

  console.log('📦 Snapshot written to:', outDir);
  console.table(summary);

  await mongoose.disconnect();
  console.log('✅ Backup complete (no data was modified)');
}

backup().catch((err) => {
  console.error('❌ Backup failed:', err);
  process.exit(1);
});
