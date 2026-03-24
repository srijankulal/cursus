'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

type AuthMode = 'login' | 'signup';
type Role = 'hod' | 'staff' | 'students';

const roleOptions: Array<{ value: Role; label: string }> = [
  { value: 'hod', label: 'HOD' },
  { value: 'staff', label: 'Staff' },
  { value: 'students', label: 'Students' },
];

const roleRouteMap: Record<Role, string> = {
  hod: '/hod',
  staff: '/staff',
  students: '/student',
};

const roleDescription: Record<Role, string> = {
  hod: 'Manage dashboards and monitor student risk insights.',
  staff: 'Track classes, progress, and academic support actions.',
  students: 'Continue your syllabus tracking and study planning journey.',
};

// HOD → Blue · Staff → Green · Students → Red
const roleColors: Record<Role, { accent: string; bg: string; border: string; rgb: string }> = {
  hod:      { accent: '#5A7AB5', bg: '#E4ECFB', border: '#C8D8F0', rgb: '90,122,181' },
  staff:    { accent: '#4A9068', bg: '#E2F5EA', border: '#B8DEC9', rgb: '74,144,104' },
  students: { accent: '#C06060', bg: '#FDE8E8', border: '#F0C0C0', rgb: '192,96,96'  },
};

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode]           = useState<AuthMode>('login');
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [role, setRole]           = useState<Role>('students');
  const [semester, setSemester]   = useState('1');
  const [rollNumber, setRollNumber] = useState('');
  const [classId, setClassId]     = useState('');
  const [availableClasses, setAvailableClasses] = useState<Array<{ _id: string; name: string }>>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback]   = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | null>(null);

  const colors = roleColors[role];

  const title = useMemo(
    () => (mode === 'login' ? 'Welcome back to Cursus' : 'Create your Cursus account'),
    [mode]
  );

  const subtitle = useMemo(() => {
    const prefix = mode === 'login' ? 'Log in as' : 'Sign up as';
    return `${prefix} ${roleOptions.find((o) => o.value === role)?.label}. ${roleDescription[role]}`;
  }, [mode, role]);

  useEffect(() => {
    async function loadClasses() {
      if (mode !== 'signup' || role !== 'students') {
        setAvailableClasses([]); setClassId(''); return;
      }
      setIsLoadingClasses(true);
      try {
        const res  = await fetch(`/api/auth/signup/classes?semester=${encodeURIComponent(semester)}`);
        const data = await res.json();
        if (!res.ok) { setAvailableClasses([]); setClassId(''); return; }
        const cls  = Array.isArray(data.classes) ? (data.classes as Array<{ _id: string; name: string }>) : [];
        setAvailableClasses(cls);
        if (cls.length === 0) { setClassId(''); return; }
        if (!cls.some((c) => c._id === classId)) setClassId(cls[0]._id);
      } catch {
        setAvailableClasses([]); setClassId('');
      } finally {
        setIsLoadingClasses(false);
      }
    }
    void loadClasses();
  }, [mode, role, semester, classId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true); setFeedback(null); setFeedbackType(null);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const payload  = mode === 'login'
        ? { email, password, role }
        : {
            name, email, password, role,
            semester:   role === 'students' ? Number(semester)      : undefined,
            rollNumber: role === 'students' ? rollNumber             : undefined,
            classId:    role === 'students' ? classId || undefined   : undefined,
          };

      const res  = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) { setFeedback(data.message ?? 'Request failed.'); setFeedbackType('error'); return; }

      if (mode === 'signup') {
        setFeedback('Account created. You can now log in.');
        setFeedbackType('success');
        setRollNumber(''); setClassId(''); setMode('login');
        return;
      }
      setFeedbackType('success');
      setFeedback('Login successful. Redirecting…');
      const userRole = (data.user?.role as Role | undefined) ?? role;
      const userId   = data.user?.id as string | undefined;
      if (userId) localStorage.setItem('userId', userId);
      router.push(roleRouteMap[userRole]);
    } catch {
      setFeedback('Something went wrong. Please try again.'); setFeedbackType('error');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Shared input style matching landing-page aesthetic
  const inputStyle: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    borderColor: '#E8E6E0',
    backgroundColor: '#F5F4F0',
    color: '#1A1916',
    borderRadius: 10,
    height: 40,
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    border: '1px solid #E8E6E0',
    padding: '0 12px',
    width: '100%',
    appearance: 'none' as const,
    cursor: 'pointer',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F5F4F0',
        color: '#1A1916',
        fontFamily: "'DM Sans', sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Google Fonts + shared styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap');

        .auth-wordmark  { font-family: 'DM Serif Display', serif; }
        .auth-display   { font-family: 'DM Serif Display', serif; }

        .auth-card {
          background: #FDFCF9;
          border: 1.5px solid #E8E6E0;
          border-radius: 20px;
          box-shadow: 0 4px 24px rgba(26,25,22,0.06);
        }

        .auth-tag {
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

        .auth-btn-primary {
          background: #1A1916;
          color: #F5F4F0;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          font-size: 13px;
          padding: 10px 22px;
          border: none;
          transition: background 0.2s, transform 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          text-decoration: none;
          width: 100%;
          justify-content: center;
          height: 42px;
        }
        .auth-btn-primary:hover:not(:disabled)  { background: #2E2D29; transform: translateY(-1px); }
        .auth-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .auth-btn-primary:disabled              { background: #C8C6BF; cursor: not-allowed; }

        .auth-btn-ghost {
          background: transparent;
          color: #6B6860;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
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
        .auth-btn-ghost:hover { border-color: #C8C6BF; color: #1A1916; background: #FDFCF9; }

        .role-pill {
          display: inline-flex;
          align-items: center;
          padding: 6px 16px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
          border: 1.5px solid transparent;
        }
        .role-pill:hover { opacity: 0.85; transform: scale(1.02); }

        .auth-input:focus {
          outline: none;
          box-shadow: 0 0 0 2.5px rgba(var(--role-rgb), 0.18);
        }

        .dot-grid-auth {
          background-image: radial-gradient(circle, #D0CEC8 1px, transparent 1px);
          background-size: 28px 28px;
        }

        .divider-line {
          width: 32px; height: 2px;
          background: #E8E6E0;
          border-radius: 2px;
        }
      `}</style>

      {/* ── Nav ── */}
      <header style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 50,
        backgroundColor: 'rgba(245,244,240,0.88)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E8E6E0',
        padding: '0 32px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Wordmark */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 32, height: 32,
            background: '#1A1916', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#F5F4F0', fontSize: 13, fontWeight: 800, fontFamily: 'DM Serif Display, serif' }}>C</span>
          </div>
          <span className="auth-wordmark" style={{ fontSize: 20, fontWeight: 400, color: '#1A1916', letterSpacing: '-0.02em' }}>
            Cursus
          </span>
        </Link>

        {/* Mode toggle in nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => setMode('login')}
            className="auth-btn-ghost"
            style={mode === 'login' ? { borderColor: '#1A1916', color: '#1A1916' } : {}}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className="auth-btn-ghost"
            style={mode === 'signup' ? { borderColor: '#1A1916', color: '#1A1916' } : {}}
          >
            Sign up
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        paddingBottom: 80,
        position: 'relative',
      }}>

        {/* Dot grid — top center */}
        <div
          className="dot-grid-auth"
          style={{
            position: 'absolute', top: 0, left: '50%',
            transform: 'translateX(-50%)',
            width: 600, height: 300,
            opacity: 0.45,
            pointerEvents: 'none',
            maskImage: 'radial-gradient(ellipse 60% 80% at 50% 0%, black 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 60% 80% at 50% 0%, black 40%, transparent 100%)',
            zIndex: 0,
          }}
        />

        {/* Role-tinted ambient blob */}
        <motion.div
          key={role + '-blob'}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          style={{
            position: 'absolute',
            top: '10%', left: '50%',
            transform: 'translateX(-50%)',
            width: 480, height: 480,
            borderRadius: '50%',
            backgroundColor: `rgba(${colors.rgb},0.07)`,
            filter: 'blur(80px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 460, padding: '0 20px' }}>

          {/* ── Role pills — above card ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}
          >
            {roleOptions.map((opt) => {
              const c = roleColors[opt.value];
              const isActive = role === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  className="role-pill"
                  style={{
                    backgroundColor: isActive ? c.bg : 'transparent',
                    color: isActive ? c.accent : '#9E9B94',
                    borderColor: isActive ? c.border : '#E8E6E0',
                    boxShadow: isActive ? `0 2px 8px rgba(${c.rgb},0.2)` : 'none',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </motion.div>

          {/* ── Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Role-accent top bar */}
            <motion.div
              key={role + '-bar'}
              style={{
                height: 3,
                borderRadius: '20px 20px 0 0',
                backgroundColor: colors.accent,
                transition: 'background-color 0.3s ease',
              }}
            />

            <div className="auth-card" style={{ borderRadius: '0 0 20px 20px', borderTop: 'none', padding: '32px 32px 28px' }}>

              {/* Header */}
              <div style={{ marginBottom: 28 }}>
                {/* Role tag */}
                <span
                  className="auth-tag"
                  style={{ backgroundColor: colors.bg, color: colors.accent, marginBottom: 14, display: 'inline-flex' }}
                >
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%',
                    backgroundColor: colors.accent, display: 'inline-block',
                  }} />
                  {roleOptions.find((o) => o.value === role)?.label}
                </span>

                {/* Title */}
                <h1
                  className="auth-display"
                  style={{
                    fontSize: 28, fontWeight: 400, letterSpacing: '-0.02em',
                    color: '#1A1916', lineHeight: 1.15, marginBottom: 8,
                  }}
                >
                  {mode === 'login'
                    ? <>Welcome back <em style={{ color: '#9E9B94', fontStyle: 'italic' }}>to Cursus</em></>
                    : <>Create your <em style={{ color: '#9E9B94', fontStyle: 'italic' }}>Cursus account</em></>
                  }
                </h1>

                <p style={{ fontSize: 13, color: '#7A7872', lineHeight: 1.6 }}>
                  {subtitle}
                </p>
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                <div className="divider-line" style={{ flex: 1, width: 'auto' }} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: '#B0AEA7', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  {mode === 'login' ? 'Sign in' : 'Your details'}
                </span>
                <div className="divider-line" style={{ flex: 1, width: 'auto' }} />
              </div>

              {/* ── Form ── */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {mode === 'signup' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B6860', marginBottom: 6, letterSpacing: '0.02em' }} htmlFor="name">
                      Full name
                    </label>
                    <Input
                      id="name" className="auth-input" value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Mathew" required
                      style={{ ...inputStyle, '--role-rgb': colors.rgb } as React.CSSProperties}
                      onFocus={(e) => (e.currentTarget.style.borderColor = colors.accent)}
                      onBlur={(e)  => (e.currentTarget.style.borderColor = '#E8E6E0')}
                    />
                  </div>
                )}

                {mode === 'signup' && role === 'students' && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B6860', marginBottom: 6, letterSpacing: '0.02em' }} htmlFor="semester">
                        Semester
                      </label>
                      <select
                        id="semester" value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        style={selectStyle} required
                        onFocus={(e) => (e.currentTarget.style.borderColor = colors.accent)}
                        onBlur={(e)  => (e.currentTarget.style.borderColor = '#E8E6E0')}
                      >
                        {[1,2,3,4,5,6].map((v) => (
                          <option key={v} value={String(v)}>Semester {v}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B6860', marginBottom: 6, letterSpacing: '0.02em' }} htmlFor="rollNumber">
                        Roll number
                      </label>
                      <Input
                        id="rollNumber" className="auth-input" value={rollNumber}
                        onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                        placeholder="BCA24-001" required
                        style={{ ...inputStyle, '--role-rgb': colors.rgb } as React.CSSProperties}
                        onFocus={(e) => (e.currentTarget.style.borderColor = colors.accent)}
                        onBlur={(e)  => (e.currentTarget.style.borderColor = '#E8E6E0')}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B6860', marginBottom: 6, letterSpacing: '0.02em' }} htmlFor="classId">
                        Class
                      </label>
                      <select
                        id="classId" value={classId}
                        onChange={(e) => setClassId(e.target.value)}
                        style={{ ...selectStyle, opacity: (isLoadingClasses || availableClasses.length === 0) ? 0.5 : 1 }}
                        disabled={isLoadingClasses || availableClasses.length === 0}
                        onFocus={(e) => (e.currentTarget.style.borderColor = colors.accent)}
                        onBlur={(e)  => (e.currentTarget.style.borderColor = '#E8E6E0')}
                      >
                        {availableClasses.length === 0 ? (
                          <option value="">{isLoadingClasses ? 'Loading classes…' : 'No class available'}</option>
                        ) : (
                          availableClasses.map((c) => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                          ))
                        )}
                      </select>
                      <p style={{ fontSize: 11, color: '#B0AEA7', marginTop: 5 }}>
                        Selecting a class is optional during signup.
                      </p>
                    </div>
                  </>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B6860', marginBottom: 6, letterSpacing: '0.02em' }} htmlFor="email">
                    Email
                  </label>
                  <Input
                    id="email" type="email" className="auth-input" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" required
                    style={{ ...inputStyle, '--role-rgb': colors.rgb } as React.CSSProperties}
                    onFocus={(e) => (e.currentTarget.style.borderColor = colors.accent)}
                    onBlur={(e)  => (e.currentTarget.style.borderColor = '#E8E6E0')}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B6860', marginBottom: 6, letterSpacing: '0.02em' }} htmlFor="password">
                    Password
                  </label>
                  <Input
                    id="password" type="password" className="auth-input" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters" minLength={8} required
                    style={{ ...inputStyle, '--role-rgb': colors.rgb } as React.CSSProperties}
                    onFocus={(e) => (e.currentTarget.style.borderColor = colors.accent)}
                    onBlur={(e)  => (e.currentTarget.style.borderColor = '#E8E6E0')}
                  />
                </div>

                {/* Feedback */}
                <AnimatePresence>
                  {feedback && (
                    <motion.p
                      key="feedback"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      style={{
                        fontSize: 12, fontWeight: 600,
                        padding: '10px 14px',
                        borderRadius: 10,
                        ...(feedbackType === 'success'
                          ? { background: '#E2F5EA', color: '#4A9068', border: '1px solid #B8DEC9' }
                          : { background: '#FDE8E8', color: '#C06060', border: '1px solid #F0C0C0' }),
                      }}
                    >
                      {feedback}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="auth-btn-primary"
                  style={{
                    marginTop: 4,
                    backgroundColor: isSubmitting ? '#C8C6BF' : '#1A1916',
                  }}
                >
                  {isSubmitting ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create account'}
                  {!isSubmitting && <ArrowRight size={14} />}
                </button>

                {/* Switch mode link */}
                <p style={{ textAlign: 'center', fontSize: 12, color: '#9E9B94', marginTop: 2 }}>
                  {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                    style={{
                      background: 'none', border: 'none', padding: 0,
                      fontSize: 12, fontWeight: 700, color: '#1A1916',
                      cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                      textDecoration: 'underline',
                    }}
                  >
                    {mode === 'login' ? 'Sign up' : 'Log in'}
                  </button>
                </p>
              </form>
            </div>
          </motion.div>

          {/* Role dots — below card, matching footer style */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}
          >
            {roleOptions.map((opt) => (
              <span
                key={opt.value}
                style={{
                  width: 8, height: 8, borderRadius: '50%',
                  backgroundColor: roleColors[opt.value].bg,
                  display: 'inline-block',
                  border: `1.5px solid ${roleColors[opt.value].border}`,
                  transition: 'transform 0.2s',
                  transform: role === opt.value ? 'scale(1.5)' : 'scale(1)',
                }}
              />
            ))}
          </motion.div>

        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid #E8E6E0',
        padding: '20px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 10,
      }}>
        <span className="auth-wordmark" style={{ fontSize: 15, color: '#B0AEA7', fontWeight: 400 }}>
          Cursus
        </span>
        <Link href="/" className="auth-btn-ghost" style={{ fontSize: 12, padding: '6px 14px', height: 'auto' }}>
          ← Back to home
        </Link>
      </footer>
    </div>
  );
} 