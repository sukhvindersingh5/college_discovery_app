'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';

interface College { id: number; name: string; location: string; type: string; category: string; fees_per_year: number; total_fees: number; rating: number; ranking_nirf: number; established: number; courses: string[]; placement_avg_lpa: number; placement_highest_lpa: number; placement_percent: number; website: string; }

const FIELDS = [
  { key: 'ranking_nirf', label: '🏆 NIRF Rank', format: (v: any) => v ? `#${v}` : 'N/A', better: 'lower' },
  { key: 'rating', label: '⭐ Rating', format: (v: any) => `${v}/5`, better: 'higher' },
  { key: 'type', label: '🏛️ Type', format: (v: any) => v, better: null },
  { key: 'category', label: '📚 Category', format: (v: any) => v, better: null },
  { key: 'established', label: '📅 Established', format: (v: any) => v, better: null },
  { key: 'location', label: '📍 Location', format: (v: any) => v, better: null },
  { key: 'fees_per_year', label: '💰 Fees/Year', format: (v: any) => `₹${(v/1000).toFixed(0)}K`, better: 'lower' },
  { key: 'total_fees', label: '🏦 Total Fees', format: (v: any) => `₹${(v/100000).toFixed(1)}L`, better: 'lower' },
  { key: 'placement_avg_lpa', label: '💼 Avg Package', format: (v: any) => `${v} LPA`, better: 'higher' },
  { key: 'placement_highest_lpa', label: '🚀 Highest Package', format: (v: any) => `${v} LPA`, better: 'higher' },
  { key: 'placement_percent', label: '📊 Placement %', format: (v: any) => `${v}%`, better: 'higher' },
  { key: 'courses', label: '🎓 Courses', format: (v: any) => Array.isArray(v) ? v.join(', ') : v, better: null },
];

function getBetter(field: typeof FIELDS[0], colleges: College[]) {
  if (!field.better) return null;
  const vals = colleges.map(c => (c as any)[field.key]).filter(v => typeof v === 'number');
  if (vals.length < 2) return null;
  return field.better === 'lower' ? Math.min(...vals) : Math.max(...vals);
}

export default function ComparePage() {
  const searchParams = useSearchParams();
  const [colleges, setColleges] = useState<College[]>([]);
  const [allColleges, setAllColleges] = useState<College[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ids = searchParams.get('ids');
    if (ids) setSelectedIds(ids.split(',').map(Number).filter(Boolean).slice(0, 3));
    api.get('/api/colleges?limit=100').then(d => setAllColleges(d.colleges || []));
  }, [searchParams]);

  useEffect(() => {
    if (selectedIds.length >= 2) {
      setLoading(true);
      api.get(`/api/colleges/compare?ids=${selectedIds.join(',')}`).then(d => { setColleges(d.colleges || []); setLoading(false); });
    } else { setColleges([]); }
  }, [selectedIds]);

  const addCollege = (id: number) => { if (!selectedIds.includes(id) && selectedIds.length < 3) setSelectedIds(prev => [...prev, id]); };
  const removeCollege = (id: number) => setSelectedIds(prev => prev.filter(x => x !== id));

  return (
    <div style={{ minHeight: '100vh', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/colleges" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>← Back to Colleges</Link>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginTop: 8, marginBottom: 4 }}>⚖️ Compare Colleges</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Select 2–3 colleges to compare side by side</p>
        </div>

        {/* College Selector */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ flex: 1, minWidth: 220 }}>
              {selectedIds[i] ? (
                <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--primary)' }}>
                    {allColleges.find(c => c.id === selectedIds[i])?.name || `College ${i+1}`}
                  </span>
                  <button onClick={() => removeCollege(selectedIds[i])} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem' }}>✕</button>
                </div>
              ) : (
                <select className="input" onChange={e => addCollege(Number(e.target.value))} value="">
                  <option value="">+ Add College {i+1}</option>
                  {allColleges.filter(c => !selectedIds.includes(c.id)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </div>
          ))}
        </div>

        {/* Compare Table */}
        {loading && <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Loading comparison...</div>}

        {!loading && colleges.length >= 2 && (
          <div className="card" style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', width: 200 }}>Feature</th>
                  {colleges.map(c => (
                    <th key={c.id} style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{c.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2 }}>📍 {c.location}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FIELDS.map((field, idx) => {
                  const best = getBetter(field, colleges);
                  return (
                    <tr key={field.key} style={{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>{field.label}</td>
                      {colleges.map(c => {
                        const val = (c as any)[field.key];
                        const isBest = best !== null && val === best;
                        return (
                          <td key={c.id} style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: isBest ? 700 : 500, color: isBest ? 'var(--accent)' : 'var(--text-primary)', fontSize: '0.95rem' }}>
                            {field.format(val)}
                            {isBest && <span style={{ marginLeft: 4, fontSize: '0.75rem' }}>✓</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && selectedIds.length < 2 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚖️</div>
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Select at least 2 colleges to compare</h3>
            <p>Use the dropdowns above to pick colleges</p>
          </div>
        )}
      </div>
    </div>
  );
}
