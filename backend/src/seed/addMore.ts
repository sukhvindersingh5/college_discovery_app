import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import moreColleges from './more_colleges.json';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const addMoreColleges = async () => {
  // Get existing college names to avoid duplicates
  const { data: existing } = await supabase.from('colleges').select('name');
  const existingNames = new Set((existing || []).map((c: any) => c.name.toLowerCase().trim()));

  const newColleges = moreColleges.filter(
    c => !existingNames.has(c.name.toLowerCase().trim())
  );

  if (newColleges.length === 0) {
    console.log('⚠️  All colleges already exist, nothing to add.');
    return;
  }

  const { error } = await supabase.from('colleges').insert(newColleges);
  if (error) throw new Error(error.message);

  console.log(`✅ Added ${newColleges.length} new colleges`);

  const { count } = await supabase.from('colleges').select('*', { count: 'exact', head: true });
  console.log(`📊 Total colleges in DB: ${count}`);
};

const main = async () => {
  try {
    await addMoreColleges();
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err);
    process.exit(1);
  }
};

main();
