/**
 * JournHive database restore.
 *
 * Restores collections from a backup folder created by scripts/backup.js
 * into the database pointed to by MONGO_URI.
 *
 * Usage:
 *   node scripts/restore.js backups/2026-06-02T14-05-00
 *
 * By default this performs an UPSERT (inserts missing docs, updates existing
 * ones by _id) so it is safe to run against a live database without wiping it.
 * Pass --wipe to drop each collection before restoring (full point-in-time
 * restore). --wipe will ask for confirmation unless --yes is also passed.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mongoose = require('mongoose');

async function main() {
  const args = process.argv.slice(2);
  const wipe = args.includes('--wipe');
  const skipConfirm = args.includes('--yes');
  const folderArg = args.find((a) => !a.startsWith('--'));

  if (!folderArg) {
    console.error('Usage: node scripts/restore.js <backup-folder> [--wipe] [--yes]');
    process.exit(1);
  }

  const dir = path.isAbsolute(folderArg)
    ? folderArg
    : path.join(__dirname, '..', folderArg);

  if (!fs.existsSync(dir)) {
    console.error(`Backup folder not found: ${dir}`);
    process.exit(1);
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is not set. Add it to server/.env first.');
    process.exit(1);
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  if (files.length === 0) {
    console.error('No .json collection files found in backup folder.');
    process.exit(1);
  }

  console.log(`Restoring into: ${uri.replace(/\/\/[^@]+@/, '//<redacted>@')}`);
  console.log(`From: ${dir}`);
  console.log(`Mode: ${wipe ? 'WIPE + restore (destructive)' : 'upsert (non-destructive)'}\n`);

  if (wipe && !skipConfirm) {
    const ok = await confirm('This will DROP existing collections before restoring. Continue? (yes/no) ');
    if (!ok) {
      console.log('Aborted.');
      process.exit(0);
    }
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
  const db = mongoose.connection.db;

  let total = 0;
  for (const file of files) {
    const name = path.basename(file, '.json');
    const docs = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const col = db.collection(name);

    if (wipe) {
      await col.deleteMany({});
    }

    if (docs.length > 0) {
      const ops = docs.map((doc) => ({
        replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true },
      }));
      await col.bulkWrite(ops, { ordered: false });
    }
    total += docs.length;
    console.log(`  ${name}: restored ${docs.length} documents`);
  }

  await mongoose.disconnect();
  console.log(`\nRestore complete: ${total} documents.`);
}

function confirm(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'yes');
    });
  });
}

main().catch((err) => {
  console.error('Restore failed:', err.message);
  process.exit(1);
});
