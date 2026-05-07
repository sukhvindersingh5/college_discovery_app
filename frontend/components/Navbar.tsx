'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { user, logout, isLoggedIn } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const navLinks = [
    { href: '/colleges', label: 'Colleges' },
    { href: '/compare', label: '⚖️ Compare' },
    { href: '/saved', label: '🔖 Saved' },
  ];

  const handleLogout = () => { logout(); router.push('/'); };

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(5, 11, 24, 0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 1.5rem',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>🎓</span>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            CollegeQuest
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} style={{
              padding: '0.5rem 1rem', borderRadius: 10, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500,
              color: pathname === link.href ? 'var(--primary)' : 'var(--text-secondary)',
              background: pathname === link.href ? 'rgba(59,130,246,0.1)' : 'transparent',
              transition: 'all 0.2s',
            }}>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth Desktop */}
        <div className="hidden md:flex items-center gap-3 min-w-[160px]">
          {mounted && isLoggedIn ? (
            <>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>👋 {user?.name?.split(' ')[0]}</span>
              <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Logout</button>
            </>
          ) : mounted ? (
            <>
              <Link href="/login"><button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Login</button></Link>
              <Link href="/register"><button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Sign Up</button></Link>
            </>
          ) : null}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '1.5rem', cursor: 'pointer' }}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="md:hidden" style={{ borderTop: '1px solid var(--border)', padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} style={{
              padding: '0.75rem 1rem', borderRadius: 8, textDecoration: 'none', fontSize: '1rem', fontWeight: 500,
              color: pathname === link.href ? 'var(--primary)' : 'var(--text-primary)',
              background: pathname === link.href ? 'rgba(59,130,246,0.1)' : 'transparent',
            }}>
              {link.label}
            </Link>
          ))}
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
            {mounted && isLoggedIn ? (
              <>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>👋 {user?.name}</span>
                <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="btn-secondary" style={{ width: '100%' }}>Logout</button>
              </>
            ) : mounted ? (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)}><button className="btn-secondary" style={{ width: '100%' }}>Login</button></Link>
                <Link href="/register" onClick={() => setMenuOpen(false)}><button className="btn-primary" style={{ width: '100%' }}>Sign Up</button></Link>
              </>
            ) : null}
          </div>
        </div>
      )}
    </nav>
  );
}
