import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const urlFixes = [
  { name: 'Christian Medical College', website: 'https://www.cmcvellore.ac.in' },
  { name: 'Jadavpur University', website: 'https://jadavpuruniversity.in' },
];

const fixUrls = async () => {
  console.log('🔧 Fixing broken college website URLs...\n');

  for (const fix of urlFixes) {
    const { data, error } = await supabase
      .from('colleges')
      .update({ website: fix.website })
      .eq('name', fix.name)
      .select('name, website');

    if (error) {
      console.error(`❌ Failed to update ${fix.name}: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log(`✅ ${fix.name} → ${fix.website}`);
    } else {
      console.log(`⚠️  ${fix.name} not found in DB`);
    }
  }

  console.log('\n🎉 URL fixes applied!');
  process.exit(0);
};

fixUrls().catch(err => {
  console.error('❌ Fix failed:', err);
  process.exit(1);
});
