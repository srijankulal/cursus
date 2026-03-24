'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Layers, Cpu, BarChart3 } from 'lucide-react';
import { ROLE_HOME_ROUTES, type SessionRole } from '@/lib/auth/session';

/* ─────────────────────────────────────────────
   Design tokens
   Base:    #F5F4F0 (warm off-white) / #1A1916 (near-black)
   Pastel:  Red   #FDE8E8 / #C06060
            Blue  #E4ECFB / #5A7AB5
            Green #E2F5EA / #4A9068
───────────────────────────────────────────── */

const roleLabelMap: Record<SessionRole, string> = {
  hod: 'HOD Dashboard',
  staff: 'Staff Portal',
  students: 'Student Portal',
};

const features = [
  {
    icon: Layers,
    title: 'Smart Tracker',
    desc: 'Real-time syllabus monitoring across every BCA unit, subject, and semester.',
    pill: 'Track',
    pillBg: 'bg-[#E4ECFB]',
    pillText: 'text-[#5A7AB5]',
    iconBg: 'bg-[#E4ECFB]',
    iconColor: 'text-[#5A7AB5]',
    border: 'hover:border-[#E4ECFB]',
  },
  {
    icon: Cpu,
    title: 'AI Study Plan',
    desc: 'Gemini-powered schedules that rebuild themselves every time you mark a topic done.',
    pill: 'AI',
    pillBg: 'bg-[#E2F5EA]',
    pillText: 'text-[#4A9068]',
    iconBg: 'bg-[#E2F5EA]',
    iconColor: 'text-[#4A9068]',
    border: 'hover:border-[#E2F5EA]',
  },
  {
    icon: BarChart3,
    title: 'Risk Insights',
    desc: 'Spot subjects falling behind before they become a crisis. Green, yellow, red — always visible.',
    pill: 'Insights',
    pillBg: 'bg-[#FDE8E8]',
    pillText: 'text-[#C06060]',
    iconBg: 'bg-[#FDE8E8]',
    iconColor: 'text-[#C06060]',
    border: 'hover:border-[#FDE8E8]',
  },
];

export default function LandingPage() {
  const [sessionRole, setSessionRole] = useState<SessionRole | null>(null);
  const [sessionResolved, setSessionResolved] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadSession = async () => {
      try {
        const res = await fetch('/api/auth/session', { method: 'GET' });
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setSessionRole((data.role as SessionRole | null) ?? null);
      } catch {
        if (mounted) setSessionRole(null);
      } finally {
        if (mounted) setSessionResolved(true);
      }
    };
    loadSession();
    return () => { mounted = false; };
  }, []);

  const primaryRole = useMemo(() => sessionRole ?? 'students', [sessionRole]);
  const portalLink = ROLE_HOME_ROUTES[primaryRole];
  const portalLabel = roleLabelMap[primaryRole];
  const showPublicCtas = sessionResolved && !sessionRole;

  async function handleLogout() {
    try { await fetch('/api/auth/logout', { method: 'POST' }); }
    finally { setSessionRole(null); window.location.reload(); }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: '#F5F4F0',
        color: '#1A1916',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap');

        .wordmark { font-family: 'DM Serif Display', serif; }
        .display  { font-family: 'DM Serif Display', serif; }

        .nav-pill {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .feature-card {
          background: #FDFCF9;
          border: 1.5px solid #E8E6E0;
          border-radius: 20px;
          transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
        }
        .feature-card:hover {
          box-shadow: 0 8px 32px rgba(26,25,22,0.07);
          transform: translateY(-2px);
        }

        .tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .btn-primary {
          background: #1A1916;
          color: #F5F4F0;
          border-radius: 12px;
          font-weight: 600;
          font-size: 13px;
          padding: 10px 24px;
          border: none;
          transition: background 0.2s ease, transform 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          text-decoration: none;
        }
        .btn-primary:hover { background: #2E2D29; transform: translateY(-1px); }
        .btn-primary:active { transform: translateY(0); }

        .btn-ghost {
          background: transparent;
          color: #6B6860;
          border-radius: 10px;
          font-weight: 600;
          font-size: 13px;
          padding: 10px 18px;
          border: 1.5px solid #E8E6E0;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          text-decoration: none;
        }
        .btn-ghost:hover { border-color: #C8C6BF; color: #1A1916; background: #FDFCF9; }

        .divider-line {
          width: 40px;
          height: 2px;
          background: #E8E6E0;
          border-radius: 2px;
        }

        /* Subtle dot grid background */
        .dot-grid {
          background-image: radial-gradient(circle, #D0CEC8 1px, transparent 1px);
          background-size: 28px 28px;
        }
      `}</style>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          width: '100%',
          zIndex: 50,
          backgroundColor: 'rgba(245,244,240,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #E8E6E0',
          padding: '0 32px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 32, height: 32,
            background: '#1A1916',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#F5F4F0', fontSize: 13, fontWeight: 800, fontFamily: 'DM Serif Display, serif' }}>C</span>
          </div>
          <span className="wordmark" style={{ fontSize: 20, fontWeight: 400, color: '#1A1916', letterSpacing: '-0.02em' }}>
            Cursus
          </span>
        </div>

        {/* Nav actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!sessionResolved ? null : sessionRole ? (
            <>
              <Link href={portalLink}>
                <span className="btn-primary">{portalLabel} <ArrowRight size={13} /></span>
              </Link>
              <button className="btn-ghost" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link href="/auth"><span className="btn-ghost">Login</span></Link>
              <Link href="/student"><span className="btn-ghost">Student</span></Link>
              <Link href="/hod"><span className="btn-primary">HOD Dashboard <ArrowRight size={13} /></span></Link>
            </>
          )}
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 140, paddingBottom: 100 }}>

        {/* Dot grid accent — top center */}
        <div
          className="dot-grid"
          style={{
            position: 'absolute',
            top: 0, left: '50%',
            transform: 'translateX(-50%)',
            width: 600, height: 320,
            opacity: 0.4,
            pointerEvents: 'none',
            maskImage: 'radial-gradient(ellipse 60% 80% at 50% 0%, black 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 60% 80% at 50% 0%, black 40%, transparent 100%)',
            zIndex: 0,
          }}
        />

        <div style={{ maxWidth: 780, width: '100%', padding: '0 24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>

          {/* Status pill */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}
          >
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 16px',
                background: '#E2F5EA',
                borderRadius: 100,
                fontSize: 10, fontWeight: 700,
                letterSpacing: '0.14em',
                color: '#4A9068',
                textTransform: 'uppercase',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4A9068', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              Powered by Gemini AI
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="display"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: 'clamp(52px, 9vw, 88px)',
              fontWeight: 400,
              lineHeight: 1.0,
              letterSpacing: '-0.025em',
              color: '#1A1916',
              marginBottom: 28,
            }}
          >
            Stay ahead of<br />
            <em style={{ color: '#9E9B94', fontStyle: 'italic' }}>your syllabus.</em>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22 }}
            style={{
              fontSize: 17,
              fontWeight: 400,
              lineHeight: 1.7,
              color: '#6B6860',
              maxWidth: 560,
              margin: '0 auto 40px',
            }}
          >
            Cursus tracks your BCA syllabus completion, flags what matters most,
            and builds a personalised study path using Gemini AI.
          </motion.p>

          {/* CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.32 }}
            style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <Link href={portalLink}>
              <span className="btn-primary" style={{ padding: '12px 28px', fontSize: 14 }}>
                {portalLabel} <ArrowRight size={15} />
              </span>
            </Link>
            {showPublicCtas && (
              <Link href="/hod">
                <span className="btn-ghost" style={{ padding: '12px 28px', fontSize: 14 }}>
                  HOD Dashboard
                </span>
              </Link>
            )}
          </motion.div>

          {/* Thin divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ display: 'flex', alignItems: 'center', gap: 20, margin: '72px auto 0', maxWidth: 320, justifyContent: 'center' }}
          >
            <div className="divider-line" />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: '#B0AEA7', textTransform: 'uppercase' }}>
              Everything you need
            </span>
            <div className="divider-line" />
          </motion.div>

          {/* ── Feature cards ─────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              marginTop: 36,
              textAlign: 'left',
            }}
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                className={`feature-card ${f.border}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                style={{ padding: '28px 24px' }}
              >
                {/* Icon */}
                <div
                  className={`${f.iconBg} ${f.iconColor}`}
                  style={{
                    width: 44, height: 44,
                    borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 20,
                  }}
                >
                  <f.icon size={20} strokeWidth={2} />
                </div>

                {/* Pill */}
                <span className={`tag ${f.pillBg} ${f.pillText}`} style={{ marginBottom: 12 }}>
                  {f.pill}
                </span>

                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1916', marginBottom: 8, marginTop: 10, letterSpacing: '-0.01em' }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 13, fontWeight: 400, color: '#7A7872', lineHeight: 1.65 }}>
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* ── Role strip ────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85 }}
            style={{
              marginTop: 64,
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {[
              { label: 'Students', href: '/student', bg: '#E4ECFB', color: '#5A7AB5' },
              { label: 'Staff / Faculty', href: '/staff', bg: '#E2F5EA', color: '#4A9068' },
              { label: 'HOD / Dean', href: '/hod', bg: '#FDE8E8', color: '#C06060' },
            ].map((r) => (
              <Link key={r.label} href={r.href}>
                <span
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '8px 18px',
                    background: r.bg,
                    color: r.color,
                    borderRadius: 100,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    transition: 'opacity 0.2s, transform 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.8'; (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                >
                  {r.label} <ArrowRight size={11} />
                </span>
              </Link>
            ))}
          </motion.div>

        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: '1px solid #E8E6E0',
          padding: '28px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <span className="wordmark" style={{ fontSize: 15, color: '#B0AEA7', fontWeight: 400 }}>
          Cursus
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', color: '#B0AEA7', textTransform: 'uppercase' }}>
          © 2024 · Built for BCA Excellence
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E4ECFB', display: 'inline-block' }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E2F5EA', display: 'inline-block' }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FDE8E8', display: 'inline-block' }} />
        </div>
      </footer>
    </div>
  );
}