'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface College { id: number; name: string; location: string; fees_per_year: number; rating: number; ranking_nirf: number; placement_avg_lpa: number; image_url: string; type: string; category: string; }

export default function HomePage() {
  const [featured, setFeatured] = useState<College[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/api/colleges?limit=6&sort=ranking_nirf&order=asc').then(d => setFeatured(d.colleges || []));
  }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); window.location.href = `/colleges?search=${search}`; };

  return (
    <div>
      {/* Hero */}
      <section style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '2rem 1.5rem' }}>
        {/* Background blobs */}
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 800, textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 999, padding: '6px 16px', marginBottom: 24, fontSize: '0.85rem', color: 'var(--primary)' }}>
            🎓 58 Top Indian Colleges
          </div>

          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
            Find Your{' '}
            <span className="gradient-text">Dream College</span>
            <br />in India
          </h1>

          <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', marginBottom: '3rem', lineHeight: 1.7, maxWidth: 550, margin: '0 auto 3rem' }}>
            Search, compare, and shortlist from India's top engineering, medical, and management colleges — all in one place.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, maxWidth: 580, margin: '0 auto 3rem', flexWrap: 'wrap' }}>
            <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search colleges, cities, courses..." style={{ flex: 1, minWidth: 250, fontSize: '1rem', padding: '1rem 1.25rem' }} />
            <button type="submit" className="btn-primary" style={{ padding: '1rem 2rem', fontSize: '1rem' }}>Search 🔍</button>
          </form>

          {/* Quick stats */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
            {[['58', 'Colleges'], ['14', 'States'], ['100%', 'Free'], ['Real Data', 'Live DB']].map(([val, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '1.75rem', background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{val}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Colleges */}
      <section style={{ padding: '5rem 1.5rem', background: 'var(--bg-secondary)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: 12 }}>🏆 Top Ranked Colleges</h2>
            <p style={{ color: 'var(--text-secondary)' }}>India's highest-rated institutions by NIRF ranking</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {featured.map((c, i) => (
              <Link href={`/colleges/${c.id}`} key={c.id} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12, animationDelay: `${i * 0.1}s` }} >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold)' }}>NIRF #{c.ranking_nirf}</div>
                    <span style={{ color: 'var(--gold)', fontSize: '0.85rem' }}>★ {c.rating}</span>
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 4 }}>{c.name}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>📍 {c.location}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                    <div><div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>FEES/YEAR</div><div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>₹{(c.fees_per_year/1000).toFixed(0)}K</div></div>
                    <div><div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>AVG PACKAGE</div><div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.9rem' }}>{c.placement_avg_lpa} LPA</div></div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link href="/colleges"><button className="btn-primary" style={{ fontSize: '1rem', padding: '0.9rem 2.5rem' }}>View All Colleges →</button></Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '3rem' }}>Why CollegeQuest?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {[
              ['🔍', 'Smart Search', 'Filter by location, fees, category and more to find your perfect match'],
              ['⚖️', 'Side-by-Side Compare', 'Compare 2-3 colleges on fees, placements, ratings and courses'],
              ['🔖', 'Save & Shortlist', 'Create your personal list of favourite colleges'],
              ['📊', 'Real Placement Data', 'Actual average and highest packages from each college'],
            ].map(([icon, title, desc]) => (
              <div key={title as string} className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{icon}</div>
                <h3 style={{ fontWeight: 700, marginBottom: 8 }}>{title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        CollegeQuest 2026
      </footer>
    </div>
  );
}
