import { Response } from 'express';
import supabase from '../db';
import { AuthRequest } from '../middleware/auth';

export const getSaved = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('saved_colleges')
      .select(`created_at, colleges(id,name,location,state,type,category,fees_per_year,rating,ranking_nirf,courses,placement_avg_lpa,image_url)`)
      .eq('user_id', req.userId!);

    if (error) throw error;
    res.json({ saved: data });
  } catch (err) {
    console.error('getSaved error:', err);
    res.status(500).json({ error: 'Failed to fetch saved colleges' });
  }
};

export const saveCollege = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data: college } = await supabase.from('colleges').select('id').eq('id', id).single();
    if (!college) { res.status(404).json({ error: 'College not found' }); return; }

    const { error } = await supabase.from('saved_colleges').upsert({ user_id: req.userId!, college_id: Number(id) }, { onConflict: 'user_id,college_id' });
    if (error) throw error;
    res.status(201).json({ message: 'College saved successfully' });
  } catch (err) {
    console.error('saveCollege error:', err);
    res.status(500).json({ error: 'Failed to save college' });
  }
};

export const unsaveCollege = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('saved_colleges').delete().eq('user_id', req.userId!).eq('college_id', Number(id));
    if (error) throw error;
    res.json({ message: 'College removed from saved' });
  } catch (err) {
    console.error('unsaveCollege error:', err);
    res.status(500).json({ error: 'Failed to remove saved college' });
  }
};

export const getSavedIds = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase.from('saved_colleges').select('college_id').eq('user_id', req.userId!);
    if (error) throw error;
    res.json({ ids: (data || []).map(r => r.college_id) });
  } catch (err) {
    console.error('getSavedIds error:', err);
    res.status(500).json({ error: 'Failed to fetch saved IDs' });
  }
};
