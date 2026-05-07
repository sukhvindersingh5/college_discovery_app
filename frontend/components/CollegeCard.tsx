'use client';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useState } from 'react';

interface College {
  id: number; name: string; location: string; state: string;
  type: string; category: string; fees_per_year: number;
  rating: number; ranking_nirf: number; courses: string[];
  placement_avg_lpa: number; placement_percent: number; image_url: string; description: string;
}

interface Props {
  college: College;
  savedIds?: number[];
  onSaveToggle?: (id: number, saved: boolean) => void;
  showCompare?: boolean;
  isInCompare?: boolean;
  onCompareToggle?: (id: number) => void;
}

export default function CollegeCard({ college, savedIds = [], onSaveToggle, showCompare, isInCompare, onCompareToggle }: Props) {
  const { token, isLoggedIn } = useAuth();
  const [saving, setSaving] = useState(false);
  const isSaved = savedIds.includes(college.id);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoggedIn) { window.location.href = '/login'; return; }
    setSaving(true);
    try {
      if (isSaved) {
        await api.delete(`/api/saved/${college.id}`, token!);
        onSaveToggle?.(college.id, false);
      } else {
        await api.post(`/api/saved/${college.id}`, {}, token!);
        onSaveToggle?.(college.id, true);
      }
    } finally { setSaving(false); }
  };

  const categoryColor: Record<string, string> = {
    Engineering: 'badge-eng', Medical: 'badge-med', Management: 'badge-mgmt',
    'Arts & Science': 'badge-pvt', default: 'badge-eng',
  };

  const stars = Math.round(college.rating);

  return (
    <Link href={`/colleges/${college.id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Image */}
        <div style={{ position: 'relative', height: 180, overflow: 'hidden', background: 'var(--bg-secondary)' }}>
          <img src={college.image_url} alt={college.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1562774053-701939374585?w=800'; }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,11,24,0.8), transparent)' }} />
          {college.ranking_nirf && (
            <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(5,11,24,0.8)', backdropFilter: 'blur(8px)', border: '1px solid var(--gold)', borderRadius: 8, padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold)' }}>
              NIRF #{college.ranking_nirf}
            </div>
          )}
          {/* Actions */}
          <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
            <button onClick={handleSave} disabled={saving} style={{ background: isSaved ? 'rgba(245,158,11,0.2)' : 'rgba(5,11,24,0.8)', backdropFilter: 'blur(8px)', border: `1px solid ${isSaved ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s' }}>
              {isSaved ? '🔖' : '🔖'}
            </button>
            {showCompare && (
              <button onClick={(e) => { e.preventDefault(); onCompareToggle?.(college.id); }} style={{ background: isInCompare ? 'rgba(59,130,246,0.2)' : 'rgba(5,11,24,0.8)', backdropFilter: 'blur(8px)', border: `1px solid ${isInCompare ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: isInCompare ? 'var(--primary)' : 'var(--text-secondary)', transition: 'all 0.2s' }}>
                {isInCompare ? '✓ Added' : '+ Compare'}
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className={`badge ${college.type === 'Government' ? 'badge-gov' : 'badge-pvt'}`}>{college.type}</span>
            <span className={`badge ${categoryColor[college.category] || categoryColor.default}`}>{college.category}</span>
          </div>

          <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>{college.name}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4 }}>
            📍 {college.location}
          </p>

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="stars" style={{ fontSize: '0.85rem' }}>{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
            <span style={{ color: 'var(--gold)', fontSize: '0.85rem', fontWeight: 600 }}>{college.rating}</span>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: 2 }}>FEES/YEAR</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>₹{(college.fees_per_year / 1000).toFixed(0)}K</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: 2 }}>AVG PACKAGE</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent)' }}>{college.placement_avg_lpa} LPA</div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
