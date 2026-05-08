import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Corrected course lists per college based on actual offerings
const courseFixes: { name: string; courses: string[] }[] = [
  // ── Engineering Colleges ──────────────────────────────────────────────────
  { name: 'IIT Bombay',         courses: ['B.Tech','M.Tech','PhD','MBA','MSc','BS'] },
  { name: 'IIT Delhi',          courses: ['B.Tech','M.Tech','PhD','MBA','MSc','BS'] },
  { name: 'IIT Madras',         courses: ['B.Tech','M.Tech','PhD','MSc','BS'] },
  { name: 'IIT Kanpur',         courses: ['B.Tech','M.Tech','PhD','MBA','MSc','BS'] },
  { name: 'IIT Kharagpur',      courses: ['B.Tech','M.Tech','PhD','MBA','MSc','LLB','BS'] },
  { name: 'IIT Roorkee',        courses: ['B.Tech','M.Tech','PhD','MBA','MCA','MSc','BS'] },
  { name: 'IIT Hyderabad',      courses: ['B.Tech','M.Tech','PhD','MBA','MSc','BS'] },
  { name: 'IIT Gandhinagar',    courses: ['B.Tech','M.Tech','PhD','MA','MSc','BS'] },
  { name: 'BITS Pilani',        courses: ['B.Tech','M.Tech','MBA','MSc','BCA','MCA','BE'] },
  { name: 'NIT Trichy',         courses: ['B.Tech','M.Tech','PhD','MBA','MCA','MSc'] },
  { name: 'NIT Warangal',       courses: ['B.Tech','M.Tech','PhD','MBA','MCA','MSc'] },
  { name: 'NIT Surathkal',      courses: ['B.Tech','M.Tech','PhD','MBA','MCA','MSc'] },
  { name: 'NIT Rourkela',       courses: ['B.Tech','M.Tech','MBA','PhD','MCA','MSc'] },
  { name: 'NIT Jaipur',         courses: ['B.Tech','M.Tech','MBA','PhD','MCA'] },
  { name: 'NIT Calicut',        courses: ['B.Tech','M.Tech','MBA','MCA','PhD','MSc'] },
  { name: 'IIIT Hyderabad',     courses: ['B.Tech','M.Tech','PhD','MS by Research','MSc'] },
  { name: 'Delhi Technological University', courses: ['B.Tech','M.Tech','MBA','PhD','BCA','MCA'] },
  { name: 'Thapar Institute of Engineering', courses: ['B.Tech','M.Tech','MBA','PhD','BCA','MCA','MSc'] },
  { name: 'Anna University',    courses: ['B.Tech','M.Tech','MBA','MCA','PhD','BE','ME','BSc'] },
  { name: 'VIT Vellore',        courses: ['B.Tech','M.Tech','MBA','MCA','PhD','BSc','BCA','MSc'] },
  { name: 'Vellore Institute of Technology - Chennai', courses: ['B.Tech','M.Tech','MBA','MCA','MSc','PhD','BCA'] },
  { name: 'Manipal Institute of Technology', courses: ['B.Tech','M.Tech','MBA','MCA','BCA','BSc','MSc'] },
  { name: 'SRM Institute of Science and Technology', courses: ['B.Tech','M.Tech','MBA','MCA','MBBS','PhD','BCA','BSc'] },
  { name: 'PSG College of Technology', courses: ['B.Tech','M.Tech','MBA','MCA','MSc','BCA'] },
  { name: 'KIIT University',    courses: ['B.Tech','MBA','LLB','MBBS','BBA','M.Tech','PhD','BCA','MCA'] },
  { name: 'Amrita Vishwa Vidyapeetham', courses: ['B.Tech','M.Tech','MBA','MBBS','BSc','PhD','MCA','BCA','MSc'] },
  { name: 'Saveetha Institute of Medical Sciences', courses: ['MBBS','BDS','B.Tech','MBA','BSc Nursing','PhD','BCA'] },
  { name: 'Birla Institute of Technology Mesra', courses: ['B.Tech','M.Tech','MBA','MCA','PhD','BCA','BSc'] },
  { name: 'Dhirubhai Ambani Institute of ICT', courses: ['B.Tech','M.Tech','MBA','MSc','PhD','BCA','MCA'] },
  { name: 'UPES Dehradun',      courses: ['B.Tech','MBA','LLB','BBA','BSc','M.Tech','PhD','BCA','MCA'] },
  { name: 'Graphic Era University', courses: ['B.Tech','MBA','BBA','BSc','MCA','M.Tech','PhD','BCA'] },
  { name: 'Chitkara University', courses: ['B.Tech','MBA','BBA','BSc','MCA','M.Tech','PhD','BCA'] },

  // ── Punjab / North India ──────────────────────────────────────────────────
  { name: 'IKG Punjab Technical University', courses: ['B.Tech','M.Tech','MBA','MCA','BBA','BCA','Diploma','BSc','MSc','PhD'] },
  { name: 'Chandigarh University', courses: ['B.Tech','MBA','BBA','BA','BSc','MCA','M.Tech','LLB','BCA','MSc','PhD'] },
  { name: 'Lovely Professional University', courses: ['B.Tech','MBA','BBA','BA','BSc','MCA','M.Tech','Diploma','PhD','BCA','MSc'] },
  { name: 'Thapar Institute of Engineering', courses: ['B.Tech','M.Tech','MBA','PhD','BCA','MCA','MSc'] },
  { name: 'Panjab University',  courses: ['BA','BSc','BCom','LLB','MBA','MCA','MA','MSc','PhD','BCA','BBA','LLM'] },

  // ── Management Institutes ──────────────────────────────────────────────────
  { name: 'IIM Ahmedabad',      courses: ['MBA','PhD','Executive MBA','PGDM'] },
  { name: 'IIM Bangalore',      courses: ['MBA','PhD','Executive MBA','PGDM'] },
  { name: 'IIM Calcutta',       courses: ['MBA','PhD','Executive MBA','PGDM'] },
  { name: 'IIM Kozhikode',      courses: ['MBA','PhD','Executive MBA','PGDM'] },
  { name: 'XLRI Jamshedpur',    courses: ['MBA','PGDM','PhD','Executive MBA'] },
  { name: 'SP Jain Institute of Management', courses: ['MBA','PGDM','Executive MBA','PhD'] },
  { name: 'Symbiosis Institute of Business Management', courses: ['MBA','PhD','Executive MBA','PGDM','BBA','BCA'] },
  { name: 'Narsee Monjee Institute of Management', courses: ['MBA','BBA','PhD','Executive MBA','PGDM','BCA'] },
  { name: 'Amity University Noida', courses: ['B.Tech','MBA','BBA','BA','BSc','MCA','LLB','BCA','MSc','M.Tech','PhD'] },

  // ── Medical Colleges ──────────────────────────────────────────────────────
  { name: 'AIIMS Delhi',        courses: ['MBBS','MD','MS','PhD','BSc Nursing','MDS','DM','M.Ch'] },
  { name: 'Christian Medical College', courses: ['MBBS','MD','MS','PhD','BSc Nursing','MDS','DM','M.Ch'] },

  // ── Arts & Science / Central Universities ─────────────────────────────────
  { name: 'University of Delhi', courses: ['BA','BSc','BCom','MA','MSc','MCom','PhD','LLB','BCA','MCA','BBA','MBA'] },
  { name: 'Banaras Hindu University', courses: ['BA','BSc','BCom','BE','MBBS','LLB','MBA','MA','MSc','PhD','BCA','MCA','BBA'] },
  { name: 'Aligarh Muslim University', courses: ['BA','BSc','BCom','BE','MBBS','LLB','MBA','MA','MSc','PhD','BCA','MCA','BBA'] },
  { name: 'Jadavpur University', courses: ['B.Tech','M.Tech','BA','BSc','MA','PhD','BCA','MCA','MSc'] },
  { name: 'Calcutta University', courses: ['BA','BSc','BCom','MA','MSc','LLB','PhD','MBA','BCA','MCA','BBA'] },
  { name: 'Osmania University',  courses: ['BA','BSc','BCom','BE','MBA','LLB','MA','MSc','PhD','BCA','MCA','BBA'] },
  { name: 'Hyderabad University', courses: ['MA','MSc','MCA','MBA','PhD','MPhil','BA','BSc','BCA','BBA'] },
  { name: 'Kerala University',   courses: ['BA','BSc','BCom','BE','MBA','LLB','MA','MSc','PhD','BCA','MCA','BBA'] },
  { name: 'Pune University (SPPU)', courses: ['BA','BSc','BCom','BE','MBA','LLB','PhD','BCA','MCA','BBA','MA','MSc','MCom'] },
  { name: 'Mumbai University',   courses: ['BA','BSc','BCom','BE','MBA','LLB','MA','MSc','MCom','PhD','BCA','MCA','BBA'] },
  { name: 'Shivaji University',  courses: ['BA','BSc','BCom','BE','MBA','LLB','MA','MSc','PhD','BCA','MCA','BBA'] },
];

const fixCourses = async () => {
  console.log('🔧 Fixing course availability across all colleges...\n');
  let success = 0, notFound = 0, failed = 0;

  for (const fix of courseFixes) {
    const { data, error } = await supabase
      .from('colleges')
      .update({ courses: fix.courses })
      .eq('name', fix.name)
      .select('name');

    if (error) {
      console.error(`❌ ${fix.name}: ${error.message}`);
      failed++;
    } else if (data && data.length > 0) {
      console.log(`✅ ${fix.name} → ${fix.courses.length} courses`);
      success++;
    } else {
      console.log(`⚠️  Not found: ${fix.name}`);
      notFound++;
    }
  }

  console.log(`\n📊 Results: ${success} updated, ${notFound} not found, ${failed} failed`);

  // Verify BCA is now in multiple colleges
  const { data: bcaColleges } = await supabase
    .from('colleges')
    .select('name')
    .contains('courses', ['BCA']);

  console.log(`\n🎓 BCA is now available at ${bcaColleges?.length || 0} colleges:`);
  bcaColleges?.forEach(c => console.log(`   • ${c.name}`));

  process.exit(0);
};

fixCourses().catch(err => {
  console.error('❌ Fix failed:', err);
  process.exit(1);
});
