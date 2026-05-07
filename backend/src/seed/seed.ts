import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import colleges from './colleges.json';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const seedColleges = async () => {
  const { count } = await supabase.from('colleges').select('*', { count: 'exact', head: true });
  if (count && count > 0) {
    console.log('⚠️  Colleges already seeded, skipping...');
    return;
  }

  const { error } = await supabase.from('colleges').insert(colleges);
  if (error) {
    throw new Error(`Seed failed: ${error.message}`);
  }
  console.log(`✅ Seeded ${colleges.length} colleges`);
};

const main = async () => {
  try {
    console.log('🌱 Starting seed...');
    await seedColleges();
    console.log('🎉 Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

main();
