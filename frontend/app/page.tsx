'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Layers, Cpu, BarChart3 } from 'lucide-react';

import { ROLE_HOME_ROUTES, type SessionRole } from '@/lib/auth/session';

const roleLabelMap: Record<SessionRole, string> = {
  hod: 'HOD Dashboard',
  staff: 'Staff Portal',
  students: 'Student Portal',
};

export default function LandingPage() {
  const [sessionRole, setSessionRole] = useState<SessionRole | null>(null);
  const [sessionResolved, setSessionResolved] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const response = await fetch('/api/auth/session', { method: 'GET' });
        if (!response.ok) return;

        const data = await response.json();
        if (mounted) {
          setSessionRole((data.role as SessionRole | null) ?? null);
        }
      } catch {
        if (mounted) {
          setSessionRole(null);
        }
      } finally {
        if (mounted) {
          setSessionResolved(true);
        }
      }
    };

    loadSession();

    return () => {
      mounted = false;
    };
  }, []);

  const primaryRole = useMemo(() => sessionRole ?? 'students', [sessionRole]);

  const portalLink = ROLE_HOME_ROUTES[primaryRole];
  const portalLabel = roleLabelMap[primaryRole];

  const showPublicCtas = sessionResolved && !sessionRole;

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setSessionRole(null);
      window.location.reload();
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <header className="border-b border-app-border px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">C</span>
          </div>
          <span className="font-semibold text-app-text text-base tracking-tight">Cursus</span>
        </div>
        <div className="flex items-center gap-3">
          {!sessionResolved ? null : sessionRole ? (
            <>
              <Link href={portalLink}>
                <Button size="sm" className="bg-black text-white hover:bg-neutral-800 rounded-lg font-medium">{portalLabel}</Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="text-app-muted font-medium"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth">
                <Button variant="ghost" size="sm" className="text-app-muted font-medium">Login / Sign up</Button>
              </Link>
              <Link href="/student">
                <Button variant="ghost" size="sm" className="text-app-muted font-medium">Student</Button>
              </Link>
              <Link href="/hod">
                <Button size="sm" className="bg-black text-white hover:bg-neutral-800 rounded-lg font-medium">HOD Dashboard</Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center max-w-3xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 border border-app-border rounded-full text-xs font-medium text-app-muted">
            <Cpu size={12} />
            Powered by Gemini AI
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-app-text leading-tight">
            Stay ahead of<br />
            <span className="text-neutral-400">your syllabus.</span>
          </h1>

          <p className="text-app-muted text-lg font-normal leading-relaxed max-w-xl mx-auto">
            Cursus tracks your BCA syllabus completion, flags what matters most,
            and uses Gemini AI to build you a personalised study plan.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href={portalLink}>
              <Button className="h-11 px-8 bg-black text-white hover:bg-neutral-800 rounded-xl font-medium gap-2">
                {portalLabel} <ArrowRight size={16} />
              </Button>
            </Link>
            {showPublicCtas && (
              <Link href="/hod">
                <Button variant="outline" className="h-11 px-8 rounded-xl font-medium border-app-border text-app-text hover:bg-neutral-50">
                  HOD Dashboard
                </Button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Feature row */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-20 w-full"
        >
          {[
            { icon: Layers, title: 'Syllabus Tracker', desc: 'Mark topics done, see your progress per unit and subject.' },
            { icon: Cpu, title: 'AI Study Plan', desc: 'Gemini generates a day-by-day schedule based on your pace.' },
            { icon: BarChart3, title: 'Risk Analysis', desc: 'Know if you are on track or at risk — weeks before the exam.' },
          ].map((f, i) => (
            <Card key={i} className="text-left p-6 border border-app-border rounded-xl shadow-none bg-neutral-50 hover:bg-white hover:shadow-sm transition-all">
              <f.icon size={20} className="text-app-muted mb-4" />
              <h3 className="font-semibold text-sm text-app-text mb-1">{f.title}</h3>
              <p className="text-xs text-app-muted leading-relaxed">{f.desc}</p>
            </Card>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
