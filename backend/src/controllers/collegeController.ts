import { Request, Response } from 'express';
import supabase from '../db';

export const getColleges = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search = '', state = '', type = '', category = '', course = '', fees_max = '', sort = 'ranking_nirf', order = 'asc', page = 1, limit = 12 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase.from('colleges').select('id,name,location,state,type,category,fees_per_year,total_fees,rating,ranking_nirf,established,courses,placement_avg_lpa,placement_highest_lpa,placement_percent,image_url,description,website', { count: 'exact' });

    if (search) query = query.or(`name.ilike.%${search}%,location.ilike.%${search}%`);
    if (state) query = query.ilike('state', `%${state}%`);
    if (type) query = query.eq('type', type);
    if (category) query = query.eq('category', category);
    // Course filter: check if courses array contains the selected course
    if (course) query = query.contains('courses', [course as string]);
    // Fees max filter
    if (fees_max) query = query.lte('fees_per_year', Number(fees_max));

    const allowedSorts = ['ranking_nirf', 'rating', 'fees_per_year', 'name', 'established'];
    const sortField = allowedSorts.includes(sort as string) ? (sort as string) : 'ranking_nirf';
    query = query.order(sortField, { ascending: order !== 'desc', nullsFirst: false });
    query = query.range(offset, offset + Number(limit) - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    const total = count || 0;
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      colleges: data,
      pagination: { total, totalPages, currentPage: Number(page), limit: Number(limit), hasNext: Number(page) < totalPages, hasPrev: Number(page) > 1 },
    });
  } catch (err: any) {
    console.error('getColleges error:', err);
    res.status(500).json({ error: 'Failed to fetch colleges' });
  }
};

export const getFilters = async (req: Request, res: Response): Promise<void> => {
  try {
    const [statesRes, typesRes, categoriesRes, coursesRes] = await Promise.all([
      supabase.from('colleges').select('state').neq('state', null),
      supabase.from('colleges').select('type').neq('type', null),
      supabase.from('colleges').select('category').neq('category', null),
      supabase.from('colleges').select('courses'),
    ]);

    const unique = (arr: any[], key: string) => [...new Set(arr.map(r => r[key]))].filter(Boolean).sort();

    // Flatten all course arrays into one unique sorted list
    const allCourses = (coursesRes.data || [])
      .flatMap((r: any) => {
        let c = r.courses;
        if (typeof c === 'string') {
          try { c = JSON.parse(c); } catch (e) { return []; }
        }
        return Array.isArray(c) ? c : [];
      })
      .filter(Boolean);
    const uniqueCourses = [...new Set(allCourses)].sort();

    res.json({
      states: unique(statesRes.data || [], 'state'),
      types: unique(typesRes.data || [], 'type'),
      categories: unique(categoriesRes.data || [], 'category'),
      courses: uniqueCourses,
    });
  } catch (err) {
    console.error('getFilters error:', err);
    res.status(500).json({ error: 'Failed to fetch filters' });
  }
};

export const compareColleges = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids } = req.query;
    if (!ids) { res.status(400).json({ error: 'Provide college IDs as ?ids=1,2,3' }); return; }

    const idArray = (ids as string).split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    if (idArray.length < 2 || idArray.length > 3) { res.status(400).json({ error: 'Provide 2 or 3 college IDs' }); return; }

    const { data, error } = await supabase.from('colleges')
      .select('id,name,location,state,type,category,fees_per_year,total_fees,rating,ranking_nirf,established,courses,placement_avg_lpa,placement_highest_lpa,placement_percent,website')
      .in('id', idArray);

    if (error) throw error;
    res.json({ colleges: data });
  } catch (err) {
    console.error('compareColleges error:', err);
    res.status(500).json({ error: 'Failed to compare colleges' });
  }
};

export const getCollegeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('colleges').select('*').eq('id', id).single();

    if (error || !data) { res.status(404).json({ error: 'College not found' }); return; }
    res.json({ college: data });
  } catch (err) {
    console.error('getCollegeById error:', err);
    res.status(500).json({ error: 'Failed to fetch college' });
  }
};
