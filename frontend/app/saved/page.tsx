'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SavedItem { saved_at: string; colleges: { id: number; name: string; location: string; state: string; type: string; category: string; fees_per_year: number; rating: number; ranking_nirf: number; placement_avg_lpa: number; image_url: string; } }

export default function SavedPage() {
  const { token, isLoggedIn, user } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) { router.push('/login'); return; }
    api.get('/api/saved', token!).then(d => { setSaved(d.saved || []); setLoading(false); });
  }, [isLoggedIn, token, router]);

  const handleUnsave = async (id: number) => {
    await api.delete(`/api/saved/${id}`, token!);
    setSaved(prev => prev.filter(s => s.colleges.id !== id));
  };

  if (!isLoggedIn) return null;

  return (
    <div style={{ minHeight: '100vh', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 4 }}>🔖 Saved Colleges</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {user?.name}! Your shortlisted colleges.</p>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />)}
          </div>
        ) : saved.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>🔖</div>
            <h3 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: 8 }}>No saved colleges yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Start exploring and save colleges you're interested in!</p>
            <Link href="/colleges"><button className="btn-primary">Explore Colleges →</button></Link>
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>{saved.length} college{saved.length !== 1 ? 's' : ''} saved</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {saved.map(item => {
                const c = item.colleges;
                const stars = Math.round(c.rating);
                return (
                  <div key={c.id} className="card" style={{ overflow: 'hidden' }}>
                    <div style={{ position: 'relative', height: 140, overflow: 'hidden', background: 'var(--bg-secondary)' }}>
                      <img src={c.image_url} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1562774053-701939374585?w=800'; }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,11,24,0.8), transparent)' }} />
                      {c.ranking_nirf && <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(5,11,24,0.8)', border: '1px solid var(--gold)', borderRadius: 6, padding: '3px 8px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--gold)' }}>NIRF #{c.ranking_nirf}</div>}
                      <button onClick={() => handleUnsave(c.id)} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#f87171', fontSize: '0.75rem', fontWeight: 600 }}>✕ Remove</button>
                    </div>
                    <div style={{ padding: '1.25rem' }}>
                      <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{c.name}</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 10 }}>📍 {c.location}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <span className="stars" style={{ fontSize: '0.8rem' }}>{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
                        <span style={{ color: 'var(--gold)', fontSize: '0.8rem', fontWeight: 600 }}>{c.rating}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                        <div><span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>FEES </span><span style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{(c.fees_per_year/1000).toFixed(0)}K</span></div>
                        <div><span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>PKG </span><span style={{ fontWeight: 700, color: 'var(--accent)' }}>{c.placement_avg_lpa} LPA</span></div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <Link href={`/colleges/${c.id}`} style={{ flex: 1 }}><button className="btn-primary" style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', justifyContent: 'center' }}>View Details</button></Link>
                        <Link href={`/compare?ids=${c.id}`}><button className="btn-secondary" style={{ padding: '0.6rem 0.75rem', fontSize: '0.85rem' }}>⚖️</button></Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
