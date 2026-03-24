'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatsRow } from '@/components/hod/StatsRow';
import { SubjectChart } from '@/components/hod/SubjectChart';
import { AtRiskTable } from '@/components/hod/AtRiskTable';
import { ProgressChart } from '@/components/hod/ProgressChart';
import { ClassManagement } from '@/components/hod/ClassManagement';
import { SyllabusManager } from '@/components/hod/SyllabusManager';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, LayoutDashboard, Users, GraduationCap, BarChart3, Settings, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UploadManager } from '@/components/hod/UploadManager';
import Link from 'next/link';

/* ─────────────────────────────────────────────
   Design tokens — matches landing page system
   Base bg:    #F5F4F0  (warm off-white)
   Text:       #1A1916  (near-black)
   Card:       #FDFCF9  border #E8E6E0
   HOD accent: #5A7AB5  bg #E4ECFB
───────────────────────────────────────────── */

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'classes', label: 'Classes', icon: GraduationCap },  
  { id: 'students', label: 'Student Directory', icon: Users },
  { id: 'subjects', label: 'Syllabus Coverage', icon: BarChart3 },
  { id: 'syllabus-config', label: 'Config Syllabus', icon: Settings },
  { id: 'uploads', label: 'Uploads', icon: Upload },
];

export default function HODPage() {
  const [tab,             setTab]             = useState('overview');
  const [batch,           setBatch]           = useState('BCA 2023');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#F5F4F0', fontFamily: "'DM Sans', sans-serif", color: '#1A1916' }}>

      {/* ── Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,800&family=DM+Serif+Display:ital@0;1&display=swap');

        * { box-sizing: border-box; }

        .hod-sidebar-link {
          display: flex; align-items: center; gap: 12px;
          padding: 0 16px; height: 44px;
          border-radius: 12px;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          cursor: pointer; border: none; width: 100%; text-align: left;
          transition: background 0.18s, color 0.18s;
          position: relative;
          font-family: 'DM Sans', sans-serif;
          text-decoration: none;
        }
        .hod-sidebar-link.inactive {
          background: transparent; color: #9E9B94;
        }
        .hod-sidebar-link.inactive:hover {
          background: rgba(90,122,181,0.08); color: #5A7AB5;
        }
        .hod-sidebar-link.active {
          background: #E4ECFB; color: #5A7AB5;
          border: 1px solid #C8D8F0;
        }

        .hod-card {
          background: #FDFCF9;
          border: 1.5px solid #E8E6E0;
          border-radius: 20px;
        }

        .hod-tag {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 12px; border-radius: 100px;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
        }

        .hod-btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; color: #6B6860;
          border-radius: 10px; font-family: 'DM Sans', sans-serif;
          font-weight: 600; font-size: 12px; padding: 8px 16px;
          border: 1.5px solid #E8E6E0;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
          cursor: pointer; text-decoration: none; white-space: nowrap;
        }
        .hod-btn-ghost:hover { border-color: #C8C6BF; color: #1A1916; background: #FDFCF9; }

        .dot-grid-hod {
          background-image: radial-gradient(circle, #D0CEC8 1px, transparent 1px);
          background-size: 28px 28px;
        }

        .hod-scrollarea::-webkit-scrollbar { width: 4px; }
        .hod-scrollarea::-webkit-scrollbar-track { background: transparent; }
        .hod-scrollarea::-webkit-scrollbar-thumb { background: #E8E6E0; border-radius: 99px; }
        .hod-scrollarea::-webkit-scrollbar-thumb:hover { background: #C8C6BF; }

        /* Mobile overlay */
        .mobile-overlay {
          position: fixed; inset: 0;
          background: rgba(26,25,22,0.4);
          backdrop-filter: blur(4px);
          z-index: 40;
        }

        @media (min-width: 1024px) {
          .sidebar-wrapper  { transform: translateX(0) !important; }
          .mobile-overlay   { display: none !important; }
          .hod-main-content { margin-left: 240px !important; }
        }
      `}</style>

      {/* ── Mobile overlay ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="mobile-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <aside
        className="sidebar-wrapper"
        style={{
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          width: 240,
          backgroundColor: '#FDFCF9',
          borderRight: '1.5px solid #E8E6E0',
          display: 'flex', flexDirection: 'column',
          zIndex: 50,
          transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
        }}
      >
        {/* Wordmark */}
        <div style={{
          height: 64, display: 'flex', alignItems: 'center',
          gap: 10, padding: '0 20px',
          borderBottom: '1.5px solid #E8E6E0',
        }}>
          <div style={{
            width: 32, height: 32, background: '#1A1916', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ color: '#F5F4F0', fontSize: 13, fontWeight: 800, fontFamily: 'DM Serif Display, serif' }}>C</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 400, color: '#1A1916', letterSpacing: '-0.02em', fontFamily: 'DM Serif Display, serif' }}>
              Cursus
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#9E9B94', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              HOD Portal
            </div>
          </div>
          {/* HOD role tag */}
          <span className="hod-tag" style={{ backgroundColor: '#E4ECFB', color: '#5A7AB5', flexShrink: 0 }}>
            HOD
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}
          className="hod-scrollarea"
        >
          {/* Dot-grid texture strip */}
          <div className="dot-grid-hod" style={{
            height: 48, borderRadius: 12, marginBottom: 8, opacity: 0.35,
            maskImage: 'linear-gradient(to right, black 0%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, black 0%, transparent 100%)',
          }} />

          {tabs.map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setIsMobileMenuOpen(false); }}
                className={`hod-sidebar-link ${isActive ? 'active' : 'inactive'}`}
              >
                <t.icon
                  size={16}
                  style={{ flexShrink: 0, color: isActive ? '#5A7AB5' : 'currentColor' }}
                />
                {t.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-indicator"
                    style={{
                      marginLeft: 'auto',
                      width: 6, height: 6, borderRadius: '50%',
                      backgroundColor: '#5A7AB5', flexShrink: 0,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom: back/logout */}
        <div style={{ padding: '12px', borderTop: '1.5px solid #E8E6E0' }}>
          <Link href="/" className="hod-btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
            <ArrowLeft size={13} />
            Back to home
          </Link>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <main style={{
        flex: 1,

        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',

      }}
        className="hod-main-content"
      >

        {/* ── Top header ── */}
        <header style={{
          height: 64, flexShrink: 0,
          backgroundColor: 'rgba(245,244,240,0.88)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #E8E6E0',
          padding: '0 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, zIndex: 10, position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden"
              style={{
                background: 'none', border: '1.5px solid #E8E6E0', borderRadius: 8,
                padding: 6, cursor: 'pointer', color: '#6B6860', flexShrink: 0,
                display: 'flex', alignItems: 'center',
              }}
            >
              <LayoutDashboard size={16} />
            </button>

            {/* Page title */}
            <div style={{ minWidth: 0 }}>
              <h1 style={{
                fontFamily: 'DM Serif Display, serif',
                fontSize: 20, fontWeight: 400,
                letterSpacing: '-0.02em', color: '#1A1916',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {tabs.find((t) => t.id === tab)?.label}
              </h1>
              <p style={{ fontSize: 11, color: '#9E9B94', fontWeight: 500, marginTop: 1 }}>
                HOD Overview · {batch} academic batch
              </p>
            </div>
          </div>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {/* Avatar stack */}
            <div style={{ display: 'flex', alignItems: 'center' }} className="hidden md:flex">
              {[1,2,3,4].map((i) => (
                <div key={i} style={{
                  width: 28, height: 28, borderRadius: '50%',
                  border: '2px solid #F5F4F0',
                  backgroundColor: i % 2 === 0 ? '#E4ECFB' : '#E2F5EA',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 800, color: i % 2 === 0 ? '#5A7AB5' : '#4A9068',
                  marginLeft: i === 1 ? 0 : -8,
                }}>
                  {i}
                </div>
              ))}
            </div>

            {/* Batch select */}
            <Select value={batch} onValueChange={setBatch}>
              <SelectTrigger style={{
                width: 120, height: 36,
                border: '1.5px solid #E8E6E0', backgroundColor: '#FDFCF9',
                borderRadius: 10, fontSize: 11, fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                fontFamily: 'DM Sans, sans-serif', color: '#1A1916',
              }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ borderRadius: 14, border: '1.5px solid #E8E6E0', fontFamily: 'DM Sans, sans-serif' }}>
                <SelectItem value="BCA 2023" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>BCA 2023</SelectItem>
                <SelectItem value="BCA 2024" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>BCA 2024</SelectItem>
              </SelectContent>
            </Select>

            {/* Settings icon button */}
            <button className="hod-btn-ghost" style={{ padding: '8px 10px', gap: 0 }}>
              <Settings size={15} />
            </button>
          </div>
        </header>

        {/* ── Scrollable content ── */}
        <div
          className="hod-scrollarea"
          style={{ flex: 1, overflowY: 'auto', padding: '28px 28px 40px', backgroundColor: '#F5F4F0', position: 'relative' }}
        >
          {/* Dot grid — top fading texture */}
          <div className="dot-grid-hod" style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 200,
            opacity: 0.3, pointerEvents: 'none',
            maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
            zIndex: 0,
          }} />

          <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >

                {/* ── Overview ── */}
                {tab === 'overview' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <StatsRow totalStudents={64} avgCompletion={58} atRisk={12} onTrack={34} />

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                      <div className="hod-card" style={{ padding: '28px 24px' }}>
                        <SectionLabel>Subject Progress</SectionLabel>
                        <SubjectChart />
                      </div>
                      <div className="hod-card" style={{ padding: '28px 24px' }}>
                        <SectionLabel>Batch Velocity</SectionLabel>
                        <ProgressChart />
                      </div>
                    </div>

                    <AtRiskTable />
                  </div>
                )}

                {/* ── Students placeholder ── */}
                {tab === 'students' && (
                  <EmptyState
                    icon={<Users size={52} strokeWidth={1.5} style={{ color: '#C8C6BF' }} />}
                    title="Student Directory"
                    desc={`Detailed reports, individual progress files, and risk alerts for ${batch} will appear here.`}
                  />
                )}

                {/* ── Subjects placeholder ── */}
                {tab === 'subjects' && (
                  <EmptyState
                    icon={<BarChart3 size={52} strokeWidth={1.5} style={{ color: '#C8C6BF' }} />}
                    title="Syllabus Coverage"
                    desc="Review subject-wise coverage bottlenecks and faculty feedback for current semester units."
                  />
                )}

                {/* ── Classes ── */}
                {tab === 'classes' && <ClassManagement />}

                {/* ── Syllabus config ── */}
                {tab === 'syllabus-config' && <SyllabusManager />}


                  {tab === 'uploads' && (
                      <UploadManager />
                  )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Small helpers ── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
      textTransform: 'uppercase', color: '#B0AEA7', marginBottom: 20,
      fontFamily: 'DM Sans, sans-serif',
    }}>
      {children}
    </p>
  );
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '80px 40px', textAlign: 'center', gap: 16,
      border: '1.5px dashed #E8E6E0', borderRadius: 20,
      backgroundColor: '#FDFCF9',
    }}>
      {icon}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
        <div style={{ width: 32, height: 2, backgroundColor: '#E8E6E0', borderRadius: 2 }} />
        <h3 style={{
          fontFamily: 'DM Serif Display, serif', fontSize: 22,
          fontWeight: 400, letterSpacing: '-0.02em', color: '#1A1916',
        }}>
          {title}
        </h3>
        <div style={{ width: 32, height: 2, backgroundColor: '#E8E6E0', borderRadius: 2 }} />
      </div>
      <p style={{ fontSize: 13, color: '#7A7872', maxWidth: 360, lineHeight: 1.65, fontWeight: 400 }}>
        {desc}
      </p>
    </div>
  );
}