import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../db';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) { res.status(400).json({ error: 'Name, email, and password are required' }); return; }
    if (password.length < 6) { res.status(400).json({ error: 'Password must be at least 6 characters' }); return; }

    const { data: existing } = await supabase.from('users').select('id').eq('email', email.toLowerCase().trim()).single();
    if (existing) { res.status(409).json({ error: 'Email already registered' }); return; }

    const password_hash = await bcrypt.hash(password, 12);
    const { data, error } = await supabase.from('users')
      .insert({ name: name.trim(), email: email.toLowerCase().trim(), password_hash })
      .select('id,name,email,created_at')
      .single();

    if (error) throw error;
    const token = jwt.sign({ userId: data.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.status(201).json({ user: data, token });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) { res.status(400).json({ error: 'Email and password are required' }); return; }

    const { data: user } = await supabase.from('users').select('*').eq('email', email.toLowerCase().trim()).single();
    if (!user) { res.status(401).json({ error: 'Invalid email or password' }); return; }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) { res.status(401).json({ error: 'Invalid email or password' }); return; }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ user: { id: user.id, name: user.name, email: user.email, created_at: user.created_at }, token });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const getMe = async (req: Request & { userId?: number }, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase.from('users').select('id,name,email,created_at').eq('id', req.userId!).single();
    if (error || !data) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ user: data });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ error: 'Failed to get user' });
  }
};
