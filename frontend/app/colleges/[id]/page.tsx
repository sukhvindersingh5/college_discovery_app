'use client';
import { use, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

interface College {
  id: number; name: string; location: string; state: string; type: string; category: string;
  fees_per_year: number; total_fees: number; rating: number; ranking_nirf: number;
  established: number; courses: string[]; placement_avg_lpa: number;
  placement_highest_lpa: number; placement_percent: number;
  image_url: string; description: string; website: string;
}

export default function CollegeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token, isLoggedIn } = useAuth();
  const [college, setCollege] = useState<College | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    api.get(`/api/colleges/${id}`).then(d => { setCollege(d.college || null); setLoading(false); });
    if (token) api.get('/api/saved/ids', token).then(d => setSaved((d.ids || []).includes(Number(id))));
  }, [id, token]);

  const handleSave = async () => {
    if (!isLoggedIn) { window.location.href = '/login'; return; }
    if (saved) { await api.delete(`/api/saved/${id}`, token!); setSaved(false); }
    else { await api.post(`/api/saved/${id}`, {}, token!); setSaved(true); }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--text-secondary)', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      Loading college details...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!college) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>😕</div>
      <h2 style={{ fontWeight: 700, marginBottom: 8 }}>College not found</h2>
      <Link href="/colleges"><button className="btn-primary" style={{ marginTop: 16 }}>← Back to Colleges</button></Link>
    </div>
  );

  const stars = Math.round(college.rating);
  const tabs = ['overview', 'courses', 'placements', 'reviews'];

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero Banner */}
      <div style={{ position: 'relative', height: 300, overflow: 'hidden' }}>
        <img src={college.image_url} alt={college.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1562774053-701939374585?w=1200'; }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(5,11,24,0.3), var(--bg-primary))' }} />
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem 4rem' }}>
        {/* Breadcrumb */}
        <Link href="/colleges" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: '1.5rem' }}>
          ← Back to Colleges
        </Link>

        {/* College Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              {college.ranking_nirf && <span style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '4px 12px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold)' }}>🏆 NIRF Rank #{college.ranking_nirf}</span>}
              <span style={{ background: college.type === 'Government' ? 'rgba(16,185,129,0.15)' : 'rgba(139,92,246,0.15)', border: `1px solid ${college.type === 'Government' ? 'rgba(16,185,129,0.3)' : 'rgba(139,92,246,0.3)'}`, borderRadius: 8, padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600, color: college.type === 'Government' ? 'var(--accent)' : 'var(--purple)' }}>{college.type}</span>
              <span style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>{college.category}</span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 8 }}>{college.name}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>📍 {college.location} · Est. {college.established}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <span className="stars">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
              <span style={{ fontWeight: 700, color: 'var(--gold)' }}>{college.rating}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>/ 5.0</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={handleSave} className={saved ? 'btn-accent' : 'btn-secondary'}>{saved ? '🔖 Saved' : '🔖 Save College'}</button>
            <Link href={`/compare?ids=${college.id}`}><button className="btn-primary">⚖️ Compare</button></Link>
            {college.website && <a href={college.website} target="_blank" rel="noopener noreferrer"><button className="btn-secondary">🌐 Website</button></a>}
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          {[
            { label: 'Fees/Year', value: `₹${(college.fees_per_year / 1000).toFixed(0)}K`, color: 'var(--primary)', icon: '💰' },
            { label: 'Total Fees', value: `₹${(college.total_fees / 100000).toFixed(1)}L`, color: 'var(--purple)', icon: '🏦' },
            { label: 'Avg Package', value: `${college.placement_avg_lpa} LPA`, color: 'var(--accent)', icon: '💼' },
            { label: 'Highest Pkg', value: `${college.placement_highest_lpa} LPA`, color: 'var(--gold)', icon: '🚀' },
            { label: 'Placement %', value: `${college.placement_percent}%`, color: '#f472b6', icon: '📊' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontWeight: 800, fontSize: '1.4rem', color: s.color }}>{s.value}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: '2rem' }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', textTransform: 'capitalize', color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)', borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent', transition: 'all 0.2s' }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: 12 }}>About</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>{college.description}</p>
            </div>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Quick Info</h3>
              {[['Type', college.type], ['Category', college.category], ['State', college.state], ['Established', String(college.established)], ['Website', college.website || 'N/A']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                  <span style={{ fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Courses Offered</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {(college.courses || []).map(c => <span key={c} style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '8px 16px', fontSize: '0.9rem', fontWeight: 500, color: 'var(--primary)' }}>{c}</span>)}
            </div>
          </div>
        )}

        {activeTab === 'placements' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'Average Package', value: `${college.placement_avg_lpa} LPA`, icon: '💼', color: 'var(--accent)' },
              { label: 'Highest Package', value: `${college.placement_highest_lpa} LPA`, icon: '🏆', color: 'var(--gold)' },
              { label: 'Placement Rate', value: `${college.placement_percent}%`, icon: '📊', color: 'var(--primary)' },
            ].map(p => (
              <div key={p.label} className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{p.icon}</div>
                <div style={{ fontWeight: 800, fontSize: '2rem', color: p.color, marginBottom: 4 }}>{p.value}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{p.label}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {[
              { name: 'Rahul Sharma', rating: 5, text: 'Amazing infrastructure and faculty. The placements were exceptional — got placed in a top MNC!', year: '2023 Graduate' },
              { name: 'Priya Singh', rating: 4, text: 'Great academic environment. The campus life is vibrant and the peer group is extremely talented.', year: '2022 Graduate' },
              { name: 'Amit Kumar', rating: 4, text: 'World-class research facilities. Highly recommended for aspiring engineers.', year: '2024 Student' },
            ].map(r => (
              <div key={r.name} className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div><div style={{ fontWeight: 700 }}>{r.name}</div><div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{r.year}</div></div>
                  <span className="stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{r.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
