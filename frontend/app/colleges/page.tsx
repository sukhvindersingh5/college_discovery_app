'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import CollegeCard from '@/components/CollegeCard';
import Link from 'next/link';

interface College { id: number; name: string; location: string; state: string; type: string; category: string; fees_per_year: number; rating: number; ranking_nirf: number; courses: string[]; placement_avg_lpa: number; placement_percent: number; image_url: string; description: string; }
interface Pagination { total: number; totalPages: number; currentPage: number; hasNext: boolean; hasPrev: boolean; }

export default function CollegesPage() {
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const [colleges, setColleges] = useState<College[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [filters, setFilters] = useState<{ states: string[]; types: string[]; categories: string[]; courses: string[] }>({ states: [], types: [], categories: [], courses: [] });
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const [params, setParams] = useState({
    search: searchParams.get('search') || '',
    state: '', type: '', category: '', course: '', fees_max: '',
    sort: 'ranking_nirf', order: 'asc', page: 1,
  });

  const fetchColleges = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ ...params, page: String(params.page), limit: '12' } as any).toString();
    const data = await api.get(`/api/colleges?${q}`);
    setColleges(data.colleges || []);
    setPagination(data.pagination);
    setLoading(false);
  }, [params]);

  useEffect(() => { fetchColleges(); }, [fetchColleges]);
  useEffect(() => { api.get('/api/colleges/filters').then(d => setFilters(d)); }, []);
  useEffect(() => { if (token) api.get('/api/saved/ids', token).then(d => setSavedIds(d.ids || [])); }, [token]);

  const handleSaveToggle = (id: number, saved: boolean) => setSavedIds(prev => saved ? [...prev, id] : prev.filter(x => x !== id));
  const handleCompareToggle = (id: number) => {
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev);
  };

  const update = (key: string, value: any) => setParams(p => ({ ...p, [key]: value, page: 1 }));

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <Link href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 500 }}>
            ← Back to Home
          </Link>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1.5rem' }}>🏫 Explore Colleges</h1>
          {/* Search + Filters */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <input className="input" value={params.search} onChange={e => update('search', e.target.value)} placeholder="Search by name or city..." style={{ flex: 1, minWidth: 220 }} />
            <select className="input" value={params.state} onChange={e => update('state', e.target.value)} style={{ minWidth: 150 }}>
              <option value="">All States</option>
              {filters.states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="input" value={params.type} onChange={e => update('type', e.target.value)} style={{ minWidth: 150 }}>
              <option value="">All Types</option>
              {filters.types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <select className="input" value={params.course} onChange={e => update('course', e.target.value)} style={{ minWidth: 160 }}>
              <option value="">All Courses</option>
              {filters.courses?.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="input" value={params.fees_max} onChange={e => update('fees_max', e.target.value)} style={{ minWidth: 160 }}>
              <option value="">Max Fees: Any</option>
              <option value="100000">Under ₹1 Lakh/yr</option>
              <option value="200000">Under ₹2 Lakhs/yr</option>
              <option value="500000">Under ₹5 Lakhs/yr</option>
              <option value="1000000">Under ₹10 Lakhs/yr</option>
            </select>
            <select className="input" value={`${params.sort}-${params.order}`} onChange={e => { const [s, o] = e.target.value.split('-'); update('sort', s); setParams(p => ({ ...p, order: o, page: 1 })); }} style={{ minWidth: 180 }}>
              <option value="ranking_nirf-asc">NIRF Rank (Best)</option>
              <option value="rating-desc">Rating (Highest)</option>
              <option value="fees_per_year-asc">Fees (Lowest)</option>
              <option value="fees_per_year-desc">Fees (Highest)</option>
              <option value="name-asc">Name (A-Z)</option>
            </select>
            {(params.search || params.state || params.type || params.category || params.course || params.fees_max) && (
              <button className="btn-secondary" onClick={() => setParams({ search: '', state: '', type: '', category: '', course: '', fees_max: '', sort: 'ranking_nirf', order: 'asc', page: 1 })}>Clear ✕</button>
            )}
          </div>
          {pagination && <p style={{ color: 'var(--text-muted)', marginTop: 12, fontSize: '0.85rem' }}>{pagination.total} colleges found</p>}
        </div>
      </div>

      {/* Compare Banner */}
      {compareIds.length > 0 && (
        <div style={{ background: 'rgba(59,130,246,0.1)', borderBottom: '1px solid var(--primary)', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>⚖️ {compareIds.length} college{compareIds.length > 1 ? 's' : ''} selected for comparison</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {compareIds.length >= 2 && <Link href={`/compare?ids=${compareIds.join(',')}`}><button className="btn-primary" style={{ padding: '0.5rem 1.25rem' }}>Compare Now →</button></Link>}
            <button className="btn-secondary" style={{ padding: '0.5rem 1rem' }} onClick={() => setCompareIds([])}>Clear</button>
          </div>
        </div>
      )}

      {/* Grid */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {[...Array(12)].map((_, i) => <div key={i} className="skeleton" style={{ height: 380, borderRadius: 16 }} />)}
          </div>
        ) : colleges.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>No colleges found</h3>
            <p>Try adjusting your filters</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {colleges.map(c => <CollegeCard key={c.id} college={c} savedIds={savedIds} onSaveToggle={handleSaveToggle} showCompare isInCompare={compareIds.includes(c.id)} onCompareToggle={handleCompareToggle} />)}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: '2.5rem' }}>
            <button className="btn-secondary" disabled={!pagination.hasPrev} onClick={() => setParams(p => ({ ...p, page: p.page - 1 }))} style={{ padding: '0.6rem 1.25rem' }}>← Prev</button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button className="btn-secondary" disabled={!pagination.hasNext} onClick={() => setParams(p => ({ ...p, page: p.page + 1 }))} style={{ padding: '0.6rem 1.25rem' }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
