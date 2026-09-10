/**
 * seedMongo.ts
 *
 * Seeds the MongoDB `colleges` collection from the existing JSON seed files.
 * Safe to call multiple times — skips if data already exists.
 * Also called automatically by server.ts on startup when collection is empty.
 */

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { College } from '../models/College';

const SEED1 = path.resolve(__dirname, './colleges.json');
const SEED2 = path.resolve(__dirname, './more_colleges.json');

export async function seedColleges(): Promise<void> {
  const count = await College.countDocuments();
  if (count > 0) {
    console.log(`✅ MongoDB already seeded with ${count} colleges — skipping.`);
    return;
  }

  let raw: any[] = [];
  try {
    const c1: any[] = JSON.parse(fs.readFileSync(SEED1, 'utf8'));
    const c2: any[] = JSON.parse(fs.readFileSync(SEED2, 'utf8'));
    const seen = new Set<string>();
    [...c1, ...c2].forEach((c) => {
      const key = c.name.toLowerCase().trim();
      if (!seen.has(key)) { seen.add(key); raw.push(c); }
    });
  } catch (e) {
    console.error('❌ Failed to read seed JSON:', e);
    return;
  }

  // Assign auto-increment IDs
  const colleges = raw.map((c, i) => ({ id: i + 1, ...c }));

  await College.insertMany(colleges, { ordered: false });
  console.log(`✅ Seeded ${colleges.length} colleges into MongoDB.`);
}

// Run standalone: ts-node src/seed/seedMongo.ts
if (require.main === module) {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/college_discovery';
  mongoose.connect(MONGODB_URI).then(async () => {
    console.log('Connected to MongoDB for seeding...');
    await seedColleges();
    await mongoose.disconnect();
    console.log('Done.');
  });
}
