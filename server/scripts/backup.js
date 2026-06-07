/**
 * JournHive database backup.
 *
 * Exports every collection in the database pointed to by MONGO_URI into
 * timestamped JSON files under server/backups/<UTC-timestamp>/.
 *
 * Each file is a plain JSON array of documents and can be restored with
 *   node scripts/restore.js backups/<timestamp>
 *
 * Run manually:   npm run backup
 * Run on a schedule: see the cron example at the bottom of this file.
 *
 * No external tools (mongodump, etc.) are required — it uses the MongoDB
 * driver that ships with mongoose, which is already a dependency.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const RETENTION = parseInt(process.env.BACKUP_RETENTION || '30', 10); // keep this many backups

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is not set. Add it to server/.env first.');
    process.exit(1);
  }

  // Timestamp like 2026-06-02T14-05-00 (UTC, filesystem-safe).
  const stamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const backupRoot = path.join(__dirname, '..', 'backups');
  const outDir = path.join(backupRoot, stamp);
  fs.mkdirSync(outDir, { recursive: true });

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  let totalDocs = 0;
  for (const { name } of collections) {
    const docs = await db.collection(name).find({}).toArray();
    fs.writeFileSync(
      path.join(outDir, `${name}.json`),
      JSON.stringify(docs, null, 2)
    );
    totalDocs += docs.length;
    console.log(`  ${name}: ${docs.length} documents`);
  }

  await mongoose.disconnect();
  console.log(`\nBackup complete: ${totalDocs} documents across ${collections.length} collections`);
  console.log(`Saved to: ${path.relative(path.join(__dirname, '..'), outDir)}`);

  pruneOldBackups(backupRoot);
}

// Keep only the most recent RETENTION backups; delete older ones.
function pruneOldBackups(backupRoot) {
  if (!fs.existsSync(backupRoot)) return;
  const dirs = fs
    .readdirSync(backupRoot)
    .filter((d) => fs.statSync(path.join(backupRoot, d)).isDirectory())
    .sort(); // ISO timestamps sort chronologically

  const toDelete = dirs.slice(0, Math.max(0, dirs.length - RETENTION));
  for (const d of toDelete) {
    fs.rmSync(path.join(backupRoot, d), { recursive: true, force: true });
    console.log(`Pruned old backup: ${d}`);
  }
}

main().catch((err) => {
  console.error('Backup failed:', err.message);
  process.exit(1);
});

/*
 * Schedule a daily backup (macOS / Linux). Run `crontab -e` and add:
 *
 *   0 3 * * *  cd /path/to/journhive/server && /usr/bin/node scripts/backup.js >> backups/backup.log 2>&1
 *
 * That runs every day at 3am. Backups older than BACKUP_RETENTION (default 30)
 * are pruned automatically.
 */
